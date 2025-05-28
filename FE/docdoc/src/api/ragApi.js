import axios from 'axios';

// 환경변수에서 베이스URL, 엑세스키 읽기
const baseURL = import.meta.env.VITE_BASE_URL;
const accessKey = import.meta.env.VITE_ACCESS_KEY;

// axios 인스턴스 생성
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// (1) 회원가입
export function register({ id, password, nickname }) {
  return api.post('/auth/register', { id, password, nickname });
}

// (2) 로그인
export function login({ id, password }) {
  return api.post('/auth/login', { id, password });
}

// (3) 사용자 정보 조회
export function getUserInfo(uuid) {
  return api.get(`/auth/user/${uuid}`, {
    headers: { accesskey: accessKey }
  });
}

// (4) 채팅 기록 조회
export function getChatHistory(userUuid) {
  return api.get(`/chat/history/${userUuid}`, {
    headers: { 'x-access-key': accessKey }
  });
}

// (5) 헬스 체크
export function healthCheck() {
  return api.get('/chat/health');
}

// (6) LLM 서버 상태 확인
export function getLlmStatus() {
  return api.get('/chat/llm-status');
}

// (7) LLM 서버 재연결
export function reconnectLlm() {
  return api.post('/chat/reconnect-llm');
}

// (8) 환자 케이스 저장
export function createPatientCase(patientCase) {
  // patientCase는 { patientInfo, symptoms, vitalSigns, diagnosis, treatment, notes } 형태
  return api.post('/patient-case', { json: patientCase }, {
    headers: { accesskey: accessKey }
  });
}

// (9) 환자 케이스 리스트 조회 (최신순)
export function listPatientCases() {
  return api.get('/patient-case', {
    headers: { accesskey: accessKey },
    params: { sort: 'newest' }
  });
}

// (10) 특정 환자 케이스 조회
export function getPatientCase(patientCaseId) {
  return api.get(`/patient-case/${patientCaseId}`, {
    headers: { accesskey: accessKey }
  });
}

// (11) 의학 정보 저장
export function createMedicalInfo(medicalInfo) {
  // medicalInfo는 { url, title, tags, summary } 형태
  return api.post('/medical-info', { json: medicalInfo });
}

// (12) 의학 정보 조회
export function listMedicalInfo(params = {}) {
  return api.get('/medical-info', {
    headers: { accesskey: accessKey },
    params: {
      limit: params.limit || 10,
      offset: params.offset || 0,
      tags: params.tags?.join(','),
      search: params.search
    }
  }).then(response => {
    console.log('Server Response:', response);
    
    // 응답 데이터가 있는지 확인
    if (!response.data) {
      throw new Error('No data in response');
    }

    // success 필드가 있는 경우
    if ('success' in response.data) {
      if (!response.data.success) {
        throw new Error(response.data.message || 'API request failed');
      }
      // success = true인 경우의 데이터 구조
      if (response.data.data?.infos) {
        return {
          items: response.data.data.infos.map(info => ({
            id: info.id,
            ...info.json,
            createdAt: info.created_at
          })),
          total: response.data.data.total || 0
        };
      }
    }
    
    // 직접 데이터 배열이 온 경우
    if (Array.isArray(response.data)) {
      return {
        items: response.data.map(info => ({
          id: info.id || Math.random().toString(36).substr(2, 9),
          ...info,
          createdAt: info.created_at || info.createdAt || new Date().toISOString()
        })),
        total: response.data.length
      };
    }

    // 다른 형태의 응답인 경우
    console.warn('Unexpected API response format:', response.data);
    return {
      items: [],
      total: 0
    };
  });
}

/**
 * 응답 형식:
 * {
 *   items: [
 *     {
 *       id: number,
 *       url: string,
 *       title: string,
 *       tags: string[],
 *       summary: string,
 *       createdAt: string
 *     },
 *     ...
 *   ],
 *   total: number
 * }
 */

export default api;
