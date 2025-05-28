import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Home from "../pages/Home"
import Chat from '../pages/Chat'
import Docs from '../pages/Docs'
import Login from '../pages/Login'
import PatientCase from '../pages/PatientCase'
import FieldGuide from '../pages/FieldGuide'
import EmergencyProtocol from '../pages/EmergencyProtocol'

// 인증이 필요한 라우트를 위한 컴포넌트
const ProtectedRoute = ({ children }) => {
    const accessKey = localStorage.getItem('accessKey')
    const userUuid = localStorage.getItem('userUuid')

    if (!accessKey || !userUuid) {
        // 인증 정보가 없으면 로그인 페이지로 리다이렉트
        return <Navigate to="/" replace />
    }

    return children
}

const Router = () => {
    return (
        <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login/>}/>
                    <Route path="home/:userId/*" element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }>
                        <Route index        element={<PatientCase />} />
                        <Route path="chat"  element={<Chat />} />
                        <Route path="case"  element={<PatientCase />} />
                        <Route path="papers" element={<Docs />} />
                        <Route path="field"  element={<FieldGuide />} />
                        <Route path="emergency" element={<EmergencyProtocol />} />
                    </Route>
                </Routes>
        </BrowserRouter>
    )
}

export default Router
