// src/pages/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api/solarApi';
const ChtaTitle = styled.div`

`
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
`;

const MessageList = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f5f5f5;
`;

const MessageItem = styled.div`
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: ${props => (props.role === 'user' ? 'flex-end' : 'flex-start')};
`;

const Bubble = styled.div`
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  background-color: ${props => (props.role === 'user' ? '#4f8ef7' : '#e0e0e0')};
  color: ${props => (props.role === 'user' ? 'white' : 'black')};
`;

const InputContainer = styled.div`
  display: flex;
  padding: 8px;
  border-top: 1px solid #ddd;
  background-color: white;
`;

const TextField = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
`;

const SendButton = styled.button`
  margin-left: 8px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background-color: #4f8ef7;
  color: white;
  font-weight: bold;
  cursor: pointer;
`;

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: input.trim() }
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
        const res = await api.post('/v1/chat/completions', {
        model: "solar-pro",       
        messages: newMessages,
        temperature: 0.7
      });
      const reply = res.data.choices[0].message;
      setMessages([...newMessages, reply]);
    } catch (err) {
      console.error('API 호출 오류:', err);
      // 실패 시 에러 메시지 표시
      setMessages([
        ...newMessages,
        { role: 'assistant', content: '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSend();
    }
  };

  return (
    <ChatContainer>
      <MessageList>
        {messages.map((msg, idx) => (
          <MessageItem key={idx} role={msg.role}>
            <Bubble role={msg.role}>{msg.content}</Bubble>
          </MessageItem>
        ))}
        <div ref={messagesEndRef} />
      </MessageList>

      <InputContainer>
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요…"
          disabled={loading}
        />
        <SendButton onClick={handleSend} disabled={loading}>
          {loading ? '...' : '전송'}
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat;
