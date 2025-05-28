// src/pages/PatientCase.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createPatientCase, listPatientCases } from '../api/ragApi';


const Card = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  background-color: #f6faff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
`;
const CardHeader = styled.div`
  background: #2563eb;
  padding: 1rem 1.5rem;
`;
const CardTitle = styled.h2`
  color: white; margin: 0; font-size: 1.5rem;
`;
const CardContent = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  & > div {
    min-width: 0;
  }
`;

// 왼쪽 입력폼 (40%)
const FormSection = styled.div`

  flex: 0 0 30%;
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-width: 0;    
  box-sizing: border-box;
  form {
        display: flex;
        flex-direction: column;
      }
`;
// 오른쪽 데이터표 (60%)
const TableSection = styled.div`
  flex: 0 0 60%;
`;

// 폼 컴포넌트
const FormGroup = styled.div`
  margin-bottom: 1rem;
  & > label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
  & > input,
  & > select,
  & > textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 1rem;
  }
`;
const Button = styled.button`
  width: 100%;
  background: #2563eb; color: white;
  padding: 0.75rem; border: none; border-radius: 4px;
  font-size: 1rem; cursor: pointer;
  &:hover { background: #1e40af; }
`;

// 표 컴포넌트
const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background: #f8fafc;
    color: #1a365d;
    font-weight: 600;
    font-size: 0.95rem;
  }

  td {
    color: #2d3748;
    font-size: 0.95rem;
  }

  tbody tr:hover {
    background-color: #f8fafc;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.severity) {
      case 'mild':
        return 'background-color: #e6fffa; color: #047481;';
      case 'moderate':
        return 'background-color: #fefcbf; color: #975a16;';
      case 'severe':
        return 'background-color: #fed7d7; color: #c53030;';
      case 'critical':
        return 'background-color: #fff5f5; color: #e53e3e;';
      default:
        return 'background-color: #edf2f7; color: #4a5568;';
    }
  }}
`;

const VitalSigns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  font-size: 0.9rem;
  
  div {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
  }
  
  span:first-child {
    color: #718096;
  }
  
  span:last-child {
    font-weight: 500;
    color: #2d3748;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #4f8ef7;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  padding: 1rem;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  background-color: #fff5f5;
  margin-bottom: 1rem;
`;

export default function PatientCase() {
  // 1) 입력폼 state
  const [form, setForm] = useState({
    age: '',
    gender: '',
    symptoms: '',
    duration: '',
    severity: '',
    localResources: '',
    previousTreatment: '',
    allergies: '',
    vitals: { temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '' }
  });

  // 2) 제출된 데이터를 보관할 state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 3) form 업데이트 헬퍼
  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateVital = (k, v) =>
    setForm(f => ({ 
      ...f, 
      vitals: { ...f.vitals, [k]: v } 
    }));

  // 4) 환자 케이스 목록 불러오기
  useEffect(() => {
    const fetchPatientCases = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await listPatientCases();
        console.log('API Response:', response);
        
        if (response.data.success) {
          setRecords(response.data.data.cases || []);
        } else {
          setError('환자 정보를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to fetch patient cases:', err);
        setError('환자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientCases();
  }, []);

  // 5) 폼 제출 시 API 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.age || !form.symptoms) {
      return alert('나이와 주요 증상은 필수입니다.');
    }

    setLoading(true);
    setError('');

    try {
      const response = await createPatientCase({
        patientInfo: {
          age: form.age,
          gender: form.gender
        },
        symptoms: form.symptoms,
        duration: form.duration,
        severity: form.severity,
        vitalSigns: form.vitals,
        localResources: form.localResources,
        previousTreatment: form.previousTreatment,
        allergies: form.allergies
      });

      if (response.data.success) {
        // 성공적으로 저장되면 목록 새로고침
        const updatedResponse = await listPatientCases();
        if (updatedResponse.data.success) {
          setRecords(updatedResponse.data.data.cases || []);
          // 폼 초기화
          setForm({
            age: '',
            gender: '',
            symptoms: '',
            duration: '',
            severity: '',
            localResources: '',
            previousTreatment: '',
            allergies: '',
            vitals: { temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '' }
          });
        }
      } else {
        setError('환자 정보 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to create patient case:', err);
      setError('환자 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 5) 표용 레이블 맵
  const labelMap = {
    age: '나이', gender: '성별', symptoms: '주요 증상',
    duration: '증상 기간', severity: '중증도',
    localResources: '현지 자원/제약', previousTreatment: '이전 치료',
    allergies: '알레르기/금기',
    temperature: '체온', bloodPressure: '혈압',
    heartRate: '맥박', respiratoryRate: '호흡수'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>환자 관리</CardTitle>
      </CardHeader>

      <CardContent>
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <FormSection>
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <label>나이 *</label>
              <input
                placeholder="예: 35"
                value={form.age}
                onChange={e => update('age', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>성별</label>
              <select
                value={form.gender}
                onChange={e => update('gender', e.target.value)}
              >
                <option value="">선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>주요 증상 *</label>
              <textarea
                value={form.symptoms}
                onChange={e => update('symptoms', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>증상 지속 기간</label>
              <input
                placeholder="예: 3일, 1주일"
                value={form.duration}
                onChange={e => update('duration', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>중증도</label>
              <select
                value={form.severity}
                onChange={e => update('severity', e.target.value)}
              >
                <option value="">선택</option>
                <option value="mild">경증</option>
                <option value="moderate">중등증</option>
                <option value="severe">중증</option>
                <option value="critical">위중</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>활력징후</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                {[
                  ['temperature','체온','36.5'],
                  ['bloodPressure','혈압','120/80'],
                  ['heartRate','맥박','72'],
                  ['respiratoryRate','호흡수','16']
                ].map(([k, lbl, ph]) => (
                  <div key={k}>
                    <label>{lbl}</label>
                    <input
                      placeholder={ph}
                      value={form.vitals[k]}
                      onChange={e => updateVital(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </FormGroup>

            <FormGroup>
              <label>현지 자원/제약사항</label>
              <textarea
                value={form.localResources}
                onChange={e => update('localResources', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>이전 치료 이력</label>
              <textarea
                value={form.previousTreatment}
                onChange={e => update('previousTreatment', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>알레르기/금기사항</label>
              <input
                value={form.allergies}
                onChange={e => update('allergies', e.target.value)}
              />
            </FormGroup>

            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '환자 등록하기'}
            </Button>
          </form>
        </FormSection>

        <TableSection>
          {loading ? (
            <LoadingSpinner>로딩 중...</LoadingSpinner>
          ) : records.length === 0 ? (
            <p>관리 중인 환자가 없습니다.</p>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>환자 정보</th>
                  <th>증상</th>
                  <th>활력징후</th>
                  <th>진료 정보</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const patientInfo = record.json.patientInfo || {};
                  const vitalSigns = record.json.vitalSigns || {};
                  
                  return (
                    <tr key={record.id}>
                      <td>
                        <div>
                          <div><strong>나이:</strong> {patientInfo.age || '-'}</div>
                          <div><strong>성별:</strong> {patientInfo.gender === 'male' ? '남성' : 
                                                    patientInfo.gender === 'female' ? '여성' : 
                                                    patientInfo.gender || '-'}</div>
                          {patientInfo.name && <div><strong>이름:</strong> {patientInfo.name}</div>}
                        </div>
                      </td>
                      <td>
                        <div>
                          {Array.isArray(record.json.symptoms) ? (
                            record.json.symptoms.join(', ')
                          ) : (
                            record.json.symptoms || '-'
                          )}
                          {record.json.duration && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <strong>기간:</strong> {record.json.duration}
                            </div>
                          )}
                          {record.json.severity && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <Badge severity={record.json.severity}>
                                {record.json.severity === 'mild' ? '경증' :
                                 record.json.severity === 'moderate' ? '중등증' :
                                 record.json.severity === 'severe' ? '중증' :
                                 record.json.severity === 'critical' ? '위중' :
                                 record.json.severity}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <VitalSigns>
                          <div>
                            <span>체온</span>
                            <span>{vitalSigns.temperature || '-'}</span>
                          </div>
                          <div>
                            <span>혈압</span>
                            <span>{vitalSigns.bloodPressure || '-'}</span>
                          </div>
                          <div>
                            <span>맥박</span>
                            <span>{vitalSigns.heartRate || '-'}</span>
                          </div>
                          <div>
                            <span>호흡수</span>
                            <span>{vitalSigns.respiratoryRate || '-'}</span>
                          </div>
                        </VitalSigns>
                      </td>
                      <td>
                        <div>
                          {record.json.localResources && (
                            <div><strong>현지 자원:</strong> {record.json.localResources}</div>
                          )}
                          {record.json.previousTreatment && (
                            <div><strong>이전 치료:</strong> {record.json.previousTreatment}</div>
                          )}
                          {record.json.allergies && (
                            <div><strong>알레르기:</strong> {record.json.allergies}</div>
                          )}
                          {record.json.diagnosis && (
                            <div><strong>진단:</strong> {record.json.diagnosis}</div>
                          )}
                          {record.json.treatment && (
                            <div><strong>치료:</strong> {record.json.treatment}</div>
                          )}
                          {record.json.notes && (
                            <div><strong>메모:</strong> {record.json.notes}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {new Date(record.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </TableSection>
      </CardContent>
    </Card>
  );
}
