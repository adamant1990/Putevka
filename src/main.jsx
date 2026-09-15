import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SETTINGS_KEY = 'putevka_calculator_settings';
const SHIFT_KEY = 'putevka_shift_data';
const DEFAULT_SETTINGS = { city: 18, highway: 14 };
const DEFAULT_SHIFT = { odometer: '', startFuel: '', trips: [], refuels: [] };

const sumValues = value => String(value ?? '')
  .replace(/,/g, '.')
  .split(/\s+/)
  .map(item => Number(item.replace(/[^0-9.]/g, '')) || 0)
  .reduce((sum, item) => sum + item, 0);

const numberValue = value => sumValues(value);
const format = value => Number(value || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

function Settings({ settings, onSave, onBack }) {
  const [city, setCity] = useState(String(settings.city ?? ''));
  const [highway, setHighway] = useState(String(settings.highway ?? ''));

  const save = () => {
    onSave({ city: numberValue(city), highway: numberValue(highway) });
    onBack();
  };

  return <main className="app">
    <header><div><h1>Настройки</h1><p>Нормы расхода топлива</p></div><button className="icon" onClick={onBack}>×</button></header>
    <section className="card">
      <h2>Расход топлива</h2>
      <p className="muted">Укажите норму расхода автомобиля в литрах на 100 км.</p>
      <label>🏙️ Город, л/100 км</label>
      <input inputMode="decimal" value={city} onChange={e => setCity(e.target.value)} placeholder="18" autoFocus />
      <label>🛣️ Трасса, л/100 км</label>
      <input inputMode="decimal" value={highway} onChange={e => setHighway(e.target.value)} placeholder="14" onKeyDown={e => e.key === 'Enter' && save()} />
      <button className="primary big" onClick={save}>Сохранить настройки</button>
    </section>
  </main>;
}

function Calculator({ settings, onSettings }) {
  const [shift, setShift] = useState(DEFAULT_SHIFT);
  const [newCity, setNewCity] = useState('');
  const [newHighway, setNewHighway] = useState('');
  const [newRefuel, setNewRefuel] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SHIFT_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        setShift({
          ...DEFAULT_SHIFT,
          ...saved,
          trips: Array.isArray(saved.trips) ? saved.trips : [],
          refuels: Array.isArray(saved.refuels) ? saved.refuels : []
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(SHIFT_KEY, JSON.stringify(shift));
  }, [shift]);

  const trips = shift.trips;
  const refuels = shift.refuels;
  const city = trips.reduce((sum, trip) => sum + numberValue(trip.cityKm), 0);
  const highway = trips.reduce((sum, trip) => sum + numberValue(trip.highwayKm), 0);
  const totalKm = city + highway;
  const cityFuel = city * numberValue(settings.city) / 100;
  const highwayFuel = highway * numberValue(settings.highway) / 100;
  const totalFuel = cityFuel + highwayFuel;
  const totalRefuel = refuels.reduce((sum, item) => sum + numberValue(item.liters), 0);
  const startFuel = numberValue(shift.startFuel);
  const estimatedEndFuel = startFuel + totalRefuel - totalFuel;

  const addTrip = () => {
    if (numberValue(newCity) <= 0 && numberValue(newHighway) <= 0) return;
    setShift(prev => ({
      ...prev,
      trips: [...prev.trips, { id: Date.now(), cityKm: newCity, highwayKm: newHighway }]
    }));
    setNewCity('');
    setNewHighway('');
  };

  const deleteTrip = id => setShift(prev => ({ ...prev, trips: prev.trips.filter(trip => trip.id !== id) }));

  const addRefuel = () => {
    const liters = numberValue(newRefuel);
    if (liters <= 0) return;
    setShift(prev => ({
      ...prev,
      refuels: [...prev.refuels, { id: Date.now(), liters: newRefuel }]
    }));
    setNewRefuel('');
  };

  const deleteRefuel = id => setShift(prev => ({ ...prev, refuels: prev.refuels.filter(item => item.id !== id) }));

  const clear = () => {
    if (window.confirm('Очистить данные текущей смены, поездки и заправки?')) setShift(DEFAULT_SHIFT);
  };

  return <main className="app">
    <header>
      <div><h1>Путёвка</h1><p>Расход топлива по путевому листу</p></div>
      <button className="icon" onClick={onSettings} title="Настройки">⚙️</button>
    </header>

    <section className="card">
      <div className="row"><h2>Данные смены</h2><button className="small" onClick={clear}>Очистить</button></div>
      <label>🚗 Пробег по одометру, км</label>
      <input inputMode="decimal" value={shift.odometer} onChange={e => setShift(prev => ({ ...prev, odometer: e.target.value }))} placeholder="Например, 125430" autoFocus />
      <label>⛽ Остаток топлива на начало смены, л</label>
      <input inputMode="decimal" value={shift.startFuel} onChange={e => setShift(prev => ({ ...prev, startFuel: e.target.value }))} placeholder="Например, 85" />
    </section>

    <section className="card">
      <div className="row"><h2>Поездки</h2><span className="badge">{trips.length}</span></div>
      <p className="muted">Добавляйте каждую поездку отдельно. Пробег автоматически суммируется.</p>
      <label>🏙️ Город, км</label>
      <input inputMode="decimal" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Например, 35" />
      <label>🛣️ Трасса, км</label>
      <input inputMode="decimal" value={newHighway} onChange={e => setNewHighway(e.target.value)} placeholder="Например, 120" onKeyDown={e => e.key === 'Enter' && addTrip()} />
      <button className="primary" onClick={addTrip}>＋ Добавить поездку</button>

      {trips.length > 0 && <div className="list">
        {trips.map((trip, index) => <div className="list-item" key={trip.id}>
          <div><b>Поездка {index + 1}</b><span>Город: {format(numberValue(trip.cityKm))} км · Трасса: {format(numberValue(trip.highwayKm))} км</span></div>
          <button className="delete" onClick={() => deleteTrip(trip.id)}>×</button>
        </div>)}
      </div>}
    </section>

    <section className="card">
      <div className="row"><h2>Заправки</h2><span className="badge">{refuels.length}</span></div>
      <p className="muted">Укажите количество топлива, залитого во время смены.</p>
      <label>⛽ Заправлено, л</label>
      <input inputMode="decimal" value={newRefuel} onChange={e => setNewRefuel(e.target.value)} placeholder="Например, 40" onKeyDown={e => e.key === 'Enter' && addRefuel()} />
      <button className="primary" onClick={addRefuel}>＋ Добавить заправку</button>
      {refuels.length > 0 && <div className="list">
        {refuels.map((item, index) => <div className="list-item" key={item.id}>
          <div><b>Заправка {index + 1}</b><span>{format(numberValue(item.liters))} л</span></div>
          <button className="delete" onClick={() => deleteRefuel(item.id)}>×</button>
        </div>)}
      </div>}
    </section>

    <section className="fuelbox">
      <span>⛽ Расчётный расход</span>
      <strong>{format(totalFuel)} л</strong>
      <em>{format(totalKm)} км общего пробега</em>
      {shift.odometer !== '' && <em>Одометр: {format(numberValue(shift.odometer))} км</em>}
    </section>

    <section className="card results">
      <h2>Результат</h2>
      <div className="item"><div><b>Город</b><span>{format(city)} км × {format(settings.city)} л/100 км</span></div><strong>{format(cityFuel)} л</strong></div>
      <div className="item"><div><b>Трасса</b><span>{format(highway)} км × {format(settings.highway)} л/100 км</span></div><strong>{format(highwayFuel)} л</strong></div>
      <div className="totals"><span>Всего пробег</span><strong>{format(totalKm)} км</strong></div>
      <div className="totals"><span>Расход по норме</span><strong>{format(totalFuel)} л</strong></div>
      <div className="totals"><span>Заправлено</span><strong>{format(totalRefuel)} л</strong></div>
      {shift.startFuel !== '' && <div className="totals"><span>Остаток после смены (расчётный)</span><strong>{format(estimatedEndFuel)} л</strong></div>}
    </section>

    <section className="card norms-card">
      <div className="row"><h2>Текущие нормы</h2><button className="small" onClick={onSettings}>Изменить</button></div>
      <div className="norm-row"><span>🏙️ Город</span><b>{format(settings.city)} л/100 км</b></div>
      <div className="norm-row"><span>🛣️ Трасса</span><b>{format(settings.highway)} л/100 км</b></div>
    </section>
  </main>;
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [screen, setScreen] = useState('calculator');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (saved && typeof saved === 'object') setSettings({ city: numberValue(saved.city), highway: numberValue(saved.highway) });
    } catch {}
  }, []);

  const saveSettings = next => {
    const safe = { city: numberValue(next.city), highway: numberValue(next.highway) };
    setSettings(safe);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
  };

  return screen === 'settings'
    ? <Settings settings={settings} onSave={saveSettings} onBack={() => setScreen('calculator')} />
    : <Calculator settings={settings} onSettings={() => setScreen('settings')} />;
}

createRoot(document.getElementById('root')).render(<App />);
