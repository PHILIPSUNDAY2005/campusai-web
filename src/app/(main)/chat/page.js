'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IoAdd,
  IoArrowBack,
  IoClose,
  IoImageOutline,
  IoSend,
  IoTimeOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import { auth } from '../../../lib/firebase';
import useAuth from '../../../lib/useAuth';
import ChatBubble from '../../../components/ChatBubble';
import styles from './chat.module.css';

const startingMessages = [
  {
    id: 1,
    text: "Hello! Ask me anything about your courses, notes, or assignments. I'm here to help.",
    isUser: false,
  },
];

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // the photo is made smaller before it is sent
const MAX_SIDE = 1600; // longest side of the photo, in pixels

// Makes the photo smaller so it uploads quickly and fits the hosting limit.
// Returns { preview, data, mimeType } where data is the picture as base64 text.
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff'; // PNG pictures can be see-through
      context.fillRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ preview: dataUrl, data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that photo.'));
    };

    img.src = url;
  });
}

// The first name used in the welcome message and sent to the AI so it can greet back
function getFirstName(user) {
  if (!user || !user.displayName) {
    return '';
  }
  const first = user.displayName.trim().split(/\s+/)[0] || '';
  return first.replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, 30);
}

// The student's login token. The server needs it for every request.
async function getToken() {
  if (!auth.currentUser) {
    throw new Error('Please log in again.');
  }
  return auth.currentUser.getIdToken();
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState(startingMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null); // which saved chat is open (null = new chat)
  const [photo, setPhoto] = useState(null); // the photo waiting to be sent
  const [feedback, setFeedback] = useState({}); // thumbs: { messageId: 'up' | 'down' }
  const [notice, setNotice] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const messagesRef = useRef(null);
  const fileRef = useRef(null);

  const firstName = getFirstName(user);
  const welcomeText =
    'Welcome back' +
    (firstName ? ', ' + firstName : '') +
    '! What would you like to study today? Ask me anything about your courses, notes, or assignments.';

  // Scroll to the newest message whenever the list or loading state changes
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading, historyOpen]);

  // ---------- Photo ----------

  const handlePickPhoto = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = ''; // lets the student pick the same photo again later
    if (!file) {
      return;
    }

    setNotice('');
    if (!PHOTO_TYPES.includes(file.type)) {
      setNotice('Please choose a JPG, PNG or WebP photo.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setNotice('That photo is too big. Please choose one under 15 MB.');
      return;
    }

    try {
      setPhoto(await shrinkPhoto(file));
    } catch (error) {
      setNotice('Could not read that photo. Please try another one.');
    }
  };

  // ---------- Sending ----------

  const handleSend = async (event) => {
    event.preventDefault();

    const text = input.trim();
    if ((text === '' && !photo) || loading) {
      return;
    }

    const question = text === '' ? 'Please explain this photo.' : text;
    const userMessage = {
      id: Date.now(),
      text: photo ? '[Photo attached] ' + question : question,
      isUser: true,
    };
    const updatedMessages = [...messages, userMessage];
    const photoToSend = photo;

    setMessages(updatedMessages);
    setInput('');
    setPhoto(null);
    setNotice('');
    setLoading(true);

    try {
      const token = await getToken();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          chatId: chatId,
          name: firstName,
          image: photoToSend ? { mimeType: photoToSend.mimeType, data: photoToSend.data } : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      if (data.chatId) {
        setChatId(data.chatId);
      }
      setMessages((old) => [
        ...old,
        { id: data.replyId || Date.now() + 1, text: data.reply, isUser: false, rateable: true },
      ]);
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          id: Date.now() + 1,
          text:
            error && error.message && error.message !== 'Failed to fetch'
              ? error.message
              : 'Sorry, I could not get an answer right now. Please check your connection and try again.',
          isUser: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Thumbs up / down ----------

  const handleRate = async (messageId, rating) => {
    if (!chatId) {
      return;
    }
    const previous = feedback[messageId] || null;

    const apply = (value) =>
      setFeedback((old) => {
        const next = { ...old };
        if (value === null) {
          delete next[messageId];
        } else {
          next[messageId] = value;
        }
        return next;
      });

    apply(rating); // show it at once, undo it if saving fails
    setNotice('');

    try {
      const token = await getToken();
      const response = await fetch('/api/chats/' + chatId, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ messageId: messageId, rating: rating }),
      });
      if (!response.ok) {
        throw new Error('Could not save');
      }
    } catch (error) {
      apply(previous);
      setNotice('Could not save your feedback. Please try again.');
    }
  };

  // ---------- Saved chats ----------

  const loadChats = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/chats', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not load your chats.');
      }
      setChats(Array.isArray(data.chats) ? data.chats : []);
    } catch (error) {
      setHistoryError(error.message || 'Could not load your chats.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    setHistoryOpen(true);
    loadChats();
  };

  const startNewChat = () => {
    if (loading) {
      return;
    }
    setMessages(startingMessages);
    setChatId(null);
    setFeedback({});
    setInput('');
    setPhoto(null);
    setNotice('');
    setHistoryOpen(false);
  };

  const openChat = async (id) => {
    if (loading) {
      return;
    }
    setHistoryError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/chats/' + id, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not open that chat.');
      }
      setMessages(data.messages.length > 0 ? data.messages : startingMessages);
      setChatId(id);
      setFeedback(data.feedback && typeof data.feedback === 'object' ? data.feedback : {});
      setPhoto(null);
      setNotice('');
      setHistoryOpen(false);
    } catch (error) {
      setHistoryError(error.message || 'Could not open that chat.');
    }
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) {
      return;
    }
    setHistoryError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/chats/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not delete that chat.');
      }
      setChats((old) => old.filter((chat) => chat.id !== id));
      if (id === chatId) {
        setMessages(startingMessages);
        setChatId(null);
        setFeedback({});
      }
    } catch (error) {
      setHistoryError(error.message || 'Could not delete that chat.');
    }
  };

  const formatDate = (milliseconds) => {
    if (!milliseconds) {
      return '';
    }
    return new Date(milliseconds).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
        <div className={styles.headerText}>
          <h1 className={styles.title}>CampusAI Assistant</h1>
          <div className={styles.status}>
            <span className={styles.dot}></span>
            <span>Online</span>
          </div>
        </div>
        <button
          className={styles.backButton}
          aria-label="Start a new chat"
          title="New chat"
          onClick={startNewChat}
        >
          <IoAdd size={22} />
        </button>
        <button
          className={`${styles.backButton} ${historyOpen ? styles.activeButton : ''}`}
          aria-label="Previous conversations"
          title="Previous conversations"
          onClick={toggleHistory}
        >
          <IoTimeOutline size={22} />
        </button>
      </header>

      {/* Previous conversations, or the messages */}
      {historyOpen ? (
        <div className={styles.historyPanel}>
          <h2 className={styles.historyHeading}>Previous conversations</h2>

          {historyLoading && <p className={styles.historyNote}>Loading...</p>}
          {historyError && <p className={styles.historyError}>{historyError}</p>}
          {!historyLoading && !historyError && chats.length === 0 && (
            <p className={styles.historyNote}>
              No saved conversations yet. Ask the assistant a question and it will be saved here.
            </p>
          )}

          {chats.map((chat) => (
            <div key={chat.id} className={styles.historyItem}>
              <button className={styles.historyOpen} onClick={() => openChat(chat.id)}>
                <span className={styles.historyTitle}>{chat.title}</span>
                <span className={styles.historyDate}>{formatDate(chat.updatedAt)}</span>
              </button>
              <button
                className={styles.historyDelete}
                aria-label={'Delete ' + chat.title}
                onClick={() => deleteChat(chat.id)}
              >
                <IoTrashOutline size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.messages} ref={messagesRef}>
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id + '-' + index}
              text={message.id === 1 && !message.isUser ? welcomeText : message.text}
              isUser={message.isUser}
              canRate={!message.isUser && message.rateable === true && !!chatId}
              rating={feedback[message.id] || null}
              onRate={(rating) => handleRate(message.id, rating)}
            />
          ))}
          {loading && <ChatBubble text="Thinking..." isUser={false} />}
        </div>
      )}

      {/* Photo waiting to be sent */}
      {photo && !historyOpen && (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.previewImage} src={photo.preview} alt="Photo to send" />
          <span className={styles.previewText}>Photo ready. Add a question or just send it.</span>
          <button
            type="button"
            className={styles.previewRemove}
            aria-label="Remove photo"
            onClick={() => setPhoto(null)}
          >
            <IoClose size={18} />
          </button>
        </div>
      )}

      {notice && <p className={styles.notice}>{notice}</p>}

      {/* Input bar */}
      <form className={styles.inputBar} onSubmit={handleSend}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenInput}
          onChange={handlePickPhoto}
        />
        <button
          type="button"
          className={styles.attachButton}
          aria-label="Attach a photo"
          disabled={loading}
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          <IoImageOutline size={24} />
        </button>
        <input
          className={styles.textInput}
          type="text"
          placeholder={photo ? 'Ask about this photo...' : 'Type your question...'}
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
