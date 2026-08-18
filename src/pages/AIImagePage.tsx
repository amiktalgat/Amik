import { useState } from 'react';
import { Link } from 'wouter';
import { AIImageMaker } from '../components/AIImageMaker';
import { getFunctionErrorMessage } from '../lib/functionError';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { friendlyDataError } from '../lib/userMessages';
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
  'You are an image idea generator for a teen pixel-art app.',
  'Suggest safe, vivid picture descriptions based on the user topic.',
  'After the first answer, continue as a chat: edit, clarify, or explain the idea.',
  'Avoid cruelty, hate, dangerous actions, sexual content, and bullying.',
  'If the topic is unsafe, offer a kind safe alternative.',
].join(' ');

export function AIImagePage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('AI tools ready');
  const [isGenerating, setIsGenerating] = useState(false);

  async function sendMessage() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setStatus('Write a theme or question');
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
    setStatus('Generating idea...');

    const { data, error } = await supabase.functions.invoke<AITextResponse>('ai', {
      body: {
        prompt: makeChatPrompt(nextMessages),
        system: systemPrompt,
      },
    });

    if (error) {
      setStatus(friendlyDataError(await getFunctionErrorMessage(error)));
      setIsGenerating(false);
      return;
    }

    setMessages((current) => [
      ...current,
      { id: Date.now() + 1, role: 'ai', text: data?.text ?? data?.error ?? 'AI returned empty text' },
    ]);
    setStatus('Idea ready');
    setIsGenerating(false);
  }

  function clearChat() {
    setMessages([]);
    setPrompt('');
    setStatus('AI tools ready');
  }

  return (
    <div className="pf-app pf-aiPage">
      <header className="pf-topbar">
        <div className="pf-brand">
          <span className="pf-brandMark" />
          AI Image Studio
        </div>
        <nav className="pf-actions">
          <Link href="/choose">Back</Link>
          <Link href="/pixel-forge">Editor</Link>
          <Link className="active" href="/ai-image">AI Generator</Link>
        </nav>
      </header>
      <main className="pf-aiPageMain">
        <section className="pf-aiPanel">
          <h2>AI Idea Chat</h2>
          <div className="pf-aiChat" aria-live="polite">
            {messages.length === 0 ? (
              <p className="pf-aiEmpty">Write a picture theme, then ask AI to edit or explain the idea.</p>
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
              placeholder="For example: a space castle. Then: make it darker or add a background."
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
          <div className="pf-aiActions">
            <button className="pf-primary" type="button" disabled={isGenerating} onClick={() => void sendMessage()}>
              {isGenerating ? 'Generating...' : messages.length ? 'Send' : 'Generate Idea'}
            </button>
            <button type="button" disabled={isGenerating || messages.length === 0} onClick={clearChat}>
              Clear
            </button>
          </div>
        </section>
        <AIImageMaker onStatus={setStatus} />
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
    .map((message) => `${message.role === 'user' ? 'User' : 'AI'}: ${message.text}`)
    .join('\n\n');
}
