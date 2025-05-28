import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const StTitle = styled.p`
font-size: 5.5rem;
text-align:center;
margin-bottom: 0;  // 부제목과의 간격 조정을 위해 추가
`

const StSubTitle = styled.p`
font-size: 1.5rem;
text-align: center;
color: #666;
margin-top: 0.5rem;
margin-bottom: 2rem;
font-weight: 300;
letter-spacing: 0.5px;
`

const StButton = styled.button`
width: 80%;
box-sizing: border-box;
  appearance: none;
  background-color: transparent;
  border: 2px solid red;
  border-radius: 0.6em;
  cursor: pointer;
  display: flex;
  align-self: center;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
  margin: 20px;
  padding: 1.2em 2.8em;
  text-decoration: none;
  text-align: center;
  text-transform: uppercase;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  justify-content: center;   
  align-items: center;

  transition: 
  transform 0.2s ease,
  box-shadow 300ms ease-in-out,
  color 300ms ease-in-out;

&:hover,
&:focus {
  color: white;
  outline: 0;
  text-align: center;
}

&:hover {
  /* 위로 떠오르는 효과 */
  transform: translateY(-4px);

  /* 두 개의 box-shadow
     1) 아래 그림자 (떠오르는 느낌)
     2) inset red 배경 강조 */
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 0 40px 40px red inset;
    text-align: center;
}
`
const StBox = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #FCFCFC;
  justify-content: center;   
  align-items: center;
`;

// 타이핑 이펙트용 텍스트
const TypingText = styled.div`
  font-size: 1.5rem;
  white-space: pre-wrap; /* 줄바꿈 유지 */
  margin-bottom: 2rem;
  color: #333;
`;

// 로그인 폼 박스
const StSecondBox = styled.div`
  width: 320px;
  padding: 2rem;
  background-color: white;
  border: 2px solid #e74c3c;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;   
  align-items: center;
  flex-direction: column;
`;

const StToggleButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    color: #c0392b;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  margin-top: 1rem;
  text-align: center;
`;

export default function Login() {
  const navigate = useNavigate();
  
  // 폼 상태
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    nickname: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (isLogin) {
        // 로그인 처리
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/login`, {
          id: formData.id,
          password: formData.password
        });

        if (response.data.resultCode === 0) {
          // 로그인 성공
          localStorage.setItem('accessKey', response.data.user.accessKey);
          localStorage.setItem('userUuid', response.data.user.uuid);
          localStorage.setItem('userNickname', response.data.user.nickname);
          navigate(`/home/${response.data.user.uuid}`);
        } else {
          setError('로그인에 실패했습니다.');
        }
      } else {
        // 회원가입 처리
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/register`, {
          id: formData.id,
          password: formData.password,
          nickname: formData.nickname
        });

        if (response.data.resultCode === 0) {
          // 회원가입 성공
          setIsLogin(true);
          setError('회원가입이 완료되었습니다. 로그인해주세요.');
          setFormData(prev => ({
            ...prev,
            password: '',
            nickname: ''
          }));
        } else {
          setError('회원가입에 실패했습니다.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || '오류가 발생했습니다.');
    }
  };

  return (
    <StBox>
      <StTitle>DocDoc</StTitle>
      <StSubTitle>똑똑한 나만의 의료 어시스턴트</StSubTitle>
      <StSecondBox>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {isLogin ? '로그인' : '회원가입'}
        </h2>
        
        <input
          type="text"
          name="id"
          value={formData.id}
          placeholder="ID를 입력하세요"
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        
        <input
          type="password"
          name="password"
          value={formData.password}
          placeholder="Password를 입력하세요"
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />

        {!isLogin && (
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            placeholder="닉네임을 입력하세요"
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        )}

        <StButton onClick={handleSubmit}>
          {isLogin ? '로그인' : '회원가입'}
        </StButton>

        <StToggleButton onClick={() => {
          setIsLogin(!isLogin);
          setError('');
          setFormData({
            id: '',
            password: '',
            nickname: ''
          });
        }}>
          {isLogin ? '회원가입하기' : '로그인하기'}
        </StToggleButton>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </StSecondBox>
    </StBox>
  );
}
