module.exports = function(app){
    const express = require('express');
    const router = express.Router();
    const tools = require('../lib/tools');
    const user = require('../lib/user');

    // 회원가입 라우트
    router.post('/register', (req, res) => {
        if(!tools.isQueryVaild([req.body.id, req.body.password, req.body.nickname]))
            return res.json({ resultCode: 2 });
            
        user.register(req.body.id, req.body.password, req.body.nickname, (resultCode, uuid) => {
            if(resultCode != 0)
                return res.json({ resultCode });
                
            res.json({ resultCode: 0, uuid });
        });
    });
    
    // 로그인 라우트
    router.post('/login', (req, res) => {
        if(!tools.isQueryVaild([req.body.id, req.body.password]))
            return res.json({ resultCode: 2 });
            
        user.login(req.body.id, req.body.password, (resultCode, userData) => {
            if(resultCode != 0)
                return res.json({ resultCode });
                
            res.json({ resultCode: 0, user: userData });
        });
    });
    
    // 사용자 정보 조회 라우트 (액세스 키 필요)
    router.get('/user/:uuid', (req, res) => {
        if(!tools.isQueryVaild([req.params.uuid, req.headers.accesskey]))
            return res.json({ resultCode: 2 });
        
        // 먼저 액세스 키 검증
        user.verifyAccessKey(req.headers.accesskey, (resultCode, keyUserData) => {
            if(resultCode != 0)
                return res.json({ resultCode });
            
            // 액세스 키의 사용자 uuid와 요청된 uuid가 일치하는지 확인
            if(keyUserData.uuid !== req.params.uuid) {
                return res.json({ resultCode: 15 }); // 권한 없음 에러 코드
            }
            
            // 검증 완료 후 사용자 정보 조회
            user.getUserInfo(req.params.uuid, (resultCode, userData) => {
                if(resultCode != 0)
                    return res.json({ resultCode });
                    
                res.json({ resultCode: 0, user: userData });
            });
        });
    });

    return router;
};