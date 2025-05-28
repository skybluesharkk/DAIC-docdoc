const express = require('express');
const WebSocket = require('ws');
const db = require('../lib/db.connect');

// LLM Socket 서버 설정
const LLM_SERVER_URL = process.env.LLM_SERVER_URL || 'ws://localhost:8000/ws';
let llmSocket = null;
let isConnecting = false;
let reconnectInterval = null;
const RECONNECT_DELAY = 5000; // 5초 후 재연결 시도

// 활성 소켓 클라이언트들을 추적 (채팅 세션 및 스트리밍 상태 포함)
const activeClients = new Map();

// 스트리밍 세션 관리
const streamingSessions = new Map();

// 채팅 세션 생성
function createChatSession(userUuid, callback) {
    const title = '새 채팅'; // 기본 제목
    const query = 'INSERT INTO user_chat_logs (title, user_uuid, logs) VALUES (?, UUID_TO_BIN(?), ?)';
    
    db.query(query, [title, userUuid, JSON.stringify([])], (error, result) => {
        if (error) {
            console.error('채팅 세션 생성 오류:', error);
            return callback(null);
        }
        
        callback(result.insertId);
    });
}

// 채팅 제목 업데이트 (첫 사용자 메시지로)
function updateChatTitle(chatId, title) {
    if (!chatId || !title) return;
    
    // 제목을 50자로 제한
    const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
    
    const query = 'UPDATE user_chat_logs SET title = ? WHERE id = ?';
    db.query(query, [truncatedTitle, chatId], (error) => {
        if (error) {
            console.error('채팅 제목 업데이트 오류:', error);
        }
    });
}

// 채팅 로그 저장
function saveChatMessage(chatId, text, sender, isFirstUserMessage = false) {
    if (!chatId) return;
    
    // 첫 사용자 메시지인 경우 제목 업데이트
    if (isFirstUserMessage && sender === 0) {
        updateChatTitle(chatId, text);
    }
    
    // 현재 로그 조회
    const selectQuery = 'SELECT logs FROM user_chat_logs WHERE id = ?';
    
    db.query(selectQuery, [chatId], (error, results) => {
        if (error || results.length === 0) {
            console.error('채팅 로그 조회 오류:', error);
            return;
        }
        
        let logs = [];
        try {
            logs = JSON.parse(results[0].logs);
        } catch (e) {
            logs = [];
        }
        
        // 새 메시지 추가
        logs.push({
            text: text,
            sender: sender, // 0: user, 1: bot
            timestamp: new Date().toISOString()
        });
        
        // 로그 업데이트
        const updateQuery = 'UPDATE user_chat_logs SET logs = ? WHERE id = ?';
        db.query(updateQuery, [JSON.stringify(logs), chatId], (error) => {
            if (error) {
                console.error('채팅 로그 저장 오류:', error);
            }
        });
    });
}

// 스트리밍 세션 시작
function startStreamingSession(clientId) {
    streamingSessions.set(clientId, {
        tokens: [],
        isStreaming: true,
        startTime: Date.now()
    });
    
    const clientInfo = activeClients.get(clientId);
    if (clientInfo) {
        clientInfo.socket.emit('chat:stream_start', {
            timestamp: new Date().toISOString()
        });
    }
}

// 스트리밍 토큰 처리
function handleStreamingToken(clientId, token) {
    const session = streamingSessions.get(clientId);
    const clientInfo = activeClients.get(clientId);
    
    if (session && clientInfo) {
        session.tokens.push(token);
        
        // 실시간으로 토큰 전송
        clientInfo.socket.emit('chat:stream_token', {
            token: token,
            timestamp: new Date().toISOString()
        });
    }
}

// 스트리밍 세션 종료
function endStreamingSession(clientId, finalMessage = null) {
    const session = streamingSessions.get(clientId);
    const clientInfo = activeClients.get(clientId);
    
    if (session && clientInfo) {
        const fullMessage = finalMessage || session.tokens.join('');
        
        // 봇 응답 저장
        saveChatMessage(clientInfo.chatId, fullMessage, 1);
        
        // 스트리밍 완료 신호 전송
        clientInfo.socket.emit('chat:stream_end', {
            message: fullMessage,
            timestamp: new Date().toISOString(),
            duration: Date.now() - session.startTime
        });
        
        // 세션 정리
        streamingSessions.delete(clientId);
    }
}

// LLM 서버에 연결하는 함수
function connectToLLMServer() {
    if (isConnecting || (llmSocket && llmSocket.readyState === WebSocket.OPEN)) {
        return;
    }
    
    isConnecting = true;
    console.log('LLM 서버에 연결 시도 중...', LLM_SERVER_URL);
    
    try {
        llmSocket = new WebSocket(LLM_SERVER_URL);
        
        llmSocket.on('open', () => {
            console.log('LLM 서버에 성공적으로 연결되었습니다.');
            isConnecting = false;
            
            // 재연결 인터벌 클리어
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        });
        
        llmSocket.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                console.log('LLM 서버로부터 응답 받음:', response);
                
                if (response.clientId && activeClients.has(response.clientId)) {
                    const clientId = response.clientId;
                    const clientInfo = activeClients.get(clientId);
                    
                    console.log(`클라이언트 ${clientId}에게 응답 전송 중...`);
                    
                    // 스트리밍 응답 처리
                    if (response.type === 'token') {
                        console.log(`토큰 전송: "${response.content}"`);
                        // 첫 토큰이면 스트리밍 세션 시작
                        if (!streamingSessions.has(clientId)) {
                            startStreamingSession(clientId);
                        }
                        handleStreamingToken(clientId, response.content);
                        
                    } else if (response.type === 'stream_end') {
                        console.log('스트리밍 완료:', response.content);
                        // 스트리밍 완료
                        endStreamingSession(clientId, response.content);
                        
                    } else if (response.type === 'error') {
                        console.error('LLM 서버 에러:', response.content);
                        // 에러 처리
                        if (clientInfo) {
                            clientInfo.socket.emit('chat:error', {
                                error: response.content || '응답 생성 중 오류가 발생했습니다.',
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        // 스트리밍 세션이 있다면 정리
                        if (streamingSessions.has(clientId)) {
                            streamingSessions.delete(clientId);
                        }
                        
                    } else if (response.message) {
                        // 기존 방식 (비스트리밍) 호환성 유지
                        console.log('비스트리밍 응답:', response.message);
                        if (clientInfo) {
                            saveChatMessage(clientInfo.chatId, response.message, 1);
                            clientInfo.socket.emit('chat:response', {
                                message: response.message,
                                timestamp: new Date().toISOString()
                            });
                            console.log(`클라이언트 ${clientId}에게 비스트리밍 응답 전송 완료`);
                        }
                    } else {
                        console.warn('알 수 없는 응답 형식:', response);
                        // 알 수 없는 형식의 응답 처리
                        if (clientInfo) {
                            clientInfo.socket.emit('chat:error', {
                                error: '알 수 없는 응답 형식입니다.',
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                } else {
                    console.warn('유효하지 않은 클라이언트 ID 또는 비활성 클라이언트:', response.clientId);
                    console.log('활성 클라이언트 목록:', Array.from(activeClients.keys()));
                }
            } catch (error) {
                console.error('LLM 응답 파싱 오류:', error);
                console.error('원본 데이터:', data.toString());
                
                // 파싱 오류 시 모든 활성 클라이언트에게 에러 전송
                activeClients.forEach((clientInfo, clientId) => {
                    clientInfo.socket.emit('chat:error', {
                        error: 'LLM 서버 응답 파싱 오류가 발생했습니다.',
                        timestamp: new Date().toISOString()
                    });
                });
            }
        });
        
        llmSocket.on('error', (error) => {
            console.error('LLM 서버 연결 오류:', error);
            isConnecting = false;
            scheduleReconnect();
        });
        
        llmSocket.on('close', (code, reason) => {
            console.log(`LLM 서버 연결이 끊어졌습니다. Code: ${code}, Reason: ${reason}`);
            isConnecting = false;
            llmSocket = null;
            scheduleReconnect();
        });
        
    } catch (error) {
        console.error('LLM 서버 연결 시도 중 오류:', error);
        isConnecting = false;
        scheduleReconnect();
    }
}

// 재연결 스케줄링
function scheduleReconnect() {
    if (reconnectInterval) {
        return; // 이미 재연결이 스케줄되어 있음
    }
    
    console.log(`${RECONNECT_DELAY/1000}초 후 LLM 서버 재연결 시도...`);
    reconnectInterval = setInterval(() => {
        connectToLLMServer();
    }, RECONNECT_DELAY);
}

// LLM 서버에 메시지 전송 (스트리밍 요청)
function sendToLLMServer(clientId, message) {
    console.log(`LLM 서버로 메시지 전송 시도 - 클라이언트: ${clientId}, 메시지: "${message}"`);
    
    if (!llmSocket || llmSocket.readyState !== WebSocket.OPEN) {
        console.log('LLM 서버가 연결되지 않았습니다. 재연결 시도 중...');
        console.log('현재 WebSocket 상태:', llmSocket ? llmSocket.readyState : 'null');
        connectToLLMServer();
        
        // 클라이언트에게 연결 상태 알림
        const clientInfo = activeClients.get(clientId);
        if (clientInfo) {
            clientInfo.socket.emit('chat:error', {
                error: 'LLM 서버에 연결되지 않았습니다. 재연결을 시도하고 있습니다.',
                timestamp: new Date().toISOString()
            });
        }
        return false;
    }
    
    try {
        const payload = {
            type: 'question',
            content: message,
            clientId: clientId,
            timestamp: new Date().toISOString()
        };
        
        llmSocket.send(JSON.stringify(payload));
        console.log('LLM 서버로 메시지 전송 성공:', payload);
        return true;
    } catch (error) {
        console.error('LLM 서버로 메시지 전송 실패:', error);
        
        // 클라이언트에게 전송 실패 알림
        const clientInfo = activeClients.get(clientId);
        if (clientInfo) {
            clientInfo.socket.emit('chat:error', {
                error: 'LLM 서버로 메시지 전송에 실패했습니다.',
                timestamp: new Date().toISOString()
            });
        }
        return false;
    }
}

module.exports = (app, io) => {
    const router = express.Router();
    
    // 서버 시작 시 LLM 서버에 연결
    connectToLLMServer();
    
    // Socket.IO 이벤트 핸들러 등록
    io.on('connection', (socket) => {
        // 사용자 UUID 가져오기 (main.js에서 인증 후 설정됨)
        const getUserUuid = () => {
            // access key로 user uuid 조회
            const accessKey = socket.handshake.auth?.accessKey || socket.handshake.query?.accessKey;
            return new Promise((resolve) => {
                const query = `
                    SELECT BIN_TO_UUID(user_uuid) as user_uuid 
                    FROM user_access_key 
                    WHERE access_key = UUID_TO_BIN(?)
                `;
                
                db.query(query, [accessKey], (error, results) => {
                    if (error || results.length === 0) {
                        resolve(null);
                    } else {
                        resolve(results[0].user_uuid);
                    }
                });
            });
        };
        
        // 채팅 세션 초기화
        getUserUuid().then(userUuid => {
            if (!userUuid) {
                console.error('사용자 UUID를 찾을 수 없습니다:', socket.id);
                return;
            }
            
            createChatSession(userUuid, (chatId) => {
                // 클라이언트 정보 저장
                activeClients.set(socket.id, {
                    socket: socket,
                    userUuid: userUuid,
                    chatId: chatId,
                    isStreaming: false
                });
                
                console.log(`클라이언트 ${socket.id}가 채팅에 연결되었습니다. Chat ID: ${chatId}`);
                
                // 연결 확인 메시지 전송
                socket.emit('chat:connected', {
                    chatId: chatId,
                    streamingEnabled: true,
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        // 채팅 메시지 수신 처리
        socket.on('chat:message', (data) => {
            console.log(`클라이언트 ${socket.id}로부터 메시지 받음:`, data);
            
            if (!data || !data.message) {
                socket.emit('chat:error', { 
                    error: '메시지가 비어있습니다.',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            
            const clientInfo = activeClients.get(socket.id);
            if (!clientInfo) {
                socket.emit('chat:error', { 
                    error: '클라이언트 정보를 찾을 수 없습니다.',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            
            // 이미 스트리밍 중인지 확인
            if (streamingSessions.has(socket.id)) {
                socket.emit('chat:error', { 
                    error: '이미 응답을 생성 중입니다. 잠시 후 다시 시도해주세요.',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            
            // 현재 채팅의 메시지 개수 확인하여 첫 메시지인지 판단
            const selectQuery = 'SELECT logs FROM user_chat_logs WHERE id = ?';
            
            db.query(selectQuery, [clientInfo.chatId], (error, results) => {
                if (error || results.length === 0) {
                    console.error('채팅 로그 조회 오류:', error);
                    return;
                }
                
                let logs = [];
                try {
                    logs = JSON.parse(results[0].logs);
                } catch (e) {
                    logs = [];
                }
                
                // 첫 사용자 메시지인지 확인 (기존 로그가 비어있으면 첫 메시지)
                const isFirstUserMessage = logs.length === 0;
                
                // 사용자 메시지 저장
                saveChatMessage(clientInfo.chatId, data.message, 0, isFirstUserMessage);
                
                // 메시지 수신 확인 전송
                socket.emit('chat:message_received', {
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
            });
            
            // LLM 서버로 메시지 전송
            const success = sendToLLMServer(socket.id, data.message);
            
            if (!success) {
                socket.emit('chat:error', { 
                    error: 'LLM 서버와의 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // 스트리밍 중단 요청 처리
        socket.on('chat:stop_streaming', () => {
            if (streamingSessions.has(socket.id)) {
                const session = streamingSessions.get(socket.id);
                const partialMessage = session.tokens.join('');
                
                // 부분 응답으로 저장
                if (partialMessage) {
                    const clientInfo = activeClients.get(socket.id);
                    if (clientInfo) {
                        saveChatMessage(clientInfo.chatId, partialMessage + ' [중단됨]', 1);
                    }
                }
                
                streamingSessions.delete(socket.id);
                
                socket.emit('chat:stream_stopped', {
                    message: partialMessage,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`클라이언트 ${socket.id}가 스트리밍을 중단했습니다.`);
            }
        });
        
        // 클라이언트 연결 해제 처리
        socket.on('disconnect', () => {
            // 스트리밍 세션 정리
            if (streamingSessions.has(socket.id)) {
                streamingSessions.delete(socket.id);
            }
            
            activeClients.delete(socket.id);
            console.log(`클라이언트 ${socket.id}가 채팅에서 연결 해제되었습니다.`);
        });
    });
    
    // 채팅 기록 조회 API
    router.get('/history/:userUuid', (req, res) => {
        const userUuid = req.params.userUuid;
        const accessKey = req.headers['x-access-key'] || req.query.accessKey;
        
        if (!accessKey) {
            return res.status(401).json({ error: 'Access key가 필요합니다.' });
        }
        
        // access key 검증
        const authQuery = `
            SELECT BIN_TO_UUID(user_uuid) as user_uuid 
            FROM user_access_key 
            WHERE access_key = UUID_TO_BIN(?)
        `;
        
        db.query(authQuery, [accessKey], (error, authResults) => {
            if (error || authResults.length === 0 || authResults[0].user_uuid !== userUuid) {
                return res.status(401).json({ error: '권한이 없습니다.' });
            }
            
            // 채팅 기록 조회
            const query = `
                SELECT id, title, logs, created_at 
                FROM user_chat_logs 
                WHERE user_uuid = UUID_TO_BIN(?) 
                ORDER BY created_at DESC
            `;
            
            db.query(query, [userUuid], (error, results) => {
                if (error) {
                    console.error('채팅 기록 조회 오류:', error);
                    return res.status(500).json({ error: '서버 오류' });
                }
                
                const chatHistory = results.map(row => ({
                    id: row.id,
                    title: row.title,
                    logs: JSON.parse(row.logs),
                    createdAt: row.created_at
                }));
                
                res.json({ chatHistory });
            });
        });
    });
    
    // 헬스체크 엔드포인트
    router.get('/health', (req, res) => {
        const isLLMConnected = llmSocket && llmSocket.readyState === WebSocket.OPEN;
        res.json({
            status: 'ok',
            llmServerConnected: isLLMConnected,
            activeClients: activeClients.size,
            timestamp: new Date().toISOString()
        });
    });
    
    // LLM 서버 연결 상태 확인
    router.get('/llm-status', (req, res) => {
        const status = {
            connected: llmSocket && llmSocket.readyState === WebSocket.OPEN,
            connecting: isConnecting,
            url: LLM_SERVER_URL,
            readyState: llmSocket ? llmSocket.readyState : null,
            activeClients: activeClients.size
        };
        res.json(status);
    });
    
    // 수동으로 LLM 서버 재연결 시도
    router.post('/reconnect-llm', (req, res) => {
        console.log('수동 LLM 서버 재연결 요청');
        connectToLLMServer();
        res.json({ message: 'LLM 서버 재연결 시도 중...' });
    });
    
    return router;
};
