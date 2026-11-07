import React, { useState, useEffect } from 'react';

export default function App() {
  const [status, setStatus] = useState('Łączenie z API...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(`Backend status: ${data.status}`))
      .catch(() => setStatus('Brak połączenia z /api/health'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Hello World</h1>
      <p>{status}</p>
    </div>
  );
}