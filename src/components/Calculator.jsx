import React, { useMemo, useState } from 'react';
import { calculateTotals, isValidNumberList, numberValue } from '../utils/calculations';
import { format, formatDate } from '../utils/formatting';
import { makeId } from '../utils/storage';

export default function Calculator({ settings, shift, onChange, onSettings, onHistory, onFinish }) {
  const [newCity, setNewCity] = useState('');
  const [newHighway, setNewHighway] = useState('');
  const [newRefuel, setNewRefuel] = useState('');

  const liveVehicle = useMemo(
    () => settings.vehicles.find(item => item.id === shift.vehicleId) || settings.vehicles[0],
    [settings.vehicles, shift.vehicleId]
  );

  const vehicle = shift.completed && shift.vehicleName
    ? { name: shift.vehicleName, city: shift.cityNorm, highway: shift.highwayNorm }
    : liveVehicle;

  const totals = calculateTotals(shift, vehicle);
  const { cityNorm, highwayNorm, city, highway, totalKm, cityFuel, highwayFuel, totalFuel, totalRefuel,
    startFuel, estimatedEndFuel, remainingFuel, remainingCityKm, startOdometer, endOdometer } = totals;
  const trips = shift.trips;
  const refuels = shift.refuels;
  const locked = shift.completed;
  const invalidOdometer = !isValidNumberList(shift.odometer);
  const invalidStartFuel = !isValidNumberList(shift.startFuel);
  const invalidCity = !isValidNumberList(newCity);
  const invalidHighway = !isValidNumberList(newHighway);
  const invalidRefuel = !isValidNumberList(newRefuel);

  const addTrip = () => {
    if (locked || invalidCity || invalidHighway) return;
    if (numberValue(newCity) <= 0 && numberValue(newHighway) <= 0) return;
    onChange(prev => ({
      ...prev,
      trips: [...prev.trips, { id: makeId(), cityKm: newCity, highwayKm: newHighway }]
    }));
    setNewCity('');
    setNewHighway('');
  };

  const deleteTrip = id => {
    if (locked) return;
    onChange(prev => ({ ...prev, trips: prev.trips.filter(trip => trip.id !== id) }));
  };

  const addRefuel = () => {
    const liters = numberValue(newRefuel);
    if (locked || invalidRefuel || liters <= 0) return;
    onChange(prev => ({
      ...prev,
      refuels: [...prev.refuels, { id: makeId(), liters: newRefuel }]
    }));
    setNewRefuel('');
  };

  const deleteRefuel = id => {
    if (locked) return;
    onChange(prev => ({ ...prev, refuels: prev.refuels.filter(item => item.id !== id) }));
  };

  const clear = () => {
    if (locked) return;
    if (window.confirm('Очистить данные текущей смены, поездки и заправки?')) {
      onChange(prev => ({ ...prev, odometer: '', startFuel: '', trips: [], refuels: [] }));
    }
  };

  return <main className="app">
    <header>
      <div>
        <h1>Путёвка</h1>
        <p>Смена от {formatDate(shift.date)}{locked ? ' · завершена' : ' · текущая'}</p>
      </div>
      <div className="header-actions">
        <button className="icon" onClick={onHistory} title="Мои путёвки">📋</button>
        <button className="icon" onClick={onSettings} title="Настройки">⚙️</button>
      </div>
    </header>

    {locked && <section className="card"><p className="muted">🔒 Завершённая смена открыта только для просмотра. Это защищает историю от случайного изменения.</p></section>}

    <section className="card">
      <div className="row"><h2>Автомобиль</h2><span className="badge">{vehicle?.name || 'Не выбран'}</span></div>
      <p className="muted">Нормы: город {format(cityNorm)} л/100 км · трасса {format(highwayNorm)} л/100 км.</p>
    </section>

    <section className="card">
      <div className="row"><h2>Данные смены</h2>{!locked && <button className="small" onClick={clear}>Очистить</button>}</div>
      <label>📅 Дата смены</label>
      <input type="date" value={shift.date} disabled={locked} onChange={e => onChange(prev => ({ ...prev, date: e.target.value }))} />
      <label>🚗 Пробег по одометру на начало смены, км</label>
      <input inputMode="decimal" value={shift.odometer} disabled={locked} onChange={e => onChange(prev => ({ ...prev, odometer: e.target.value }))} placeholder="Например, 125430" autoFocus={!locked} />
      {invalidOdometer && <p className="warning">⚠️ В одометре допускаются только числа, например 125430 или 125430 125450.</p>}
      <label>⛽ Остаток топлива на начало смены, л</label>
      <input inputMode="decimal" value={shift.startFuel} disabled={locked} onChange={e => onChange(prev => ({ ...prev, startFuel: e.target.value }))} placeholder="Например, 85" />
      {invalidStartFuel && <p className="warning">⚠️ Укажите число литров, например 85 или 42,5.</p>}
    </section>

    <section className="card">
      <div className="row"><h2>Поездки</h2><span className="badge">{trips.length}</span></div>
      {!locked && <>
        <p className="muted">Добавляйте каждую поездку отдельно. Пробег автоматически суммируется.</p>
        <label>🏙️ Город, км</label>
        <input inputMode="decimal" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Например, 25" />
        <label>🛣️ Трасса, км</label>
        <input inputMode="decimal" value={newHighway} onChange={e => setNewHighway(e.target.value)} placeholder="Например, 40" />
        {(invalidCity || invalidHighway) && <p className="warning">⚠️ В пробеге допускаются только числа.</p>}
        <button className="primary" onClick={addTrip}>＋ Добавить поездку</button>
      </>}

      {trips.length > 0 && <div className="list">
        {trips.map((trip, index) => <div className="list-item" key={trip.id || index}>
          <div><b>Поездка {index + 1}</b><span>Город: {format(numberValue(trip.cityKm))} км · Трасса: {format(numberValue(trip.highwayKm))} км · Всего: {format(numberValue(trip.cityKm) + numberValue(trip.highwayKm))} км</span></div>
          {!locked && <button className="delete" onClick={() => deleteTrip(trip.id)}>×</button>}
        </div>)}
      </div>}
    </section>

    <section className="card">
      <div className="row"><h2>Заправки</h2><span className="badge">{refuels.length}</span></div>
      {!locked && <>
        <label>⛽ Литры</label>
        <input inputMode="decimal" value={newRefuel} onChange={e => setNewRefuel(e.target.value)} placeholder="Например, 40" />
        {invalidRefuel && <p className="warning">⚠️ Укажите количество топлива числом.</p>}
        <button className="primary" onClick={addRefuel}>＋ Добавить заправку</button>
      </>}

      {refuels.length > 0 && <div className="list">
        {refuels.map((item, index) => <div className="list-item" key={item.id || index}>
          <div><b>Заправка {index + 1}</b><span>{format(numberValue(item.liters))} л</span></div>
          {!locked && <button className="delete" onClick={() => deleteRefuel(item.id)}>×</button>}
        </div>)}
      </div>}
    </section>

    <section className="card result-card">
      <h2>Итог смены</h2>
      <div className="result-row"><span>Город</span><b>{format(city)} км → {format(cityFuel)} л</b></div>
      <div className="result-row"><span>Трасса</span><b>{format(highway)} км → {format(highwayFuel)} л</b></div>
      <div className="result-row"><span>Всего пробег</span><b>{format(totalKm)} км</b></div>
      <div className="result-row"><span>Расход</span><b>{format(totalFuel)} л</b></div>
      <div className="result-row"><span>Заправлено</span><b>{format(totalRefuel)} л</b></div>
      <div className="result-row"><span>Расчётный остаток</span><b>{format(remainingFuel)} л</b></div>
      <div className="result-row"><span>Можно проехать по городу</span><b>≈ {format(remainingCityKm)} км</b></div>
      <div className="result-row"><span>Одометр</span><b>{startOdometer > 0 ? `${format(startOdometer)} → ${format(endOdometer)} км` : '—'}</b></div>
      {estimatedEndFuel < 0 && <p className="warning">⚠️ По расчёту топлива недостаточно: дефицит {format(Math.abs(estimatedEndFuel))} л.</p>}
      {locked && <p className="muted">Смена завершена. Нормы автомобиля сохранены именно такими, какими они были при завершении.</p>}
    </section>

    {!locked && <button className="primary big finish" onClick={onFinish}>🏁 Завершить смену</button>}
  </main>;
}
