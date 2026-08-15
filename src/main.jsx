import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [city, setCity] = useState('');
  const [highway, setHighway] = useState('');

  const sum = (value) => value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((total, item) => total + (Number(item.replace(',', '.')) || 0), 0);

  const cityTotal = sum(city);
  const highwayTotal = sum(highway);

  return (
    <main className="app">
      <header>
        <div>
          <h1>Путёвка</h1>
          <p>Помощник водителя</p>
        </div>
      </header>

      <section className="card">
        <h2>Проверка приложения</h2>
        <p>Если вы видите этот экран, React и Vercel работают нормально.</p>
      </section>

      <section className="card">
        <h2>Поездка</h2>
        <label>Город, км</label>
        <input
          inputMode="decimal"
          placeholder="Например: 25 31"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <label>Трасса, км</label>
        <input
          inputMode="decimal"
          placeholder="Например: 120 80"
          value={highway}
          onChange={(e) => setHighway(e.target.value)}
        />

        <div className="preview">
          Город: <b>{cityTotal} км</b><br />
          Трасса: <b>{highwayTotal} км</b><br />
          Всего: <b>{cityTotal + highwayTotal} км</b>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
