const pool = require('./db.connect');
const bcrypt = require('bcrypt');
const tools = require('./tools');

// 액세스 키 저장 함수
function createAccessKey(userUuid, callback) {
    // user_access_key 테이블에 새 레코드 생성 (access_key는 자동 생성됨)
    const query = 'INSERT INTO user_access_key (user_uuid) VALUES (UUID_TO_BIN(?))';
    
    pool.query(query, [userUuid], (err, result) => {
        if (err) {
            console.log(err);
            return callback(3);
        }
        
        // 생성된 액세스 키 조회
        pool.query('SELECT BIN_TO_UUID(access_key) as access_key FROM user_access_key WHERE user_uuid = UUID_TO_BIN(?) ORDER BY access_key DESC LIMIT 1', [userUuid], (err, data) => {
            if (err || data.length === 0) {
                console.log(err);
                return callback(3);
            }
            
            return callback(0, data[0].access_key);
        });
    });
}

// 회원가입 함수
async function register(id, password, nickname, callback) {
    // ID 중복 확인
    pool.query('SELECT * FROM user WHERE id = ?', [id], async (err, data) => {
        if (err) {
            console.log(err);
            return callback(3);
        }
        
        // 이미 존재하는 ID인 경우
        if (data.length > 0) {
            return callback(10); // ID 중복 에러 코드
        }
        
        try {
            // 비밀번호 해시화 (보안을 위해)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // 사용자 정보 저장
            const query = 'INSERT INTO user (id, password, nickname) VALUES (?, ?, ?)';
            const values = [id, hashedPassword, nickname];
            
            pool.query(query, values, (err, result) => {
                if (err) {
                    console.log(err);
                    return callback(3);
                }
                
                // 사용자 UUID 조회
                pool.query('SELECT BIN_TO_UUID(uuid) as uuid FROM user WHERE id = ?', [id], (err, data) => {
                    if (err || data.length === 0) {
                        console.log(err);
                        return callback(3);
                    }
                    
                    // 회원가입 성공
                    return callback(0, data[0].uuid);
                });
            });
        } catch (error) {
            console.log(error);
            return callback(3);
        }
    });
}

// 로그인 함수
function login(id, password, callback) {
    pool.query('SELECT BIN_TO_UUID(uuid) as uuid, id, password, nickname FROM user WHERE id = ?', [id], 
        async (err, data) => {
            if (err) {
                console.log(err);
                return callback(3);
            }
            
            // 사용자가 존재하지 않는 경우
            if (data.length === 0) {
                return callback(11); // 존재하지 않는 ID 에러 코드
            }
            
            try {
                // 비밀번호 일치 여부 확인
                const match = await bcrypt.compare(password, data[0].password);
                
                if (match) {
                    const userUuid = data[0].uuid;
                    
                    // 액세스 키 생성
                    createAccessKey(userUuid, (resultCode, accessKey) => {
                        if (resultCode !== 0) {
                            return callback(resultCode);
                        }
                        
                        // 로그인 성공
                        const userData = {
                            uuid: userUuid,
                            id: data[0].id,
                            nickname: data[0].nickname,
                            accessKey: accessKey
                        };
                        return callback(0, userData);
                    });
                } else {
                    // 비밀번호 불일치
                    return callback(12); // 비밀번호 불일치 에러 코드
                }
            } catch (error) {
                console.log(error);
                return callback(3);
            }
        });
}

// 사용자 정보 조회 함수
function getUserInfo(uuid, callback) {
    pool.query('SELECT BIN_TO_UUID(uuid) as uuid, id, nickname FROM user WHERE uuid = UUID_TO_BIN(?)', [uuid], 
        (err, data) => {
            if (err) {
                console.log(err);
                return callback(3);
            }
            
            if (data.length === 0) {
                return callback(13); // 사용자를 찾을 수 없음
            }
            
            const userData = {
                uuid: data[0].uuid,
                id: data[0].id,
                nickname: data[0].nickname
            };
            
            return callback(0, userData);
        });
}

// 액세스 키로 사용자 정보 확인
function verifyAccessKey(accessKey, callback) {
    const query = `
        SELECT BIN_TO_UUID(u.uuid) as uuid, u.id, u.nickname 
        FROM user u 
        JOIN user_access_key ak ON u.uuid = ak.user_uuid 
        WHERE ak.access_key = UUID_TO_BIN(?)
    `;
    
    pool.query(query, [accessKey], (err, data) => {
        if (err) {
            console.log(err);
            return callback(3);
        }
        
        if (data.length === 0) {
            return callback(14); // 유효하지 않은 액세스 키
        }
        
        const userData = {
            uuid: data[0].uuid,
            id: data[0].id,
            nickname: data[0].nickname
        };
        
        return callback(0, userData);
    });
}

module.exports = {
    register,
    login,
    getUserInfo,
    verifyAccessKey
}; 