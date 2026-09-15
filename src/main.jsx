import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SETTINGS_KEY = 'putevka_calculator_settings';
const SHIFT_KEY = 'putevka_shift_data';
const HISTORY_KEY = 'putevka_shift_history';

const DEFAULT_SETTINGS = {
  vehicles: [{ id: 'vehicle-1', name: 'Автомобиль 1', city: 18, highway: 14 }],
  activeVehicleId: 'vehicle-1'
};

const DEFAULT_SHIFT = {
  id: '',
  date: '',
  odometer: '',
  startFuel: '',
  trips: [],
  refuels: [],
  completed: false,
  vehicleId: 'vehicle-1'
};

const today = () => new Date().toISOString().slice(0, 10);
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const makeShift = (overrides = {}) => ({
  ...DEFAULT_SHIFT,
  id: makeId(),
  date: today(),
  ...overrides
});

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

const calculateEndOdometer = shift => {
  const trips = Array.isArray(shift.trips) ? shift.trips : [];
  const km = trips.reduce(
    (sum, trip) => sum + numberValue(trip.cityKm) + numberValue(trip.highwayKm),
    0
  );
  const start = numberValue(shift.odometer);
  return start > 0 ? start + km : 0;
};

const normalizeSettings = saved => {
  if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS;

  if (Array.isArray(saved.vehicles) && saved.vehicles.length > 0) {
    const vehicles = saved.vehicles.map((vehicle, index) => ({
      id: vehicle.id || `vehicle-${index + 1}`,
      name: String(vehicle.name || `Автомобиль ${index + 1}`),
      city: numberValue(vehicle.city),
      highway: numberValue(vehicle.highway)
    }));
    const activeVehicleId = vehicles.some(vehicle => vehicle.id === saved.activeVehicleId)
      ? saved.activeVehicleId
      : vehicles[0].id;
    return { vehicles, activeVehicleId };
  }

  // Миграция старых настроек: раньше нормы были общими для одного автомобиля.
  const vehicle = {
    id: 'vehicle-1',
    name: 'Автомобиль 1',
    city: numberValue(saved.city ?? 18) || 18,
    highway: numberValue(saved.highway ?? 14) || 14
  };
  return { vehicles: [vehicle], activeVehicleId: vehicle.id };
};

const normalizeShift = item => ({
  ...DEFAULT_SHIFT,
  ...(item || {}),
  id: item?.id || makeId(),
  date: item?.date || today(),
  trips: Array.isArray(item?.trips) ? item.trips : [],
  refuels: Array.isArray(item?.refuels) ? item.refuels : [],
  completed: Boolean(item?.completed),
  vehicleId: item?.vehicleId || 'vehicle-1'
});

function Settings({ settings, history, onSave, onBack }) {
  const [vehicles, setVehicles] = useState(settings.vehicles);
  const [activeVehicleId, setActiveVehicleId] = useState(settings.activeVehicleId);

  const addVehicle = () => {
    const number = vehicles.length + 1;
    const vehicle = {
      id: makeId(),
      name: `Автомобиль ${number}`,
      city: 18,
      highway: 14
    };
    setVehicles(prev => [...prev, vehicle]);
    setActiveVehicleId(vehicle.id);
  };

  const updateVehicle = (id, field, value) => {
    setVehicles(prev => prev.map(vehicle => (
      vehicle.id === id
        ? { ...vehicle, [field]: field === 'name' ? value : value }
        : vehicle
    )));
  };

  const removeVehicle = id => {
    if (vehicles.length <= 1) {
      window.alert('Должен остаться хотя бы один автомобиль.');
      return;
    }

    if (history.some(item => item.vehicleId === id)) {
      window.alert('Этот автомобиль уже используется в сохранённых путёвках. Сначала оставьте его в списке, чтобы история не потеряла привязку к автомобилю.');
      return;
    }

    if (!window.confirm('Удалить этот автомобиль?')) return;

    const next = vehicles.filter(vehicle => vehicle.id !== id);
    setVehicles(next);
    if (activeVehicleId === id) setActiveVehicleId(next[0].id);
  };

  const save = () => {
    const cleanedVehicles = vehicles.map((vehicle, index) => ({
      ...vehicle,
      name: String(vehicle.name || `Автомобиль ${index + 1}`).trim(),
      city: numberValue(vehicle.city),
      highway: numberValue(vehicle.highway)
    }));

    onSave({
      vehicles: cleanedVehicles,
      activeVehicleId: cleanedVehicles.some(vehicle => vehicle.id === activeVehicleId)
        ? activeVehicleId
        : cleanedVehicles[0].id
    });
    onBack();
  };

  return <main className="app">
    <header>
      <div><h1>Настройки</h1><p>Автомобили и нормы расхода</p></div>
      <button className="icon" onClick={onBack}>×</button>
    </header>

    <section className="card">
      <h2>Автомобили</h2>
      <p className="muted">Добавьте все автомобили, которыми пользуетесь. Для каждого автомобиля задаются свои нормы расхода.</p>

      {vehicles.map((vehicle, index) => <div className="card vehicle-card" key={vehicle.id}>
        <div className="row">
          <h2>{vehicle.name || `Автомобиль ${index + 1}`}</h2>
          {vehicles.length > 1 && <button className="delete" onClick={() => removeVehicle(vehicle.id)}>×</button>}
        </div>

        <label>🚗 Название автомобиля</label>
        <input
          value={vehicle.name}
          onChange={e => updateVehicle(vehicle.id, 'name', e.target.value)}
          placeholder="Например, Hyundai Solaris"
        />

        <label>🏙️ Город, л/100 км</label>
        <input
          inputMode="decimal"
          value={vehicle.city}
          onChange={e => updateVehicle(vehicle.id, 'city', e.target.value)}
          placeholder="18"
        />

        <label>🛣️ Трасса, л/100 км</label>
        <input
          inputMode="decimal"
          value={vehicle.highway}
          onChange={e => updateVehicle(vehicle.id, 'highway', e.target.value)}
          placeholder="14"
        />

        <label className="radio-row">
          <input
            type="radio"
            name="activeVehicle"
            checked={activeVehicleId === vehicle.id}
            onChange={() => setActiveVehicleId(vehicle.id)}
          />
          <span>Использовать для новых смен</span>
        </label>
      </div>)}

      <button className="primary" onClick={addVehicle}>＋ Добавить автомобиль</button>
      <button className="primary big" onClick={save}>Сохранить настройки</button>
    </section>
  </main>;
}

function History({ history, currentId, onOpen, onNew, onBack, settings }) {
  const vehicleName = id => settings.vehicles.find(vehicle => vehicle.id === id)?.name || 'Автомобиль';

  return <main className="app">
    <header>
      <div><h1>Мои путёвки</h1><p>Сохранённые смены</p></div>
      <button className="icon" onClick={onBack}>×</button>
    </header>

    <section className="card">
      <button className="primary big" onClick={onNew}>＋ Новая смена</button>
      <p className="muted">Завершённые смены сохраняются в истории. Каждая путёвка хранит свой автомобиль и его нормы расхода.</p>
    </section>

    <section className="card">
      <div className="row"><h2>Смены</h2><span className="badge">{history.length}</span></div>
      {history.length === 0 ? <p className="muted">Пока нет сохранённых смен.</p> : <div className="list">
        {history.map(shift => {
          const km = shift.trips.reduce((sum, trip) => sum + numberValue(trip.cityKm) + numberValue(trip.highwayKm), 0);
          const endOdometer = calculateEndOdometer(shift);
          return <button className={`history-item ${shift.id === currentId ? 'active' : ''}`} key={shift.id} onClick={() => onOpen(shift.id)}>
            <div>
              <b>{formatDate(shift.date)} {shift.completed ? '· Завершена' : '· Текущая'}</b>
              <span>{vehicleName(shift.vehicleId)} · {shift.trips.length} поездок · {format(km)} км{endOdometer > 0 ? ` · одометр ${format(endOdometer)} км` : ''} · {shift.refuels.length} заправок</span>
            </div>
            <strong>›</strong>
          </button>;
        })}
      </div>}
    </section>
  </main>;
}

function Calculator({ settings, shift, onChange, onSettings, onHistory, onFinish }) {
  const [newCity, setNewCity] = useState('');
  const [newHighway, setNewHighway] = useState('');
  const [newRefuel, setNewRefuel] = useState('');

  const vehicle = useMemo(
    () => settings.vehicles.find(item => item.id === shift.vehicleId) || settings.vehicles[0],
    [settings.vehicles, shift.vehicleId]
  );

  const cityNorm = numberValue(vehicle?.city);
  const highwayNorm = numberValue(vehicle?.highway);
  const trips = shift.trips;
  const refuels = shift.refuels;
  const city = trips.reduce((sum, trip) => sum + numberValue(trip.cityKm), 0);
  const highway = trips.reduce((sum, trip) => sum + numberValue(trip.highwayKm), 0);
  const totalKm = city + highway;
  const cityFuel = city * cityNorm / 100;
  const highwayFuel = highway * highwayNorm / 100;
  const totalFuel = cityFuel + highwayFuel;
  const totalRefuel = refuels.reduce((sum, item) => sum + numberValue(item.liters), 0);
  const startFuel = numberValue(shift.startFuel);
  const estimatedEndFuel = startFuel + totalRefuel - totalFuel;
  const remainingFuel = Math.max(0, estimatedEndFuel);
  const remainingCityKm = cityNorm > 0 ? remainingFuel * 100 / cityNorm : 0;
  const startOdometer = numberValue(shift.odometer);
  const endOdometer = calculateEndOdometer(shift);

  const addTrip = () => {
    if (numberValue(newCity) <= 0 && numberValue(newHighway) <= 0) return;
    onChange(prev => ({
      ...prev,
      trips: [...prev.trips, { id: makeId(), cityKm: newCity, highwayKm: newHighway }]
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
      refuels: [...prev.refuels, { id: makeId(), liters: newRefuel }]
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
      <div><h1>Путёвка</h1><p>Смена от {formatDate(shift.date)}{shift.completed ? ' · завершена' : ''}</p></div>
      <div className="header-actions">
        <button className="icon" onClick={onHistory} title="Мои путёвки">📋</button>
        <button className="icon" onClick={onSettings} title="Настройки">⚙️</button>
      </div>
    </header>

    <section className="card">
      <div className="row"><h2>Автомобиль</h2><span className="badge">{vehicle?.name || 'Не выбран'}</span></div>
      <p className="muted">Для этой путёвки используются нормы выбранного автомобиля.</p>
    </section>

    <section className="card">
      <div className="row"><h2>Данные смены</h2><button className="small" onClick={clear}>Очистить</button></div>
      <label>📅 Дата смены</label>
      <input type="date" value={shift.date} onChange={e => onChange(prev => ({ ...prev, date: e.target.value, completed: false }))} />
      <label>🚗 Пробег по одометру на начало смены, км</label>
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
      {shift.odometer !== '' && <em>Одометр на начало: {format(startOdometer)} км</em>}
      {shift.odometer !== '' && <em>Одометр на конец: {format(endOdometer)} км</em>}
    </section>

    <section className="card results">
      <h2>Результат</h2>
      <div className="item"><div><b>Город</b><span>{format(city)} км × {format(cityNorm)} л/100 км</span></div><strong>{format(cityFuel)} л</strong></div>
      <div className="item"><div><b>Трасса</b><span>{format(highway)} км × {format(highwayNorm)} л/100 км</span></div><strong>{format(highwayFuel)} л</strong></div>
      <div className="totals"><span>Всего пробег</span><strong>{format(totalKm)} км</strong></div>
      <div className="totals"><span>Расход по норме</span><strong>{format(totalFuel)} л</strong></div>
      <div className="totals"><span>Заправлено</span><strong>{format(totalRefuel)} л</strong></div>
      {shift.startFuel !== '' && <div className="totals"><span>Остаток после смены (расчётный)</span><strong>{format(estimatedEndFuel)} л</strong></div>}
      {shift.startFuel !== '' && <div className="totals"><span>На этом остатке можно проехать по городу</span><strong>{format(remainingCityKm)} км</strong></div>}
      {shift.odometer !== '' && <div className="totals"><span>Одометр на конец смены</span><strong>{format(endOdometer)} км</strong></div>}
    </section>

    {!shift.completed && <section className="card finish-card">
      <h2>Завершение смены</h2>
      <p className="muted">Текущая путёвка будет сохранена в истории, а новая смена создастся автоматически.</p>
      <button className="primary big" onClick={onFinish}>✓ Завершить смену</button>
    </section>}

    <section className="card norms-card">
      <div className="row"><h2>Нормы автомобиля</h2><button className="small" onClick={onSettings}>Изменить</button></div>
      <div className="norm-row"><span>🏙️ Город</span><b>{format(cityNorm)} л/100 км</b></div>
      <div className="norm-row"><span>🛣️ Трасса</span><b>{format(highwayNorm)} л/100 км</b></div>
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
      setSettings(normalizeSettings(savedSettings));

      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const normalizedHistory = Array.isArray(savedHistory)
        ? savedHistory.map(normalizeShift)
        : [];
      setHistory(normalizedHistory);

      const savedShift = JSON.parse(localStorage.getItem(SHIFT_KEY) || 'null');
      if (savedShift) {
        setShift(normalizeShift(savedShift));
      } else {
        const current = normalizedHistory.find(item => !item.completed);
        setShift(current || makeShift({ vehicleId: normalizeSettings(savedSettings).activeVehicleId }));
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setHistory([]);
      setShift(makeShift());
    }
  }, []);

  useEffect(() => {
    if (shift) localStorage.setItem(SHIFT_KEY, JSON.stringify(shift));
  }, [shift]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const saveSettings = nextSettings => {
    const normalized = normalizeSettings(nextSettings);
    setSettings(normalized);

    // Если текущая смена ещё не начата, новая смена получает выбранный автомобиль.
    setShift(prev => {
      if (!prev) return prev;
      const hasData = prev.odometer !== '' || prev.startFuel !== '' || prev.trips.length > 0 || prev.refuels.length > 0;
      return hasData ? prev : { ...prev, vehicleId: normalized.activeVehicleId };
    });
  };

  const createNewShift = () => {
    const next = makeShift({ vehicleId: settings.activeVehicleId });
    setShift(next);
    setScreen('calculator');
  };

  const openShift = id => {
    const found = history.find(item => item.id === id);
    if (!found) return;
    setShift(normalizeShift(found));
    setScreen('calculator');
  };

  const finishShift = () => {
    if (!shift || shift.completed) return;

    const confirmed = window.confirm(
      'Завершить смену?\n\nТекущая путёвка будет сохранена в историю, после чего форма полностью очистится и создастся новая смена.'
    );
    if (!confirmed) return;

    const endOdometer = calculateEndOdometer(shift);
    const completedShift = { ...normalizeShift(shift), completed: true };
    const nextShift = makeShift({
      odometer: endOdometer > 0 ? String(endOdometer) : '',
      startFuel: '',
      trips: [],
      refuels: [],
      completed: false,
      vehicleId: shift.vehicleId || settings.activeVehicleId
    });

    setHistory(prev => [completedShift, ...prev.filter(item => item.id !== completedShift.id)]);
    setShift(nextShift);
    setScreen('calculator');

    // Явно очищаем старую текущую путёвку из localStorage сразу.
    localStorage.setItem(SHIFT_KEY, JSON.stringify(nextShift));
  };

  if (!shift) return <main className="app"><section className="card"><p>Загрузка…</p></section></main>;

  if (screen === 'settings') {
    return <Settings settings={settings} history={history} onSave={saveSettings} onBack={() => setScreen('calculator')} />;
  }

  if (screen === 'history') {
    return <History
      history={history}
      currentId={shift.id}
      settings={settings}
      onOpen={openShift}
      onNew={createNewShift}
      onBack={() => setScreen('calculator')}
    />;
  }

  return <Calculator
    settings={settings}
    shift={shift}
    onChange={setShift}
    onSettings={() => setScreen('settings')}
    onHistory={() => setScreen('history')}
    onFinish={finishShift}
  />;
}

createRoot(document.getElementById('root')).render(<App />);
