import { createSignal, createResource, Show, For } from 'solid-js';

const API = '';

function api(path, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  }).then(r => r.json());
}

// --- Auth form ---
function AuthForm({ onLogin }) {
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [isRegister, setIsRegister] = createSignal(false);
  const [error, setError] = createSignal('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const endpoint = isRegister() ? '/auth/register' : '/auth/login';
    const data = await api(endpoint, {
      method: 'POST',
      body: JSON.stringify({ username: username(), password: password() }),
    });
    if (data.error) return setError(data.error);
    if (isRegister()) {
      setIsRegister(false);
    } else {
      localStorage.setItem('token', data.token);
      onLogin(data.token);
    }
  }

  return (
    <div style={{ 'max-width': '320px', margin: '60px auto' }}>
      <h2>{isRegister() ? 'Register' : 'Login'}</h2>
      <form onSubmit={submit}>
        <div><input placeholder="Username" value={username()} onInput={e => setUsername(e.target.value)} required /></div>
        <div><input placeholder="Password" type="password" value={password()} onInput={e => setPassword(e.target.value)} required /></div>
        <div><button type="submit">{isRegister() ? 'Register' : 'Login'}</button></div>
      </form>
      <Show when={error()}><p style={{ color: 'red' }}>{error()}</p></Show>
      <button onClick={() => setIsRegister(v => !v)}>
        {isRegister() ? 'Have an account? Login' : 'No account? Register'}
      </button>
    </div>
  );
}

// --- Posts ---
function Posts() {
  const [posts, { refetch: refetchPosts }] = createResource(() => api('/posts'));
  const [title, setTitle] = createSignal('');
  const [body, setBody] = createSignal('');
  const [selectedPost, setSelectedPost] = createSignal(null);

  async function createPost(e) {
    e.preventDefault();
    await api('/posts', { method: 'POST', body: JSON.stringify({ title: title(), body: body() }) });
    setTitle(''); setBody('');
    refetchPosts();
  }

  async function deletePost(id) {
    await api(`/posts/${id}`, { method: 'DELETE' });
    if (selectedPost()?.id === id) setSelectedPost(null);
    refetchPosts();
  }

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 1 }}>
        <h3>Posts</h3>
        <form onSubmit={createPost}>
          <input placeholder="Title" value={title()} onInput={e => setTitle(e.target.value)} required />
          <input placeholder="Body" value={body()} onInput={e => setBody(e.target.value)} />
          <button type="submit">Add</button>
        </form>
        <Show when={!posts.loading} fallback={<p>Loading...</p>}>
          <For each={posts()}>
            {post => (
              <div style={{ border: '1px solid #ccc', padding: '8px', margin: '4px 0', cursor: 'pointer' }}
                onClick={() => setSelectedPost(post)}>
                <strong>{post.title}</strong> <small>by {post.username}</small>
                <button onClick={e => { e.stopPropagation(); deletePost(post.id); }} style={{ float: 'right' }}>x</button>
              </div>
            )}
          </For>
        </Show>
      </div>

      <Show when={selectedPost()}>
        <Comments post={selectedPost()} onClose={() => setSelectedPost(null)} />
      </Show>
    </div>
  );
}

// --- Comments ---
function Comments({ post, onClose }) {
  const [comments, { refetch }] = createResource(() => post?.id, id => api(`/comments/${id}`));
  const [text, setText] = createSignal('');

  async function addComment(e) {
    e.preventDefault();
    await api(`/comments/${post.id}`, { method: 'POST', body: JSON.stringify({ text: text() }) });
    setText('');
    refetch();
  }

  async function deleteComment(id) {
    await api(`/comments/${id}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <div style={{ flex: 1 }}>
      <h3>Comments — {post.title} <button onClick={onClose}>close</button></h3>
      <form onSubmit={addComment}>
        <input placeholder="Comment" value={text()} onInput={e => setText(e.target.value)} required />
        <button type="submit">Add</button>
      </form>
      <Show when={!comments.loading} fallback={<p>Loading...</p>}>
        <For each={comments()}>
          {c => (
            <div style={{ border: '1px solid #eee', padding: '6px', margin: '4px 0' }}>
              <small>{c.username}:</small> {c.text}
              <button onClick={() => deleteComment(c.id)} style={{ float: 'right' }}>x</button>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

// --- App ---
export default function App() {
  const [token, setToken] = createSignal(localStorage.getItem('token'));

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  return (
    <div style={{ padding: '16px', 'font-family': 'sans-serif' }}>
      <Show when={token()} fallback={<AuthForm onLogin={setToken} />}>
        <div>
          <button onClick={logout} style={{ float: 'right' }}>Logout</button>
          <Posts />
        </div>
      </Show>
    </div>
  );
}
