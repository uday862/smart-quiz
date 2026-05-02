import React, { useState } from 'react';
import API_BASE_URL from '../../config';
import { MessageSquare, X, Send } from 'lucide-react';

const SimpleChatbot = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! I can show you your marks. Just ask me "What are my marks?" or "Show my scores".' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMarks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attempts/student/${userId}`);
      const attempts = await res.json();
      
      const completed = attempts.filter(a => a.status === 'completed');
      if (completed.length === 0) return "You haven't completed any tasks yet.";

      const marksMsg = completed.map(a => {
        const title = a.exam?.title || 'Unknown Task';
        const qType = a.exam?.questions?.[0]?.type;
        const total = qType === 'SQL' ? 100 : a.exam?.questions?.length || 1;
        return `• ${title}: ${a.score}/${total}`;
      }).join('\n');

      return `Here are your marks:\n${marksMsg}`;
    } catch (err) {
      return "Sorry, I couldn't fetch your marks right now.";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    const lowerInput = userText.toLowerCase();
    let botReply = '';

    // FAQ Logic
    if (lowerInput.includes('password') || lowerInput.includes('reset')) {
      botReply = "You can reset your password from the 'Profile' section using the 'Change Password' option.";
    } else if (lowerInput.includes('contact') || lowerInput.includes('support') || lowerInput.includes('help')) {
      botReply = "For support, please reach out to your instructor or system administrator via email.";
    } else if (lowerInput.includes('how to use') || lowerInput.includes('guide')) {
      botReply = "Navigate to 'Assignments' to see your pending tasks. Once completed, you can view your scores in 'Reports'.";
    } else if (lowerInput.includes('group') || lowerInput.includes('section')) {
      botReply = "Your group and section are assigned by the Admin. You can view them in your Profile.";
    } else if (lowerInput.includes('mark') || lowerInput.includes('score') || lowerInput.includes('grade') || lowerInput.includes('result')) {
      botReply = await fetchMarks();
    } else {
      botReply = "I can answer general FAQs (like password resets, support, groups) or show your marks. Try asking 'How do I reset my password?' or 'What are my marks?'";
    }

    setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    setLoading(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f36d44, #e85d2f)', color: 'white',
            border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(243, 109, 68, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          width: '320px', height: '420px', background: 'var(--bg-card, white)',
          borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}>
          {/* Header */}
          <div style={{ background: '#071125', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} />
              <span style={{ fontWeight: 'bold' }}>Marks Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={18}/></button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color, #f8fafc)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: m.sender === 'user' ? '#f36d44' : 'var(--bg-card, white)',
                  color: m.sender === 'user' ? 'white' : 'var(--text-color, #1e293b)',
                  padding: '0.75rem 1rem', borderRadius: '12px',
                  borderBottomRightRadius: m.sender === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: m.sender === 'bot' ? '4px' : '12px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.4
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Typing...</div>}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid var(--border-color, #e2e8f0)', padding: '0.75rem', background: 'var(--bg-card, white)' }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask for your marks..."
              style={{ flex: 1, border: 'none', outline: 'none', padding: '0.5rem', fontSize: '0.85rem', background: 'transparent', color: 'var(--text-color, #000)' }}
            />
            <button type="submit" style={{ background: '#f36d44', color: 'white', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SimpleChatbot;
