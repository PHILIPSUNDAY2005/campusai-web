'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoAttach, IoSend } from 'react-icons/io5';
import ChatBubble from '../../../components/ChatBubble';
import styles from './chat.module.css';

// Dummy starting messages. Real AI answers come in a later phase.
const startingMessages = [
  {
    id: 1,
    text: "Hello! Ask me anything about your courses, notes, or assignments. I'm here to help.",
    isUser: false,
  },
  {
    id: 2,
    text: 'Explain Database Normalization in simple terms.',
    isUser: true,
  },
  {
    id: 3,
    text: 'Database normalization is the process of organizing data in a database to reduce unnecessary duplication and improve data integrity.',
    isUser: false,
  },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(startingMessages);
  const [input, setInput] = useState('');
  const messagesRef = useRef(null);

  // Scroll to the newest message whenever the list changes
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (event) => {
    event.preventDefault();

    const text = input.trim();
    if (text === '') {
      return;
    }

    const userMessage = { id: Date.now(), text: text, isUser: true };
    setMessages((old) => [...old, userMessage]);
    setInput('');

    // Fake AI reply after 1 second. Gemini replaces this in a later phase.
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: 'This is a demo reply. Real AI answers will appear here once Gemini is connected.',
        isUser: false,
      };
      setMessages((old) => [...old, aiMessage]);
    }, 1000);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button
          className={styles.backButton}
          aria-label="Back to Dashboard"
          onClick={() => router.push('/dashboard')}
        >
          <IoArrowBack size={22} />
        </button>
        <div>
          <h1 className={styles.title}>CampusAI Assistant</h1>
          <div className={styles.status}>
            <span className={styles.dot}></span>
            <span>Online</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messages} ref={messagesRef}>
        {messages.map((message) => (
          <ChatBubble key={message.id} text={message.text} isUser={message.isUser} />
        ))}
      </div>

      {/* Input bar */}
      <form className={styles.inputBar} onSubmit={handleSend}>
        <button
          type="button"
          className={styles.attachButton}
          aria-label="Attach a file"
          onClick={() => alert('Attachments will be added later.')}
        >
          <IoAttach size={24} />
        </button>
        <input
          className={styles.textInput}
          type="text"
          placeholder="Type your question..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" className={styles.sendButton} aria-label="Send message">
          <IoSend size={18} />
        </button>
      </form>
    </div>
  );
}