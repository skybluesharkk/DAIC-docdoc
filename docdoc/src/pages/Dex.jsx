import React from 'react'
import styled from 'styled-components';
import pokeballImg from "../assets/pokeball.png";
import { useContext } from 'react';
import { PokemonContext } from '../context/PokemonContext';

const StLayout = styled.div`
    width: 100%;
    padding: 0 16px;
    
    @media (min-width: 768px) {
    max-width: 1800px;
    margin: 0 auto;
    }
`;

const StDashboard = styled.div`
    background-color: #f7f6f3;
    display:flex;
    justify-content: center; 
    align-items: center;
    flex-direction: column; 
`;

const StDbPokemon = styled.div`
    width: 100%;
    display: flex;
    margin: 10px;
    padding: 20px;   
    justify-content: center; 
    align-items: center;
`;

const Pokeball = styled.div`
    flex: 0 0 60px; 
    margin: 20px;
    padding: 15px;
    border: 2px dotted grey;
    border-radius: 10px;
    background-color: white;
    img {
        width: 100%;
        height: auto;
      }
`;

const StListContainer = styled.div`
    gap: 16px; 
    display: flex;
    flex-wrap: wrap;           
    justify-content: center;   
    padding: 10px;
    background-color: #a5aaa3; 
`;

const StCard = styled.div`
    border: 1px solid gray;
    flex: 1 1 calc(50% - 20px);   
    max-width: 180px;
    padding: 10px;
    margin: 10px;
    border-radius: 8px;
    background-color: white;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;    
`;

const StPlusButton = styled.button`
    width: auto;
    padding: 5px 10px;
    border-radius: 8px;
    display: flex;
    margin: 20px;
    background-color: red;
    align-items: center;
    justify-content: center;
    color: white;
    font-size:15px;
`;

const StMyPokemonText = styled.h2`
    color: red;
    font-style: bold;
    font-size: 30px;
`;

const StCardBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Dashboard = () => {

    const {
        selectedPokemons,
    } = useContext(PokemonContext);

    return (
        <StDashboard>
            <StMyPokemonText>나만의 포켓몬</StMyPokemonText>
            <StDbPokemon>
                {Array(6)
                    .fill(null)
                    .map((_, i) => {
                        const pokemon = selectedPokemons[i]
                        return pokemon ? (
                            <PokemonCard
                                key={pokemon.id}
                                pokemon={pokemon}
                                isList={false}
                            />
                        ) : (

                            <Pokeball key={i + '_'}>
                                <img src={pokeballImg} alt="pokeball" />
                            </Pokeball>
                        )
                    })}

            </StDbPokemon>


        </StDashboard>
    )
}

const PokemonCard = ({ pokemon,isList }) => {
    const { add, remove, goToDetail,selectedPokemons } = useContext(PokemonContext);
    const isSelected = selectedPokemons.some(p => p.id === pokemon.id);

    const handleCheck = ()=>{
        isList
        ? add(pokemon)
        : isSelected
        ? remove(pokemon.id)
        : add(pokemon)
    }
    return (
        <StCard >
            <StCardBody onClick={() => goToDetail(pokemon.id)}>
                <img src={pokemon.img_url} alt="" />
                <h3>{pokemon.korean_name}</h3>
                <p>No. {pokemon.id}</p>
            </StCardBody>
            <StPlusButton
                type="button"
                onClick={handleCheck}
            >
                {isList ? '추가' : isSelected ? '삭제' : '추가'}
            </StPlusButton>

        </StCard>
    )
}

const PokemonList = () => {
    const { pokemons } = useContext(PokemonContext)
    return (
        <StListContainer>
            {pokemons.map(function (Pokemon) {
                return (
                    <PokemonCard key={Pokemon.id} pokemon={Pokemon} isList={true} />
                )
            })}
        </StListContainer>
    )
}

const Dex = () => {

    return (
        <StLayout>
            <Dashboard />
            <PokemonList />
        </StLayout>
    )
}

export default Dex