import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from "../pages/Home"
import Chat from '../pages/Chat'
import Docs from '../pages/Docs'
import Profile from '../pages/Profile'

const Router = () => {
    return (
        <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />}></Route>
                    <Route path="Chat" element={<Chat />}></Route>
                    <Route path="docs" element={<Docs />}></Route>
                    <Route path="profile" element={<Profile />}></Route>
                </Routes>
        </BrowserRouter>
    )
}

export default Router
