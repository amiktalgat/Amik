import { useState } from 'react';
import { Link } from 'wouter';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import './pixelForge.css';

type AITextResponse = {
  text?: string;
  error?: string;
};

const systemPrompt = [
  'Ты генератор картинок.',
  'Придумывай безопасное описание картинки по теме пользователя.',
  'Не генерируй плохие картинки: жестокость, ненависть, опасные действия, сексуальный контент и травлю.',
  'Если тема плохая, предложи безопасную добрую альтернативу.',
].join(' ');

export function AIImagePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('AI generator ready');
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateImageIdea() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setStatus('Напиши тему для картинки');
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus('Supabase is not configured');
      return;
    }

    setIsGenerating(true);
    setStatus('Generating...');

    const { data, error } = await supabase.functions.invoke<AITextResponse>('ai', {
      body: {
        prompt: `Сгенерируй картинку по теме: ${cleanPrompt}`,
        system: systemPrompt,
      },
    });

    if (error) {
      setStatus(error.message);
      setIsGenerating(false);
      return;
    }

    setResult(data?.text ?? data?.error ?? 'AI returned empty text');
    setStatus('Done');
    setIsGenerating(false);
  }

  return (
    <div className="pf-app pf-aiPage">
      <header className="pf-topbar">
        <div className="pf-brand">
          <span className="pf-brandMark" />
          AI Image Ideas
        </div>
        <nav className="pf-actions">
          <Link href="/pixel-forge">Editor</Link>
          <Link className="active" href="/ai-image">AI Generator</Link>
        </nav>
      </header>
      <main className="pf-aiPageMain">
        <section className="pf-aiPanel">
          <h2>Generate Image By Topic</h2>
          <label>
            Theme
            <textarea
              rows={4}
              value={prompt}
              placeholder="Например: космический кот, город будущего, магический лес"
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
          <div className="pf-aiActions">
            <button className="pf-primary" type="button" disabled={isGenerating} onClick={() => void generateImageIdea()}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {result && (
            <article className="pf-aiTextResult">
              <h3>Result</h3>
              <p>{result}</p>
            </article>
          )}
        </section>
      </main>
      <footer className="pf-statusbar">
        <span>{status}</span>
        <span>Gemini</span>
        <span>{result ? 'Text ready' : 'No result yet'}</span>
      </footer>
    </div>
  );
}
