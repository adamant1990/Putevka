import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Calculator from './components/Calculator';
import History from './components/History';
import Settings from './components/Settings';
import { calculateEndOdometer, numberValue } from './utils/calculations';
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

const getVehicleSnapshot = (settings, vehicleId) => {
  const vehicle = settings.vehicles.find(item => item.id === vehicleId) || settings.vehicles[0];
  return vehicle ? {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    cityNorm: numberValue(vehicle.city),
    highwayNorm: numberValue(vehicle.highway)
  } : {};
};

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
    setHistory(prev => [shift, ...prev.filter(item => item.id !== shift.id)]);
  }, [shift, loaded]);

  useEffect(() => {
    if (!loaded) return;
    writeJson(HISTORY_KEY, history);
  }, [history, loaded]);

  const handleShiftChange = updater => {
    setShift(prev => normalizeShift(typeof updater === 'function' ? updater(prev) : updater));
  };

  const saveSettings = nextSettings => {
    setSettings(nextSettings);

    if (!shift.completed && !shift.trips.length && !shift.refuels.length && !shift.odometer && !shift.startFuel) {
      setShift(prev => ({
        ...prev,
        vehicleId: nextSettings.activeVehicleId
      }));
    }
  };

  const createNewShift = () => {
    const next = makeShift({
      ...getVehicleSnapshot(settings, settings.activeVehicleId),
      vehicleId: settings.activeVehicleId
    });
    setShift(next);
    setScreen('calculator');
  };

  const openHistoryShift = id => {
    const found = history.find(item => item.id === id);
    if (!found) return;
    setShift(normalizeShift(found));
    setScreen('calculator');
  };

  const deleteHistoryShift = id => {
    const target = history.find(item => item.id === id);
    if (!target || !target.completed) return;

    if (!window.confirm(`Удалить путёвку от ${target.date}?\n\nЭта запись будет удалена из истории без возможности восстановления.`)) return;

    setHistory(prev => prev.filter(item => item.id !== id));

    if (shift.id === id) {
      const activeShift = history.find(item => !item.completed && item.id !== id);
      if (activeShift) {
        setShift(normalizeShift(activeShift));
      }
    }
  };

  const finishShift = () => {
    if (shift.completed) return;

    const current = normalizeShift({
      ...shift,
      completed: true,
      ...getVehicleSnapshot(settings, shift.vehicleId)
    });
    const endOdometer = calculateEndOdometer(current);

    if (!window.confirm(
      `Завершить смену от ${current.date}?\n\n` +
      `Пробег за смену: ${numberValue(current.odometer) > 0 ? endOdometer - numberValue(current.odometer) : 0} км.\n` +
      'Смена будет сохранена в истории, а новая путёвка будет создана автоматически.'
    )) return;

    const next = makeShift({
      ...getVehicleSnapshot(settings, current.vehicleId),
      vehicleId: current.vehicleId,
      odometer: endOdometer > 0 ? endOdometer : '',
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
      onDelete={deleteHistoryShift}
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
