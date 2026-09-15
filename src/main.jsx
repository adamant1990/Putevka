import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SETTINGS_KEY = 'putevka_calculator_settings';
const SHIFT_KEY = 'putevka_shift_data';
const HISTORY_KEY = 'putevka_shift_history';
const DEFAULT_SETTINGS = { city: 18, highway: 14 };
const DEFAULT_SHIFT = { id: '', date: '', odometer: '', startFuel: '', trips: [], refuels: [] };

const today = () => new Date().toISOString().slice(0, 10);
const makeShift = () => ({ ...DEFAULT_SHIFT, id: String(Date.now()), date: today() });

const sumValues = value => String(value ?? '')
  .replace(/,/g, '.')
  .split(/\s+/)
  .map(item => Number(item.replace(/[^0-9.]/g, '')) || 0)
  .reduce((sum, item) => sum + item, 0);

const numberValue = value => sumValues(value);
const format = value => Number(value || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const formatDate = value => {
  if (!value) return 'Без даты';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
};

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

function History({ history, currentId, onOpen, onNew, onBack }) {
  return <main className="app">
    <header>
      <div><h1>Мои путёвки</h1><p>Сохранённые смены</p></div>
      <button className="icon" onClick={onBack}>×</button>
    </header>

    <section className="card">
      <button className="primary big" onClick={onNew}>＋ Новая смена</button>
      <p className="muted">Каждая смена хранится отдельно. Старую смену можно открыть и продолжить редактировать.</p>
    </section>

    <section className="card">
      <div className="row"><h2>Смены</h2><span className="badge">{history.length}</span></div>
      {history.length === 0 ? <p className="muted">Пока нет сохранённых смен.</p> : <div className="list">
        {history.map(shift => {
          const km = shift.trips.reduce((sum, trip) => sum + numberValue(trip.cityKm) + numberValue(trip.highwayKm), 0);
          return <button className={`history-item ${shift.id === currentId ? 'active' : ''}`} key={shift.id} onClick={() => onOpen(shift.id)}>
            <div><b>{formatDate(shift.date)}</b><span>{shift.trips.length} поездок · {format(km)} км · {shift.refuels.length} заправок</span></div>
            <strong>›</strong>
          </button>;
        })}
      </div>}
    </section>
  </main>;
}

function Calculator({ settings, shift, onChange, onSettings, onHistory }) {
  const [newCity, setNewCity] = useState('');
  const [newHighway, setNewHighway] = useState('');
  const [newRefuel, setNewRefuel] = useState('');

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
    onChange(prev => ({
      ...prev,
      trips: [...prev.trips, { id: String(Date.now()), cityKm: newCity, highwayKm: newHighway }]
    }));
    setNewCity('');
    setNewHighway('');
  };

  const deleteTrip = id => onChange(prev => ({ ...prev, trips: prev.trips.filter(trip => trip.id !== id) }));

  const addRefuel = () => {
    const liters = numberValue(newRefuel);
    if (liters <= 0) return;
    onChange(prev => ({
      ...prev,
      refuels: [...prev.refuels, { id: String(Date.now()), liters: newRefuel }]
    }));
    setNewRefuel('');
  };

  const deleteRefuel = id => onChange(prev => ({ ...prev, refuels: prev.refuels.filter(item => item.id !== id) }));

  const clear = () => {
    if (window.confirm('Очистить данные текущей смены, поездки и заправки?')) {
      onChange(prev => ({ ...prev, odometer: '', startFuel: '', trips: [], refuels: [] }));
    }
  };

  return <main className="app">
    <header>
      <div><h1>Путёвка</h1><p>Смена от {formatDate(shift.date)}</p></div>
      <div className="header-actions">
        <button className="icon" onClick={onHistory} title="Мои путёвки">📋</button>
        <button className="icon" onClick={onSettings} title="Настройки">⚙️</button>
      </div>
    </header>

    <section className="card">
      <div className="row"><h2>Данные смены</h2><button className="small" onClick={clear}>Очистить</button></div>
      <label>📅 Дата смены</label>
      <input type="date" value={shift.date} onChange={e => onChange(prev => ({ ...prev, date: e.target.value }))} />
      <label>🚗 Пробег по одометру, км</label>
      <input inputMode="decimal" value={shift.odometer} onChange={e => onChange(prev => ({ ...prev, odometer: e.target.value }))} placeholder="Например, 125430" autoFocus />
      <label>⛽ Остаток топлива на начало смены, л</label>
      <input inputMode="decimal" value={shift.startFuel} onChange={e => onChange(prev => ({ ...prev, startFuel: e.target.value }))} placeholder="Например, 85" />
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
  const [shift, setShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [screen, setScreen] = useState('calculator');

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (savedSettings && typeof savedSettings === 'object') setSettings({ city: numberValue(savedSettings.city), highway: numberValue(savedSettings.highway) });

      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const normalizedHistory = Array.isArray(savedHistory) ? savedHistory.map(item => ({
        ...DEFAULT_SHIFT,
        ...item,
        id: item.id || String(Date.now() + Math.random()),
        date: item.date || today(),
        trips: Array.isArray(item.trips) ? item.trips : [],
        refuels: Array.isArray(item.refuels) ? item.refuels : []
      })) : [];
      setHistory(normalizedHistory);

      const savedShift = JSON.parse(localStorage.getItem(SHIFT_KEY) || 'null');
      if (savedShift && typeof savedShift === 'object') {
        setShift({ ...DEFAULT_SHIFT, ...savedShift, id: savedShift.id || String(Date.now()), date: savedShift.date || today(), trips: Array.isArray(savedShift.trips) ? savedShift.trips : [], refuels: Array.isArray(savedShift.refuels) ? savedShift.refuels : [] });
      } else if (normalizedHistory.length > 0) {
        setShift(normalizedHistory[0]);
      } else {
        setShift(makeShift());
      }
    } catch {
      setShift(makeShift());
    }
  }, []);

  useEffect(() => {
    if (!shift) return;
    localStorage.setItem(SHIFT_KEY, JSON.stringify(shift));
    setHistory(prev => {
      const exists = prev.some(item => item.id === shift.id);
      const next = exists ? prev.map(item => item.id === shift.id ? shift : item) : [shift, ...prev];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, [shift]);

  const saveSettings = next => {
    const safe = { city: numberValue(next.city), highway: numberValue(next.highway) };
    setSettings(safe);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
  };

  const newShift = () => {
    const next = makeShift();
    setShift(next);
    setScreen('calculator');
  };

  const openShift = id => {
    const found = history.find(item => item.id === id);
    if (found) {
      setShift({ ...found, trips: [...found.trips], refuels: [...found.refuels] });
      setScreen('calculator');
    }
  };

  if (!shift) return <main className="app"><section className="card"><p>Загрузка путёвки…</p></section></main>;

  if (screen === 'settings') return <Settings settings={settings} onSave={saveSettings} onBack={() => setScreen('calculator')} />;
  if (screen === 'history') return <History history={history} currentId={shift.id} onOpen={openShift} onNew={newShift} onBack={() => setScreen('calculator')} />;

  return <Calculator shift={shift} settings={settings} onChange={setShift} onSettings={() => setScreen('settings')} onHistory={() => setScreen('history')} />;
}

createRoot(document.getElementById('root')).render(<App />);
