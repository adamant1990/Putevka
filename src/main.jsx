import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'putevka_calculator_settings';
const DEFAULT_SETTINGS = { city: 18, highway: 14 };
const numberValue = value => Number(String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
const format = value => Number(value || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

function Settings({ settings, onSave, onBack }) {
  const [city, setCity] = useState(String(settings.city ?? ''));
  const [highway, setHighway] = useState(String(settings.highway ?? ''));
  const save = () => { onSave({ city: numberValue(city), highway: numberValue(highway) }); onBack(); };
  return <main className="app"><header><div><h1>Настройки</h1><p>Нормы расхода топлива</p></div><button className="icon" onClick={onBack}>×</button></header><section className="card"><h2>Расход топлива</h2><p className="muted">Укажите норму расхода автомобиля в литрах на 100 км. Значения сохраняются на этом устройстве.</p><label>🏙️ Город, л/100 км</label><input inputMode="decimal" value={city} onChange={e => setCity(e.target.value)} placeholder="18" autoFocus /><label>🛣️ Трасса, л/100 км</label><input inputMode="decimal" value={highway} onChange={e => setHighway(e.target.value)} placeholder="14" onKeyDown={e => e.key === 'Enter' && save()} /><button className="primary big" onClick={save}>Сохранить настройки</button></section></main>;
}

function Calculator({ settings, onSettings }) {
  const [cityKm, setCityKm] = useState('');
  const [highwayKm, setHighwayKm] = useState('');
  const city = numberValue(cityKm), highway = numberValue(highwayKm);
  const cityFuel = city * numberValue(settings.city) / 100;
  const highwayFuel = highway * numberValue(settings.highway) / 100;
  const totalKm = city + highway, totalFuel = cityFuel + highwayFuel;
  const clear = () => { setCityKm(''); setHighwayKm(''); };
  return <main className="app"><header><div><h1>Калькулятор</h1><p>Расход топлива по пробегу</p></div><button className="icon" onClick={onSettings} title="Настройки">⚙️</button></header><section className="card"><div className="row"><h2>Пробег</h2><button className="small" onClick={clear}>Очистить</button></div><label>🏙️ Город, км</label><input inputMode="decimal" value={cityKm} onChange={e => setCityKm(e.target.value)} placeholder="Например, 50" autoFocus /><label>🛣️ Трасса, км</label><input inputMode="decimal" value={highwayKm} onChange={e => setHighwayKm(e.target.value)} placeholder="Например, 120" /></section><section className="fuelbox"><span>⛽ Расчётный расход</span><strong>{format(totalFuel)} л</strong><em>{format(totalKm)} км общего пробега</em></section><section className="card results"><h2>Результат</h2><div className="item"><div><b>Город</b><span>{format(city)} км × {format(settings.city)} л/100 км</span></div><strong>{format(cityFuel)} л</strong></div><div className="item"><div><b>Трасса</b><span>{format(highway)} км × {format(settings.highway)} л/100 км</span></div><strong>{format(highwayFuel)} л</strong></div><div className="totals"><span>Всего: {format(totalKm)} км</span><strong>{format(totalFuel)} л</strong></div></section><section className="card norms-card"><div className="row"><h2>Текущие нормы</h2><button className="small" onClick={onSettings}>Изменить</button></div><div className="norm-row"><span>🏙️ Город</span><b>{format(settings.city)} л/100 км</b></div><div className="norm-row"><span>🛣️ Трасса</span><b>{format(settings.highway)} л/100 км</b></div></section></main>;
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [screen, setScreen] = useState('calculator');
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (saved && typeof saved === 'object') setSettings({ city: numberValue(saved.city), highway: numberValue(saved.highway) }); } catch {} }, []);
  const saveSettings = next => { const safe = { city: numberValue(next.city), highway: numberValue(next.highway) }; setSettings(safe); localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); };
  return screen === 'settings' ? <Settings settings={settings} onSave={saveSettings} onBack={() => setScreen('calculator')} /> : <Calculator settings={settings} onSettings={() => setScreen('settings')} />;
}

createRoot(document.getElementById('root')).render(<App />);
