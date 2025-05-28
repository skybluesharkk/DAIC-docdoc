const express = require('express');
const router = express.Router();
const db = require('../lib/db.connect');

module.exports = function(app) {
    
    /**
     * 환자 케이스 저장
     * POST /patient-case
     * Body: { json: object }
     */
    router.post('/', (req, res) => {
        try {
            const { json } = req.body;
            
            // 필수 필드 검증
            if (!json) {
                return res.status(400).json({
                    success: false,
                    error: 'json 필드는 필수입니다.'
                });
            }
            
            // JSON 객체를 문자열로 변환
            const jsonString = JSON.stringify(json);
            
            const query = 'INSERT INTO patient_case (json) VALUES (?)';
            
            db.query(query, [jsonString], (error, results) => {
                if (error) {
                    console.error('환자 케이스 저장 오류:', error);
                    return res.status(500).json({
                        success: false,
                        error: '환자 케이스 저장 중 오류가 발생했습니다.'
                    });
                }
                
                res.status(201).json({
                    success: true,
                    data: {
                        id: results.insertId,
                        message: '환자 케이스가 성공적으로 저장되었습니다.'
                    }
                });
            });
            
        } catch (error) {
            console.error('환자 케이스 저장 오류:', error);
            res.status(500).json({
                success: false,
                error: '서버 내부 오류가 발생했습니다.'
            });
        }
    });
    
    /**
     * 환자 케이스 리스트 조회
     * GET /patient-case
     * Query Parameters:
     * - sort: 정렬 방식 (newest | oldest, 기본값: newest)
     */
    router.get('/', (req, res) => {
        try {
            // 쿼리 파라미터 파싱
            const sort = req.query.sort === 'oldest' ? 'ASC' : 'DESC';
            
            // 모든 데이터 조회 (페이지네이션 제거)
            const dataQuery = `
                SELECT id, json, created_at 
                FROM patient_case 
                ORDER BY created_at ${sort}
            `;
            
            db.query(dataQuery, (dataError, dataResults) => {
                if (dataError) {
                    console.error('환자 케이스 데이터 조회 오류:', dataError);
                    return res.status(500).json({
                        success: false,
                        error: '환자 케이스 데이터 조회 중 오류가 발생했습니다.'
                    });
                }
                
                // JSON 문자열을 객체로 파싱
                const cases = dataResults.map(row => {
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
                        cases,
                        total: cases.length
                    }
                });
            });
            
        } catch (error) {
            console.error('환자 케이스 리스트 조회 오류:', error);
            res.status(500).json({
                success: false,
                error: '서버 내부 오류가 발생했습니다.'
            });
        }
    });
    
    /**
     * 특정 환자 케이스 조회
     * GET /patient-case/:id
     */
    router.get('/:id', (req, res) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: '유효하지 않은 ID입니다.'
                });
            }
            
            const query = 'SELECT id, json, created_at FROM patient_case WHERE id = ?';
            
            db.query(query, [id], (error, results) => {
                if (error) {
                    console.error('환자 케이스 조회 오류:', error);
                    return res.status(500).json({
                        success: false,
                        error: '환자 케이스 조회 중 오류가 발생했습니다.'
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: '해당 ID의 환자 케이스를 찾을 수 없습니다.'
                    });
                }
                
                const row = results[0];
                try {
                    const patientCase = {
                        id: row.id,
                        json: JSON.parse(row.json),
                        created_at: row.created_at
                    };
                    
                    res.json({
                        success: true,
                        data: patientCase
                    });
                } catch (parseError) {
                    console.error('JSON 파싱 오류:', parseError);
                    res.status(500).json({
                        success: false,
                        error: 'JSON 파싱 중 오류가 발생했습니다.'
                    });
                }
            });
            
        } catch (error) {
            console.error('환자 케이스 조회 오류:', error);
            res.status(500).json({
                success: false,
                error: '서버 내부 오류가 발생했습니다.'
            });
        }
    });
    
    return router;
}; 