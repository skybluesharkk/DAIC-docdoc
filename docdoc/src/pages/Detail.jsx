import React from 'react'
import { useSearchParams,useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { PokemonContext } from '../context/PokemonContext'
import { useContext } from 'react'

const StDetail = styled.div`
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100%;
`;

const Stimg = styled.img`
    width: 100%;
    max-width: 200px;
    height: auto;
`;

const StName = styled.p`
    font-size: 1.2rem;
    font-weight: bold;
    margin: 8px 0;
`;

const StText = styled.p`
    font-size: 1rem;
    margin: 4px 0;
`;

const StButton = styled.button`
    margin-top: 16px;
    padding: 12px 24px;
    background-color: grey;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
`;

const Detail = () => {
    const [searchParams] = useSearchParams();        
    const navigate = useNavigate();
    const {pokemons} = useContext(PokemonContext);
    const id = searchParams.get('id')
    const pokemon = pokemons.find(p => p.id === Number(id))

    if (!pokemon){
        return (
        <StDetail >
            <StText>없는 포켓몬입니다.</StText>
            <StButton onClick={()=>navigate(-1)}>뒤로 가기</StButton>
        </StDetail >

        );
    
    }
  return (
    <StDetail>
        <Stimg src={pokemon.img_url}/>
        <StName>{pokemon.korean_name}</StName>
        <StText>{pokemon.types}</StText>
        <StText>{pokemon.description}</StText>
        <StButton onClick={()=>navigate(-1)}>뒤로 가기</StButton>
    </StDetail>
  )
}

export default Detail
