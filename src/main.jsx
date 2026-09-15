import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Calculator from './components/Calculator';
import History from './components/History';
import Settings from './components/Settings';
import {
  DEFAULT_SETTINGS,
  makeShift,
  normalizeSettings,
  normalizeShift,
  readJson,
  writeJson,
  SETTINGS_KEY,
  SHIFT_KEY,
  HISTORY_KEY
} from './utils/storage';

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [shift, setShift] = useState(() => makeShift());
  const [history, setHistory] = useState([]);
  const [screen, setScreen] = useState('calculator');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedSettings = normalizeSettings(readJson(SETTINGS_KEY, null));
    const savedShift = readJson(SHIFT_KEY, null);
    const savedHistory = readJson(HISTORY_KEY, []);
    const normalizedShift = savedShift
      ? normalizeShift(savedShift)
      : makeShift({ vehicleId: savedSettings.activeVehicleId });
    const normalizedHistory = Array.isArray(savedHistory)
      ? savedHistory.map(normalizeShift)
      : [];

    setSettings(savedSettings);
    setShift(normalizedShift);
    setHistory(normalizedHistory);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeJson(SETTINGS_KEY, settings);
  }, [settings, loaded]);

  useEffect(() => {
    if (!loaded) return;
    writeJson(SHIFT_KEY, shift);
  }, [shift, loaded]);

  useEffect(() => {
    if (!loaded) return;
    writeJson(HISTORY_KEY, history);
  }, [history, loaded]);

  const syncCurrentToHistory = nextShift => {
    setHistory(prev => [nextShift, ...prev.filter(item => item.id !== nextShift.id)]);
  };

  const handleShiftChange = updater => {
    setShift(prev => {
      const next = normalizeShift(typeof updater === 'function' ? updater(prev) : updater);
      syncCurrentToHistory(next);
      return next;
    });
  };

  const saveSettings = nextSettings => {
    setSettings(nextSettings);

    if (!shift.trips.length && !shift.refuels.length && !shift.odometer && !shift.startFuel) {
      const nextShift = { ...shift, vehicleId: nextSettings.activeVehicleId };
      setShift(nextShift);
      syncCurrentToHistory(nextShift);
    }
  };

  const createNewShift = () => {
    const next = makeShift({ vehicleId: settings.activeVehicleId });
    setShift(next);
    syncCurrentToHistory(next);
    setScreen('calculator');
  };

  const openHistoryShift = id => {
    const found = history.find(item => item.id === id);
    if (!found) return;
    setShift(normalizeShift(found));
    setScreen('calculator');
  };

  const finishShift = () => {
    if (shift.completed) return;

    const current = normalizeShift({ ...shift, completed: true });
    if (!window.confirm(
      `Завершить смену от ${current.date}?\n\n` +
      'Смена будет сохранена в истории, а новая путёвка будет полностью очищена.'
    )) return;

    const startOdometer = Number(current.odometer) || 0;
    const totalKm = current.trips.reduce(
      (sum, trip) => sum + (Number(trip.cityKm) || 0) + (Number(trip.highwayKm) || 0),
      0
    );
    const next = makeShift({
      vehicleId: current.vehicleId,
      odometer: startOdometer > 0 ? startOdometer + totalKm : '',
      startFuel: '',
      trips: [],
      refuels: [],
      completed: false
    });

    setHistory(prev => [next, current, ...prev.filter(item => item.id !== current.id && item.id !== next.id)]);
    setShift(next);
    setScreen('calculator');
  };

  if (!loaded) {
    return <main className="app"><section className="card"><p className="muted">Загрузка данных…</p></section></main>;
  }

  if (screen === 'settings') {
    return <Settings
      settings={settings}
      history={history}
      onSave={saveSettings}
      onBack={() => setScreen('calculator')}
    />;
  }

  if (screen === 'history') {
    return <History
      history={history}
      currentId={shift.id}
      onOpen={openHistoryShift}
      onNew={createNewShift}
      onBack={() => setScreen('calculator')}
      settings={settings}
    />;
  }

  return <Calculator
    settings={settings}
    shift={shift}
    onChange={handleShiftChange}
    onSettings={() => setScreen('settings')}
    onHistory={() => setScreen('history')}
    onFinish={finishShift}
  />;
}

createRoot(document.getElementById('root')).render(<App />);
