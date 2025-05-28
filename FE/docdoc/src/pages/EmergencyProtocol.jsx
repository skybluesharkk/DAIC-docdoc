import React from 'react';
import styled from 'styled-components';

const PageWrapper = styled.div`
  margin-top: 1rem;
  padding: 1.5rem;
  background-color: #f6faff;
  min-height: calc(100vh - 3rem);
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 2rem;
  text-align: center;
`;

const ProtocolButton = styled.button`
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 2rem;
  padding: 1rem;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #b91c1c;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
`;

const ProtocolCard = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CardHeader = styled.div`
  background: #dc2626;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const WarningIcon = styled.span`
  font-size: 1.5rem;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const StepList = styled.ol`
  margin: 0;
  padding-left: 1.5rem;

  li {
    margin-bottom: 1rem;
    line-height: 1.5;
  }
`;

const WarningList = styled.ul`
  margin: 1rem 0 0 0;
  padding-left: 1.2rem;
  list-style: none;

  li {
    color: #dc2626;
    margin-bottom: 0.5rem;
    line-height: 1.4;
    
    &:before {
      content: "•";
      color: #dc2626;
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
    }
  }
`;

const Badge = styled.span`
  background: #dc2626;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
`;

export default function EmergencyProtocol() {
  return (
    <PageWrapper>
      <PageTitle>현지 적용 의료 가이드</PageTitle>
      <ProtocolButton>응급 프로토콜</ProtocolButton>
      <Container>
        <ProtocolCard>
          <CardHeader>
            <WarningIcon>⚠️</WarningIcon>
            <h2>아나필락시스 쇼크</h2>
            <Badge>위중</Badge>
          </CardHeader>
          <CardContent>
            <StepList>
              <li>즉시 에피네프린 0.3-0.5mg 근육주사 (대퇴부 외측)</li>
              <li>기도 확보 및 산소공급</li>
              <li>IV 라인 확보, 생리식염수 1-2L 급속 수액</li>
              <li>항히스타민제 및 스테로이드 투여</li>
              <li>지속적 모니터링 및 2차 반응 주의</li>
            </StepList>
            <WarningList>
              <li>에피네프린 구입 어려울 시 즉시 대도시 병원으로 이송</li>
              <li>현지 응급실과 사전 연락망 구축 필수</li>
              <li>베나드릴(항히스타민제) 상시 비축</li>
            </WarningList>
          </CardContent>
        </ProtocolCard>

        <ProtocolCard>
          <CardHeader>
            <WarningIcon>⚠️</WarningIcon>
            <h2>중증 말라리아</h2>
            <Badge>위중</Badge>
          </CardHeader>
          <CardContent>
            <StepList>
              <li>즉시 아르테수네이트 2.4mg/kg IV 투여</li>
              <li>활력, 전해질 모니터링</li>
              <li>경련 시 디아제팜 투여</li>
              <li>수액 균형 주의 (배부종 위험)</li>
              <li>24시간 집중 관찰</li>
            </StepList>
            <WarningList>
              <li>아르테수네이트 현지 조달 방법 숙지</li>
              <li>취급 대체요법 준비</li>
              <li>혈당측정기 상시 보유</li>
            </WarningList>
          </CardContent>
        </ProtocolCard>
      </Container>
    </PageWrapper>
  );
} 