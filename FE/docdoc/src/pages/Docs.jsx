// src/pages/Docs.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { listMedicalInfo } from '../api/ragApi';

const PageWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 3rem);
  padding: 1.5rem;
  background-color: #f6faff;
  box-sizing: border-box;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #1a365d;
  text-align: center;
  font-weight: 600;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoItem = styled.li`
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
    border-color: #4f8ef7;
  }
`;

const InfoTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.5rem;
  color: #2d3748;
  font-weight: 600;
  line-height: 1.4;
`;

const InfoSummary = styled.p`
  margin: 0 0 1.5rem;
  color: #4a5568;
  line-height: 1.8;
  font-size: 1.1rem;
`;

const TagContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background-color: #ebf8ff;
  color: #2b6cb0;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: #bee3f8;
  }
`;

const InfoLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: #4f8ef7;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #ebf8ff;
    text-decoration: none;
  }

  &::after {
    content: '→';
    margin-left: 0.5rem;
    transition: transform 0.2s ease;
  }

  &:hover::after {
    transform: translateX(4px);
  }
`;

const InfoDate = styled.span`
  display: block;
  color: #718096;
  font-size: 0.95rem;
  margin-top: 1rem;
  font-weight: 500;
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
  padding: 1.5rem;
  border: 1px solid #feb2b2;
  border-radius: 12px;
  background-color: #fff5f5;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 500;
`;

const MetaContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

export default function Docs() {
  const [medicalInfos, setMedicalInfos] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInfos() {
      setLoading(true);
      setError('');
      try {
        const response = await listMedicalInfo();
        console.log('Raw API Response:', response);
        
        // 응답 구조 검증 및 변환
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid API response format');
        }

        // 데이터가 없는 경우 빈 배열로 처리
        const items = response.items || [];
        console.log('Processed items:', items);
        
        setMedicalInfos({ items, total: items.length });
      } catch (err) {
        console.error('Error details:', err);
        setError(err.message || '의학 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchInfos();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <PageWrapper>
      <Container>
        <SectionTitle>최신 논문 보기</SectionTitle>
        {loading && <LoadingSpinner>로딩 중...</LoadingSpinner>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && !error && (
          <InfoList>
            {medicalInfos.items.length > 0 ? (
              medicalInfos.items.map((info) => (
                <InfoItem key={info.id}>
                  <InfoTitle>{info.title || '제목 없음'}</InfoTitle>
                  <TagContainer>
                    {(info.tags || []).map((tag, idx) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </TagContainer>
                  <InfoSummary>{info.summary || '내용 없음'}</InfoSummary>
                  <MetaContainer>
                    {info.url && (
                      <InfoLink
                        href={info.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        논문 전문 보기
                      </InfoLink>
                    )}
                    <InfoDate>{formatDate(info.createdAt || new Date())}</InfoDate>
                  </MetaContainer>
                </InfoItem>
              ))
            ) : (
              <ErrorMessage>등록된 의학 정보가 없습니다.</ErrorMessage>
            )}
          </InfoList>
        )}
      </Container>
    </PageWrapper>
  );
}
