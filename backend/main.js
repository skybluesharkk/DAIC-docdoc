    const express = require('express');
    const app = express();
    var cors = require('cors');
    const logger = require('morgan');
    const http = require('http');
    const server = http.createServer(app);
    const { Server } = require('socket.io');
    const path = require('path');
    const db = require('./lib/db.connect');

    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    app.use(cors());

    console.log('NODE_ENV: ' + process.env.NODE_ENV);

    app.enable('trust proxy');
    app.disable('x-powered-by');

    app.use(express.json());
    app.use(logger('short'));

    logger.token('remote-addr', function (req) {
        return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    });

    // Socket.IO 연결 처리
    io.on('connection', (socket) => {
        const accessKey = socket.handshake.auth?.accessKey || socket.handshake.query?.accessKey;
        
        // access key 체크
        if (!accessKey) {
            console.log('Access key 없음:', socket.id);
            socket.emit('auth:error', { message: 'Access key가 필요합니다.' });
            socket.disconnect();
            return;
        }
        
        // DB에서 access key 확인
        const query = `SELECT 1 FROM user_access_key WHERE access_key = UUID_TO_BIN(?)`;
        db.query(query, [accessKey], (error, results) => {
            if (error || results.length === 0) {
                console.log('유효하지 않은 access key:', accessKey);
                socket.emit('auth:error', { message: '유효하지 않은 access key입니다.' });
                socket.disconnect();
                return;
            }
            
            console.log('인증된 클라이언트 연결:', socket.id);
            socket.emit('socket:id', { socketId: socket.id });
            
            socket.on('disconnect', () => {
                console.log('클라이언트 연결 해제:', socket.id);
            });
            
            socket.on('ping', () => {
                socket.emit('pong');
            });
        });
    });

    // Socket.IO 연결 에러 처리
    io.engine.on('connection_error', (err) => {
        console.log('Socket.IO 연결 에러:', err.req);
        console.log('에러 코드:', err.code);
        console.log('에러 메시지:', err.message);
        console.log('에러 컨텍스트:', err.context);
    });

    const authRouter = require('./routes/auth')(app);
    app.use('/auth', authRouter);

    // 채팅 라우트 등록 - Socket.IO 인스턴스 전달
    const chatRouter = require('./routes/chat')(app, io);
    app.use('/chat', chatRouter);

    // 환자 케이스 라우트 등록
    const patientCaseRouter = require('./routes/patient_case')(app);
    app.use('/patient-case', patientCaseRouter);

    // 의학 정보 라우트 등록
    const medicalInfoRouter = require('./routes/medical_info')(app);
    app.use('/medical-info', medicalInfoRouter);

    app.get('*', function(req, res){
        res.status(404).json({ result: 404 });
    });

    // 포트 설정
    const PORT = process.env.PORT || 3001;

    // 우아한 종료 처리
    process.on('SIGINT', () => {
        console.log('서버가 종료됩니다...');
        server.close(() => {
            console.log('서버가 성공적으로 종료되었습니다.');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('서버가 종료됩니다...');
        server.close(() => {
            console.log('서버가 성공적으로 종료되었습니다.');
            process.exit(0);
        });
    });

    // http 서버로 리스닝 (app 대신 server 사용)
    server.listen(PORT, function(){
        console.log(`서버 시작: ${PORT}`);
    });
