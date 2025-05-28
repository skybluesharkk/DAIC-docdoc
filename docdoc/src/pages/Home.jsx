import { Outlet, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useState, useEffect } from "react";
import axios from "axios";
import docdocIcon from '../assets/docdoc_icon.png';

const ButtonBase = styled.button`
  box-sizing: border-box;
  appearance: none;
  background-color: white;
  border-radius: 0.6em;
  cursor: pointer;
  display: flex;
  align-self: center;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
  margin: 0 20px;
  padding: 1.2em 2.8em;
  text-decoration: none;
  text-align: center;
  text-transform: uppercase;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;

  transition: 
    transform 0.2s ease,
    box-shadow 300ms ease-in-out,
    color 300ms ease-in-out;

  &:hover,
  &:focus {
    color: black;
    outline: 0;
  }

  &:hover {
    transform: translateY(-4px);
  }
`

const StButtonBlue = styled(ButtonBase)`
  border: 2px solid #2980b9;
  &:hover {
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 40px 40px #2980b9 inset;
  }
`

const StButtonSkyBlue = styled(ButtonBase)`
  border: 2px solid #3498db;
  &:hover {
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 40px 40px #3498db inset;
  }
`

const StButtonLightGreen = styled(ButtonBase)`
  border: 2px solid #7ed56f;
  &:hover {
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 40px 40px #7ed56f inset;
  }
`

const StButtonGreen = styled(ButtonBase)`
  border: 2px solid #27ae60;
  &:hover {
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 40px 40px #27ae60 inset;
  }
`

const StWelcome = styled.div`
  color: #2c3e50;
  font-size: 1.2rem;
  margin-left: 2rem;
  white-space: nowrap;
  
  span {
    color: #2980b9;
    font-weight: 700;
  }
`

const StNav = styled.nav`
  display: flex;
  flex-direction: row;
  justify-content: space-between; 
  align-items: center;
  margin-top: 1rem;
  padding: 0 2rem;
`

const StButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const StLogo = styled.img`
  height: 55px;
  width: auto;
  margin-right: 20px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.15);
  }
`

function Home() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const accessKey = localStorage.getItem('accessKey');
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/auth/user/${userId}`,
          {
            headers: {
              'accesskey': accessKey
            }
          }
        );
        
        if (response.data.resultCode === 0) {
          const userNickname = response.data.user.nickname;
          setNickname(userNickname);
          localStorage.setItem('userNickname', userNickname);
        } else {
          const savedNickname = localStorage.getItem('userNickname');
          if (savedNickname) {
            setNickname(savedNickname);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        const savedNickname = localStorage.getItem('userNickname');
        if (savedNickname) {
          setNickname(savedNickname);
        }
      }
    };

    fetchUserInfo();
  }, [userId]);

  return (
    <>
      <StNav>
        <StButtonGroup>
          <StLogo src={docdocIcon} alt="DocDoc Logo"/>
          <StButtonBlue onClick={() => navigate(`/home/${userId}/case`)}>환자 보기</StButtonBlue>
          <StButtonSkyBlue onClick={() => navigate(`/home/${userId}/chat`)}>AI 진료 상담</StButtonSkyBlue>
          <StButtonLightGreen onClick={() => navigate(`/home/${userId}/papers`)}>최신 논문 보기</StButtonLightGreen>
          <StButtonGreen onClick={() => navigate(`/home/${userId}/emergency`)}>응급 프로토콜</StButtonGreen>
        </StButtonGroup>
        <StWelcome>
          환영합니다, <span>{nickname}</span>님
        </StWelcome>
      </StNav>

      <main>
        <Outlet />
      </main>
      <footer>© 2025 docdoc</footer>
    </>
  );
}
export default Home;