// src/pages/Docs.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import dpApi from '../api/dbApi';

const Container = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: auto;
`;

const Uploader = styled.input`
  margin-bottom: 16px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #4f8ef7;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled { background: #ccc; }
`;

const Result = styled.pre`
  white-space: pre-wrap;
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  margin-top: 24px;
`;

const Docs = () => {
  const [file, setFile] = useState(null);
  const [parsedText, setParsedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedText('');
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await dpApi.post('/v1/document/parse', formData);
      // 응답이 { parsed_text: "..." } 형태라고 가정
      setParsedText(res.data.parsed_text);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '문서 파싱 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>문서 업로드 및 파싱</h2>
      <Uploader
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
      />
      <div>
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading ? '파싱 중…' : '파싱 시작'}
        </Button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {parsedText && (
        <Result>{parsedText}</Result>
      )}
    </Container>
  );
};

export default Docs;
