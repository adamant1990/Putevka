import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const cars = [
  { id: 1, name: 'Газель А123ВС', summer: { city: 15, highway: 12 }, winter: { city: 18, highway: 14 }, season: 'summer' },
  { id: 2, name: 'УАЗ В456КМ', summer: { city: 18, highway: 14.5 }, winter: { city: 21, highway: 17 }, season: 'summer' }
];

const num = v => Number(String(v).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
const sum = v => String(v).trim().split(/\s+/).filter(Boolean).reduce((a, x) => a + num(x), 0);
const fmt = n => Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

function NumericInput({ value, onChange, onEnter, placeholder = '', decimal = false, autoFocus = false }) {
  const apply = e => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); e.currentTarget.blur(); } };
  return <input autoFocus={autoFocus} inputMode={decimal ? 'decimal' : 'numeric'} pattern={decimal ? '[0-9,. ]*' : '[0-9 ]*'} type="text" enterKeyHint="done" placeholder={placeholder} value={value} onChange={onChange} onKeyDown={apply} />;
}

function App() {
  const [screen, setScreen] = useState('home');
  const [carId, setCarId] = useState(1);
  const [odometer, setOdometer] = useState('');
  const [startFuel, setStartFuel] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [trips, setTrips] = useState([]);
  const [refuels, setRefuels] = useState([]);
  const [city, setCity] = useState('');
  const [highway, setHighway] = useState('');
  const [refuel, setRefuel] = useState('');
  const [showTrip, setShowTrip] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  const car = cars.find(x => x.id === Number(carId)) || cars[0];
  const norm = car[car.season];
  const cityKm = sum(city), highwayKm = sum(highway);
  const draftFuel = cityKm * norm.city / 100 + highwayKm * norm.highway / 100;
  const usedFuel = trips.reduce((a, x) => a + x.fuel, 0);
  const addedFuel = refuels.reduce((a, x) => a + x, 0);
  const tripKm = trips.reduce((a, x) => a + x.city + x.highway, 0);
  const actualKm = Math.max(0, num(endOdometer) - num(odometer));
  const mileageDifference = actualKm - tripKm;
  const remaining = Math.max(0, num(startFuel) + addedFuel - usedFuel);

  const addTrip = () => {
    if (!cityKm && !highwayKm) return;
    setTrips([...trips, { city: cityKm, highway: highwayKm, fuel: draftFuel }]);
    setCity(''); setHighway(''); setShowTrip(false);
  };
  const addRefuel = () => {
    const litres = num(refuel);
    if (!litres) return;
    setRefuels([...refuels, litres]); setRefuel(''); setShowRefuel(false);
  };

  if (screen === 'home') return <main className="app">
    <header><div><h1>Путёвка</h1><p>Помощник водителя</p></div><button className="icon" onClick={() => setScreen('admin')}>⚙️</button></header>
    <section className="card profile"><span>👤</span><div><b>Водитель</b><span>Иванов Иван Иванович</span></div></section>
    <section className="card"><label>🚗 Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{cars.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></section>
    <button className="primary big" onClick={() => setScreen('waybill')}>＋ Новая путёвка</button>
  </main>;

  if (screen === 'admin') return <main className="app">
    <header><div><h1>Администратор</h1><p>Нормы расхода</p></div><button className="icon" onClick={() => setScreen('home')}>×</button></header>
    <section className="card"><label>🚗 Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{cars.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
      <h3>Лето, л/100 км</h3><div className="norm-row"><span>Город</span><NumericInput decimal defaultValue={car.summer.city}/><span>Трасса</span><NumericInput decimal defaultValue={car.summer.highway}/></div>
      <h3>Зима, л/100 км</h3><div className="norm-row"><span>Город</span><NumericInput decimal defaultValue={car.winter.city}/><span>Трасса</span><NumericInput decimal defaultValue={car.winter.highway}/></div>
      <button className="primary">Сохранить</button>
    </section>
  </main>;

  return <main className="app">
    <header><div><h1>Новая путёвка</h1><p>{car.name}</p></div><button className="icon" onClick={() => setScreen('home')}>×</button></header>
    <section className="card"><label>Одометр при выезде</label><NumericInput value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="125480" onEnter={() => setOdometer(odometer.trim())}/><label>Начальный остаток, л</label><NumericInput decimal value={startFuel} onChange={e => setStartFuel(e.target.value)} placeholder="25" onEnter={() => setStartFuel(startFuel.trim())}/></section>
    <section className="fuelbox"><span>⛽ Расчётный остаток</span><strong>{fmt(remaining)} л</strong></section>
    <section className="card"><div className="row"><h2>Поездки</h2><button className="small" onClick={() => setShowTrip(true)}>＋ Добавить</button></div>
      {!trips.length ? <p className="muted">Добавьте поездку.</p> : trips.map((t,i)=><div className="item" key={i}><div><b>Поездка {i+1}</b><span>Город {fmt(t.city)} км · Трасса {fmt(t.highway)} км</span></div><strong>−{fmt(t.fuel)} л</strong></div>)}
      {!!trips.length && <div className="totals">По поездкам: {fmt(tripKm)} км · Расход: {fmt(usedFuel)} л</div>}
    </section>
    <section className="card"><label>Конечный одометр при сдаче</label><NumericInput value={endOdometer} onChange={e => setEndOdometer(e.target.value)} placeholder="126250" onEnter={() => setEndOdometer(endOdometer.trim())}/>{endOdometer && <div className="preview">Фактический пробег: <b>{fmt(actualKm)} км</b><br/>По внесённым поездкам: <b>{fmt(tripKm)} км</b><br/>{mileageDifference === 0 ? <b>✓ Пробег совпадает</b> : <><span>Разница: </span><b>{mileageDifference > 0 ? '+' : ''}{fmt(mileageDifference)} км</b></>}</div>}</section>
    <button className="secondary" onClick={() => setShowRefuel(true)}>⛽ Заправка АИ-92</button>
    <button className="primary big" onClick={() => setShowFinish(true)}>✓ Сдать путёвку</button>

    {showTrip && <div className="modal"><div className="modal-card"><div className="row"><h2>Новая поездка</h2><button className="icon" onClick={() => setShowTrip(false)}>×</button></div>
      <label>Город, км</label><NumericInput autoFocus placeholder="25 31" value={city} onChange={e => setCity(e.target.value)} onEnter={addTrip}/>
      <label>Трасса, км</label><NumericInput placeholder="120 80" value={highway} onChange={e => setHighway(e.target.value)} onEnter={addTrip}/>
      <div className="preview">Всего: <b>{fmt(cityKm + highwayKm)} км</b><br/>Расход: <b>{fmt(draftFuel)} л</b></div>
      <button className="primary" onClick={addTrip}>Добавить поездку</button>
    </div></div>}

    {showRefuel && <div className="modal"><div className="modal-card"><div className="row"><h2>Заправка АИ-92</h2><button className="icon" onClick={() => setShowRefuel(false)}>×</button></div><p>Сейчас в расчёте: <b>{fmt(remaining)} л</b></p><label>Заправлено, л</label><NumericInput autoFocus decimal placeholder="20" value={refuel} onChange={e => setRefuel(e.target.value)} onEnter={addRefuel}/><div className="preview">После заправки: <b>{fmt(remaining + num(refuel))} л</b></div><button className="primary" onClick={addRefuel}>Сохранить заправку</button></div></div>}

    {showFinish && <div className="modal"><div className="modal-card"><div className="row"><h2>Сдача путёвки</h2><button className="icon" onClick={() => setShowFinish(false)}>×</button></div><div className="preview"><b>Итог:</b><br/>Пробег по одометру: <b>{fmt(actualKm)} км</b><br/>Внесённые поездки: <b>{fmt(tripKm)} км</b><br/>Расчётный остаток: <b>{fmt(remaining)} л</b><br/>{mileageDifference === 0 ? <b>✓ Всё сходится</b> : <b>⚠ Разница по пробегу: {mileageDifference > 0 ? '+' : ''}{fmt(mileageDifference)} км</b>}</div><button className="primary" onClick={() => { setShowFinish(false); alert('Путёвка сохранена'); }}>Сохранить путёвку</button></div></div>}
  </main>;
}

createRoot(document.getElementById('root')).render(React.createElement(App));
