import React, { useMemo, useState } from 'react';
import { calculateTotals, numberValue } from '../utils/calculations';
import { format, formatDate } from '../utils/formatting';
import { makeId } from '../utils/storage';

export default function Calculator({ settings, shift, onChange, onSettings, onHistory, onFinish }) {
  const [newCity, setNewCity] = useState('');
  const [newHighway, setNewHighway] = useState('');
  const [newRefuel, setNewRefuel] = useState('');

  const vehicle = useMemo(
    () => settings.vehicles.find(item => item.id === shift.vehicleId) || settings.vehicles[0],
    [settings.vehicles, shift.vehicleId]
  );
  const totals = calculateTotals(shift, vehicle);
  const { cityNorm, highwayNorm, city, highway, totalKm, cityFuel, highwayFuel, totalFuel, totalRefuel,
    startFuel, estimatedEndFuel, remainingFuel, remainingCityKm, startOdometer, endOdometer } = totals;
  const trips = shift.trips;
  const refuels = shift.refuels;

  const addTrip = () => {
    if (numberValue(newCity) <= 0 && numberValue(newHighway) <= 0) return;
    onChange(prev => ({
      ...prev,
      trips: [...prev.trips, { id: makeId(), cityKm: newCity, highwayKm: newHighway }]
    }));
    setNewCity('');
    setNewHighway('');
  };

  const deleteTrip = id => onChange(prev => ({
    ...prev,
    trips: prev.trips.filter(trip => trip.id !== id)
  }));

  const addRefuel = () => {
    const liters = numberValue(newRefuel);
    if (liters <= 0) return;
    onChange(prev => ({
      ...prev,
      refuels: [...prev.refuels, { id: makeId(), liters: newRefuel }]
    }));
    setNewRefuel('');
  };

  const deleteRefuel = id => onChange(prev => ({
    ...prev,
    refuels: prev.refuels.filter(item => item.id !== id)
  }));

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
      <input inputMode="decimal" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Например, 25" />
      <label>🛣️ Трасса, км</label>
      <input inputMode="decimal" value={newHighway} onChange={e => setNewHighway(e.target.value)} placeholder="Например, 40" />
      <button className="primary" onClick={addTrip}>＋ Добавить поездку</button>

      {trips.length > 0 && <div className="list">
        {trips.map((trip, index) => <div className="list-item" key={trip.id || index}>
          <div><b>Поездка {index + 1}</b><span>Город: {format(numberValue(trip.cityKm))} км · Трасса: {format(numberValue(trip.highwayKm))} км · Всего: {format(numberValue(trip.cityKm) + numberValue(trip.highwayKm))} км</span></div>
          <button className="delete" onClick={() => deleteTrip(trip.id)}>×</button>
        </div>)}
      </div>}
    </section>

    <section className="card">
      <div className="row"><h2>Заправки</h2><span className="badge">{refuels.length}</span></div>
      <label>⛽ Литры</label>
      <input inputMode="decimal" value={newRefuel} onChange={e => setNewRefuel(e.target.value)} placeholder="Например, 40" />
      <button className="primary" onClick={addRefuel}>＋ Добавить заправку</button>

      {refuels.length > 0 && <div className="list">
        {refuels.map((item, index) => <div className="list-item" key={item.id || index}>
          <div><b>Заправка {index + 1}</b><span>{format(numberValue(item.liters))} л</span></div>
          <button className="delete" onClick={() => deleteRefuel(item.id)}>×</button>
        </div>)}
      </div>}
    </section>

    <section className="card result-card">
      <h2>Расчёт</h2>
      <div className="result-row"><span>Город</span><b>{format(city)} км → {format(cityFuel)} л</b></div>
      <div className="result-row"><span>Трасса</span><b>{format(highway)} км → {format(highwayFuel)} л</b></div>
      <div className="result-row"><span>Всего пробег</span><b>{format(totalKm)} км</b></div>
      <div className="result-row"><span>Расход</span><b>{format(totalFuel)} л</b></div>
      <div className="result-row"><span>Заправлено</span><b>{format(totalRefuel)} л</b></div>
      <div className="result-row"><span>Расчётный остаток</span><b>{format(remainingFuel)} л</b></div>
      <div className="result-row"><span>Можно проехать по городу</span><b>≈ {format(remainingCityKm)} км</b></div>
      <div className="result-row"><span>Одометр</span><b>{startOdometer > 0 ? `${format(startOdometer)} → ${format(endOdometer)} км` : '—'}</b></div>
      <p className="muted">Нормы: город {format(cityNorm)} л/100 км · трасса {format(highwayNorm)} л/100 км.</p>
      {estimatedEndFuel < 0 && <p className="warning">⚠️ По расчёту топлива недостаточно: дефицит {format(Math.abs(estimatedEndFuel))} л.</p>}
    </section>

    {!shift.completed && <button className="primary big finish" onClick={onFinish}>🏁 Завершить смену</button>}
  </main>;
}
