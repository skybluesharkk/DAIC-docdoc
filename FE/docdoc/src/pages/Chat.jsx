import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { io } from 'socket.io-client';
import { getChatHistory } from '../api/ragApi';

const StDiv = styled.div`
  margin-top:1rem;
  display: flex;
  height: calc(100vh - 3rem);
  padding: 1.5rem;
  gap: 1rem;
  background-color: #f6faff;
  box-sizing: border-box;
`;

const StSideNavi = styled.div`
  flex: 0 0 30%;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
`;

const NavItem = styled.div`
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  background: ${p => p.active ? '#efefef' : 'transparent'};
  &:hover { background: #f5f5f5; }
`;

const StSecondBox = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 10px;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1.5px solid grey;
  border-radius: 10px;
  padding: 0.5rem;
  overflow: hidden;
`;

const MessageList = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f5f4f6;
  border-radius: 4px;
`;

const MessageItem = styled.div`
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: ${p => p.role === 'user' ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.div`
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  background-color: ${p => p.role === 'user' ? '#4f8ef7' : '#e0e0e0'};
  color: ${p => p.role === 'user' ? 'white' : 'black'};
  white-space: pre-wrap;
  line-height: 1.5;
`;

const InputContainer = styled.div`
  display: flex;
  margin-top: 8px;
`;

const TextField = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
`;

const SendButton = styled.button`
  margin-left: 8px;
  padding: 0 16px;
  background-color: #4f8ef7;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export default function Chat() {
  const { userId } = useParams();

  // A) 세션 히스토리 & 선택
  const [history, setHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // B) 현재 메시지
  const [messages, setMessages] = useState([]);

  // C) 입력 / 로딩 / 소켓 / 스크롤 ref
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  // ─── A) 히스토리 조회 ────────────────────────────────────
  useEffect(() => {
    getChatHistory(userId)
      .then(res => {
        const chatHistory = res.data?.chatHistory || [];
        
        // 서버 응답 구조에 맞게 히스토리 데이터 변환
        const formattedHistory = chatHistory.map(chat => ({
          sessionId: chat.id,
          title: chat.title,
          messages: chat.logs.map(log => ({
            role: log.sender === 0 ? 'user' : 'assistant',
            content: log.text,
            timestamp: log.timestamp
          })),
          createdAt: chat.createdAt
        }));
        
        setHistory(formattedHistory);
        if (formattedHistory.length > 0) {
          setSelectedSession(formattedHistory[0]);
        }
      })
      .catch(error => {
        console.error('History fetch error:', error.response?.data?.error || error.message);
      });
  }, [userId]);

  // ─── B) 세션 변경 시 불러오기 ─────────────────────────────
  useEffect(() => {
    if (selectedSession?.messages) {
      setMessages(selectedSession.messages);
    } else {
      setMessages([]);
    }
  }, [selectedSession]);

  // ─── C) Socket.IO 연결 ──────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    
    const socket = io(import.meta.env.VITE_BASE_URL, {
      auth: {
        accessKey: import.meta.env.VITE_ACCESS_KEY
      },
      query: {
        accessKey: import.meta.env.VITE_ACCESS_KEY
      }
    });
    
    socketRef.current = socket;

    // 연결 성공
    socket.on('connect', () => {
      console.log('Socket.IO 연결됨');
    });

    // 채팅 연결 확인
    socket.on('chat:connected', (data) => {
      console.log('채팅 연결됨:', data);
      setCurrentChatId(data.chatId);
    });

    // 메시지 수신 확인
    socket.on('chat:message_received', (data) => {
      console.log('메시지 수신 확인:', data);
    });

    // 스트리밍 시작
    socket.on('chat:stream_start', (data) => {
      console.log('스트리밍 시작:', data);
    });

    // 스트리밍 토큰 수신
    socket.on('chat:stream_token', (data) => {
      setMessages(prev => {
        const newMessages = [...prev];
        let lastMessage = newMessages[newMessages.length - 1];
        
        // 마지막 메시지가 assistant의 것이 아니면 새 메시지 생성
        if (!lastMessage || lastMessage.role !== 'assistant') {
          lastMessage = { role: 'assistant', content: '' };
          newMessages.push(lastMessage);
        }
        
        // 토큰 추가
        lastMessage.content += data.token;
        return newMessages;
      });
    });

    // 스트리밍 완료
    socket.on('chat:stream_end', (data) => {
      console.log('스트리밍 완료:', data);
      setLoading(false);
      
      // 마지막 메시지만 업데이트
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = data.message;
        }
        return newMessages;
      });
      
      // 히스토리 새로고침
      refreshHistory();
    });

    // 비스트리밍 응답 (호환성)
    socket.on('chat:response', (data) => {
      console.log('응답 받음:', data);
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      // 히스토리 새로고침
      refreshHistory();
    });

    // 에러 처리
    socket.on('chat:error', (data) => {
      console.error('채팅 에러:', data);
      setLoading(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `오류: ${data.error}` 
      }]);
    });

    // 스트리밍 중단됨
    socket.on('chat:stream_stopped', (data) => {
      console.log('스트리밍 중단됨:', data);
      setLoading(false);
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('Socket.IO 연결 해제됨');
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // 히스토리 새로고침 함수
  const refreshHistory = () => {
    const accessKey = import.meta.env.VITE_ACCESS_KEY;
    
    axios.get(
      `${import.meta.env.VITE_BASE_URL}/history/${userId}`,
      { 
        headers: { 'x-access-key': accessKey },
        params: { accessKey }
      }
    )
    .then(res => {
      const chatHistory = res.data?.chatHistory || [];
      
      // 서버 응답 구조에 맞게 히스토리 데이터 변환
      const formattedHistory = chatHistory.map(chat => ({
        sessionId: chat.id,
        title: chat.title,
        messages: chat.logs.map(log => ({
          role: log.sender === 0 ? 'user' : 'assistant',
          content: log.text,
          timestamp: log.timestamp
        })),
        createdAt: chat.createdAt
      }));
      
      setHistory(formattedHistory);
    })
    .catch(error => {
      console.error('History refresh error:', error.response?.data?.error || error.message);
    });
  };

  // ─── D) 내부 스크롤 자동내려감 ──────────────────────────
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 메시지 전송 시 형식 변환
  const formatMessageForAPI = (message) => {
    return {
      text: message.content,
      sender: message.role === 'user' ? 0 : 1,
      timestamp: new Date().toISOString()
    };
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;

    const newMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    // Socket.IO로 메시지 전송 (기존 형식 유지)
    socketRef.current?.emit('chat:message', {
      userId,
      chatId: currentChatId,
      message: newMessage.content
    });
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !loading) handleSend();
  };

  // 새 채팅 시작
  const startNewChat = () => {
    setMessages([]);
    setSelectedSession(null);
    setCurrentChatId(null);
    
    // 소켓 재연결로 새 채팅 세션 생성
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  return (
    <StDiv>
      {/* 좌측: 세션 네비 */}
      <StSideNavi>
        <NavItem onClick={startNewChat} style={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
          + 새 채팅
        </NavItem>
        {history.map(sess => (
          <NavItem
            key={sess.sessionId}
            active={selectedSession?.sessionId === sess.sessionId}
            onClick={() => setSelectedSession(sess)}
          >
            {sess.title}
          </NavItem>
        ))}
      </StSideNavi>

      {/* 우측: 채팅창 */}
      <StSecondBox>
        <ChatContainer>
          <MessageList ref={listRef}>
            {messages.map((m,i) => (
              <MessageItem key={i} role={m.role}>
                <Bubble role={m.role}>
                  {m.content}
                </Bubble>
              </MessageItem>
            ))}
          </MessageList>

          <InputContainer>
            <TextField
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요…"
              disabled={loading}
            />
            <SendButton
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? '…' : '전송'}
            </SendButton>
          </InputContainer>
        </ChatContainer>
      </StSecondBox>
    </StDiv>
  );
}
