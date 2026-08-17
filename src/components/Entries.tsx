import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type Entry = {
  id: string;
  title: string;
  created_at: string;
};

export function Entries({ userEmail }: { userEmail: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('entries')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setEntries(data ?? []);
  }

  useEffect(() => {
    if (isSupabaseConfigured) void load();
  }, []);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase.from('entries').insert({ title: title.trim() });
    if (error) setError(error.message);
    else {
      setTitle('');
      void load();
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) setError(error.message);
    else void load();
  }

  return (
    <section className="card">
      <p className="hello">Hi, {userEmail}</p>
      <h2>My notes</h2>

      <form onSubmit={add} className="form-row">
        <input
          placeholder="Add your first note..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="message">{error}</p>}

      {entries.length === 0 ? (
        <section className="empty-state empty-state--compact">
          <h2>No notes yet</h2>
          <p>Add one short note above to check that saving to Supabase works.</p>
        </section>
      ) : (
        <ul className="list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span>{entry.title}</span>
              <button className="ghost small" onClick={() => void remove(entry.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
