const express = require('express');
const router = express.Router();
const db = require('../lib/db.connect');

module.exports = function(app) {
    /**
     * 의학 정보 저장
     * POST /medical-info
     * Body: { json: object }
     */
    router.post('/', (req, res) => {
        try {
            const { json } = req.body;
            if (!json) {
                return res.status(400).json({
                    success: false,
                    error: 'json 필드는 필수입니다.'
                });
            }
            const jsonString = JSON.stringify(json);
            const query = 'INSERT INTO medical_info (json) VALUES (?)';
            db.query(query, [jsonString], (error, results) => {
                if (error) {
                    console.error('의학 정보 저장 오류:', error);
                    return res.status(500).json({
                        success: false,
                        error: '의학 정보 저장 중 오류가 발생했습니다.'
                    });
                }
                res.status(201).json({
                    success: true,
                    data: {
                        id: results.insertId,
                        message: '의학 정보가 성공적으로 저장되었습니다.'
                    }
                });
            });
        } catch (error) {
            console.error('의학 정보 저장 오류:', error);
            res.status(500).json({
                success: false,
                error: '서버 내부 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 의학 정보 최신 5개 조회
     * GET /medical-info
     */
    router.get('/', (req, res) => {
        try {
            const dataQuery = `
                SELECT id, json, created_at 
                FROM medical_info 
                ORDER BY created_at DESC 
                LIMIT 5
            `;
            db.query(dataQuery, (dataError, dataResults) => {
                if (dataError) {
                    console.error('의학 정보 데이터 조회 오류:', dataError);
                    return res.status(500).json({
                        success: false,
                        error: '의학 정보 데이터 조회 중 오류가 발생했습니다.'
                    });
                }
                const infos = dataResults.map(row => {
                    try {
                        return {
                            id: row.id,
                            json: JSON.parse(row.json),
                            created_at: row.created_at
                        };
                    } catch (parseError) {
                        console.error('JSON 파싱 오류:', parseError);
                        return {
                            id: row.id,
                            json: null,
                            created_at: row.created_at,
                            error: 'JSON 파싱 실패'
                        };
                    }
                });
                res.json({
                    success: true,
                    data: {
                        infos,
                        total: infos.length
                    }
                });
            });
        } catch (error) {
            console.error('의학 정보 리스트 조회 오류:', error);
            res.status(500).json({
                success: false,
                error: '서버 내부 오류가 발생했습니다.'
            });
        }
    });

    return router;
}; 