'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoAttach, IoSend } from 'react-icons/io5';
import ChatBubble from '../../../components/ChatBubble';
import styles from './chat.module.css';

const startingMessages = [
  {
    id: 1,
    text: "Hello! Ask me anything about your courses, notes, or assignments. I'm here to help.",
    isUser: false,
  },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(startingMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  // Scroll to the newest message whenever the list or loading state changes
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (event) => {
    event.preventDefault();

    const text = input.trim();
    if (text === '' || loading) {
      return;
    }

    const userMessage = { id: Date.now(), text: text, isUser: true };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setMessages((old) => [...old, { id: Date.now() + 1, text: data.reply, isUser: false }]);
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          id: Date.now() + 1,
          text: 'Sorry, I could not get an answer right now. Please try again in a moment.',
          isUser: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
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
        {loading && <ChatBubble text="Thinking..." isUser={false} />}
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
        <button
          type="submit"
          className={styles.sendButton}
          aria-label="Send message"
          disabled={loading}
        >
          <IoSend size={18} />
        </button>
      </form>
    </div>
  );
}