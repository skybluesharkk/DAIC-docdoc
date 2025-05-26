import React from 'react'
import styled from "styled-components";
import { useNavigate } from 'react-router-dom'


const StLayout = styled.div`
    width:100%;
`;

const StBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
`;

const StButton = styled.button`
    margin:0;
    width: auto;
    height: 50px;
    border-radius: 10px;
    display: flex;
    background-color: red;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
`;

const StLogo = styled.img`
    width:700px;
    background-color:white;
`;

const Home = () => {
    const navigate = useNavigate();
    return (
        <StLayout>
            <StBox>
        <h1>docdoc</h1>
                <StButton onClick={() => { navigate("/Chat"); }}>
                    Chat 시작하기
                </StButton>
                <StButton onClick={() => { navigate("/Docs"); }}>
                    문서 번역하기
                </StButton>
                <StButton onClick={() => { navigate("/Profile"); }}>
                    Profile
                </StButton>
            </StBox>
        </StLayout>
    )
}

export default Home
