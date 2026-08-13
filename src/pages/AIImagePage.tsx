import { useState } from 'react';
import { Link } from 'wouter';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import './pixelForge.css';

type AITextResponse = {
  text?: string;
  error?: string;
};

type ChatMessage = {
  id: number;
  role: 'user' | 'ai';
  text: string;
};

const systemPrompt = [
  'Ты генератор картинок.',
  'Придумывай безопасное описание картинки по теме пользователя.',
  'После первого ответа продолжай как чат: меняй, уточняй или объясняй идею по просьбе пользователя.',
  'Не генерируй плохие картинки: жестокость, ненависть, опасные действия, сексуальный контент и травлю.',
  'Если тема плохая, предложи безопасную добрую альтернативу.',
].join(' ');

export function AIImagePage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('AI generator ready');
  const [isGenerating, setIsGenerating] = useState(false);

  async function sendMessage() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setStatus('Напиши тему или вопрос');
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus('Supabase is not configured');
      return;
    }

    const nextMessages = [...messages, { id: Date.now(), role: 'user' as const, text: cleanPrompt }];
    setMessages(nextMessages);
    setPrompt('');
    setIsGenerating(true);
    setStatus('Generating...');

    const { data, error } = await supabase.functions.invoke<AITextResponse>('ai', {
      body: {
        prompt: makeChatPrompt(nextMessages),
        system: systemPrompt,
      },
    });

    if (error) {
      setStatus(error.message);
      setIsGenerating(false);
      return;
    }

    setMessages((current) => [
      ...current,
      { id: Date.now() + 1, role: 'ai', text: data?.text ?? data?.error ?? 'AI returned empty text' },
    ]);
    setStatus('Done');
    setIsGenerating(false);
  }

  function clearChat() {
    setMessages([]);
    setPrompt('');
    setStatus('AI generator ready');
  }

  return (
    <div className="pf-app pf-aiPage">
      <header className="pf-topbar">
        <div className="pf-brand">
          <span className="pf-brandMark" />
          AI Image Ideas
        </div>
        <nav className="pf-actions">
          <Link href="/">Главное меню</Link>
          <Link href="/pixel-forge">Editor</Link>
          <Link className="active" href="/ai-image">AI Generator</Link>
        </nav>
      </header>
      <main className="pf-aiPageMain">
        <section className="pf-aiPanel">
          <h2>AI Image Chat</h2>
          <div className="pf-aiChat" aria-live="polite">
            {messages.length === 0 ? (
              <p className="pf-aiEmpty">Напиши тему картинки, а потом проси AI изменить или объяснить идею.</p>
            ) : (
              messages.map((message) => (
                <article className={`pf-aiBubble ${message.role}`} key={message.id}>
                  <h3>{message.role === 'user' ? 'You' : 'AI'}</h3>
                  <p>{message.text}</p>
                </article>
              ))
            )}
          </div>
          <label>
            Message
            <textarea
              rows={4}
              value={prompt}
              placeholder="Например: космический кот. Потом: сделай стиль темнее или добавь фон."
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
          <div className="pf-aiActions">
            <button className="pf-primary" type="button" disabled={isGenerating} onClick={() => void sendMessage()}>
              {isGenerating ? 'Generating...' : messages.length ? 'Send' : 'Generate'}
            </button>
            <button type="button" disabled={isGenerating || messages.length === 0} onClick={clearChat}>
              Clear
            </button>
          </div>
        </section>
      </main>
      <footer className="pf-statusbar">
        <span>{status}</span>
        <span>Gemini</span>
        <span>{messages.length ? `${messages.length} messages` : 'No messages yet'}</span>
      </footer>
    </div>
  );
}

function makeChatPrompt(messages: ChatMessage[]) {
  return messages
    .slice(-8)
    .map((message) => `${message.role === 'user' ? 'Пользователь' : 'AI'}: ${message.text}`)
    .join('\n\n');
}
