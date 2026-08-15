import React, { useState } from 'react';
import { Car, Fuel, Gauge, Plus, Save, Settings, User, X } from 'lucide-react';
import './styles.css';

const demoCars = [
  { id: 1, name: 'Газель А123ВС', mode: 'summer', summer: { city: 15, highway: 12 }, winter: { city: 18, highway: 14 } },
  { id: 2, name: 'УАЗ В456КМ', mode: 'summer', summer: { city: 18, highway: 14.5 }, winter: { city: 21, highway: 17 } }
];

function fmt(n) { return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 }); }
function cleanKm(value) { return String(value).replace(/\s/g, '').replace(/\D/g, ''); }
function formatKm(value) { const clean = cleanKm(value); return clean ? Number(clean).toLocaleString('ru-RU') : ''; }
function parseList(value) { return String(value).trim().split(/\s+/).filter(Boolean).map(v => Number(v.replace(',', '.'))).filter(v => Number.isFinite(v)); }
function cleanNumber(value) { return String(value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, ''); }

function App() {
  const [screen, setScreen] = useState('home');
  const [carId, setCarId] = useState(1);
  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('');
  const [trips, setTrips] = useState([]);
  const [refuels, setRefuels] = useState([]);
  const [city, setCity] = useState('');
  const [highway, setHighway] = useState('');
  const [showTrip, setShowTrip] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [refuelAmount, setRefuelAmount] = useState('');

  const car = demoCars.find(c => c.id === Number(carId));
  const norms = car[car.mode];
  const totalTripFuel = trips.reduce((s, t) => s + t.fuel, 0);
  const totalRefuel = refuels.reduce((s, r) => s + r.amount, 0);
  const currentFuel = Math.max(0, Number(cleanNumber(fuel) || 0) + totalRefuel - totalTripFuel);
  const cityValues = parseList(city);
  const highwayValues = parseList(highway);
  const cityTotal = cityValues.reduce((s, n) => s + n, 0);
  const highwayTotal = highwayValues.reduce((s, n) => s + n, 0);
  const draftFuel = cityTotal * norms.city / 100 + highwayTotal * norms.highway / 100;

  function addTrip() {
    if (!cityValues.length && !highwayValues.length) return;
    setTrips([...trips, { city: cityTotal, highway: highwayTotal, total: cityTotal + highwayTotal, fuel: draftFuel }]);
    setCity(''); setHighway(''); setShowTrip(false);
  }

  function addRefuel() {
    const amount = Number(cleanNumber(refuelAmount) || 0);
    if (!amount) return;
    setRefuels([...refuels, { amount }]);
    setRefuelAmount(''); setShowRefuel(false);
  }

  function resetWaybill() { setOdometer(''); setFuel(''); setTrips([]); setRefuels([]); setScreen('home'); }

  if (screen === 'home') return <main className="app"><header><div><h1>Путёвка</h1><p>Помощник водителя</p></div><button className="icon" onClick={() => setScreen('admin')}><Settings size={21}/></button></header><section className="card profile"><User size={20}/><div><b>Водитель</b><span>Иванов Иван Иванович</span></div></section><section className="card"><label><Car size={18}/> Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{demoCars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></section><button className="primary big" onClick={() => setScreen('waybill')}><Plus/> Новая путёвка</button><section className="card history"><h2>История</h2><p className="muted">Здесь появятся завершённые путёвки.</p></section></main>;

  if (screen === 'admin') return <main className="app"><header><div><h1>Администратор</h1><p>Настройки автомобиля</p></div><button className="icon" onClick={() => setScreen('home')}><X/></button></header><section className="card"><label><Car size={18}/> Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{demoCars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><div className="mode"><b>Текущий режим</b><div className="seg"><button className={car.mode==='summer'?'active':''}>☀️ Лето</button><button className={car.mode==='winter'?'active':''}>❄️ Зима</button></div></div><div className="norms"><h3>Летний расход, л/100 км</h3><div><span>Город</span><input defaultValue={car.summer.city}/><span>Трасса</span><input defaultValue={car.summer.highway}/></div><h3>Зимний расход, л/100 км</h3><div><span>Город</span><input defaultValue={car.winter.city}/><span>Трасса</span><input defaultValue={car.winter.highway}/></div></div><button className="primary"><Save/> Сохранить настройки</button></section></main>;

  return <main className="app"><header><div><h1>Новая путёвка</h1><p>{car.name}</p></div><button className="icon" onClick={resetWaybill}><X/></button></header><section className="card"><label><Gauge size={18}/> Показание одометра</label><input inputMode="numeric" placeholder="Например, 125 480" value={formatKm(odometer)} onChange={e => setOdometer(cleanKm(e.target.value))}/><label><Fuel size={18}/> Остаток топлива при выезде, л</label><input inputMode="decimal" placeholder="Например, 25" value={fuel} onChange={e => setFuel(cleanNumber(e.target.value))}/></section><section className="fuelbox"><span>⛽ Расчётный остаток</span><strong>{fmt(currentFuel)} л</strong></section><section className="card"><div className="row"><h2>Поездки</h2><button className="small" onClick={() => setShowTrip(true)}><Plus size={17}/> Добавить</button></div>{trips.length===0?<p className="muted">Добавьте первую поездку.</p>:trips.map((t,i)=><div className="item" key={i}><div><b>Поездка {i+1}</b><span>Город {fmt(t.city)} км · Трасса {fmt(t.highway)} км</span></div><strong>−{fmt(t.fuel)} л</strong></div>)}{trips.length>0&&<div className="totals">Всего: {fmt(trips.reduce((s,t)=>s+t.total,0))} км · Расход: {fmt(totalTripFuel)} л</div>}</section><button className="secondary" onClick={() => setShowRefuel(true)}><Fuel/> Заправка</button><button className="primary big" onClick={() => { alert('Путёвка сохранена. В следующей версии подключим Supabase и списание 5 ₽.'); }}><Save/> Завершить путёвку</button>
      {showTrip && <div className="modal"><div className="modal-card"><div className="row"><h2>Новая поездка</h2><button className="icon" onClick={()=>setShowTrip(false)}><X/></button></div><label>Город, км</label><input autoFocus inputMode="decimal" placeholder="Например: 25 31" value={city} onChange={e=>setCity(e.target.value)}/><label>Трасса, км</label><input inputMode="decimal" placeholder="Например: 120 80" value={highway} onChange={e=>setHighway(e.target.value)}/><div className="preview">Город: <b>{fmt(cityTotal)} км</b><br/>Трасса: <b>{fmt(highwayTotal)} км</b><br/>Расход за поездку: <b>{fmt(draftFuel)} л</b><br/>Остаток после поездки: <b>{fmt(currentFuel-draftFuel)} л</b></div><button className="primary" onClick={addTrip}>Добавить поездку</button></div></div>}
      {showRefuel && <div className="modal"><div className="modal-card"><div className="row"><h2>Заправка АИ-92</h2><button className="icon" onClick={()=>setShowRefuel(false)}><X/></button></div><p>До заправки: <b>{fmt(currentFuel)} л</b></p><label>Заправлено, л</label><input autoFocus inputMode="decimal" value={refuelAmount} onChange={e=>setRefuelAmount(cleanNumber(e.target.value))}/><div className="preview">После заправки: <b>{fmt(currentFuel+Number(cleanNumber(refuelAmount)||0))} л</b></div><button className="primary" onClick={addRefuel}>Сохранить заправку</button></div></div>}
    </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
