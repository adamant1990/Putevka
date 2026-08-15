import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Car, ChevronDown, Fuel, Gauge, Plus, Save, Settings, User, X } from 'lucide-react';
import './styles.css';

const demoCars = [
  { id: 1, name: 'Газель А123ВС', mode: 'summer', summer: { city: 15, highway: 12 }, winter: { city: 18, highway: 14 } },
  { id: 2, name: 'УАЗ В456КМ', mode: 'summer', summer: { city: 18, highway: 14.5 }, winter: { city: 21, highway: 17 } }
];

function fmt(n) { return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 }); }

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
  const currentFuel = Math.max(0, Number(fuel || 0) + totalRefuel - totalTripFuel);

  function addTrip() {
    const c = Number(city || 0), h = Number(highway || 0);
    if (!c && !h) return;
    const fuelUsed = c * norms.city / 100 + h * norms.highway / 100;
    setTrips([...trips, { city: c, highway: h, total: c + h, fuel: fuelUsed }]);
    setCity(''); setHighway(''); setShowTrip(false);
  }

  function addRefuel() {
    const amount = Number(refuelAmount || 0);
    if (!amount) return;
    setRefuels([...refuels, { amount }]);
    setRefuelAmount(''); setShowRefuel(false);
  }

  function resetWaybill() {
    setOdometer(''); setFuel(''); setTrips([]); setRefuels([]); setScreen('home');
  }

  if (screen === 'home') return <main className="app"><header><div><h1>Путёвка</h1><p>Помощник водителя</p></div><button className="icon" onClick={() => setScreen('admin')}><Settings size={21}/></button></header><section className="card profile"><User size={20}/><div><b>Водитель</b><span>Иванов Иван Иванович</span></div></section><section className="card"><label><Car size={18}/> Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{demoCars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></section><button className="primary big" onClick={() => setScreen('waybill')}><Plus/> Новая путёвка</button><section className="card history"><h2>История</h2><p className="muted">Здесь появятся завершённые путёвки.</p></section></main>;

  if (screen === 'admin') return <main className="app"><header><div><h1>Администратор</h1><p>Настройки автомобиля</p></div><button className="icon" onClick={() => setScreen('home')}><X/></button></header><section className="card"><label><Car size={18}/> Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{demoCars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><div className="mode"><b>Текущий режим</b><div className="seg"><button className={car.mode==='summer'?'active':''}>☀️ Лето</button><button className={car.mode==='winter'?'active':''}>❄️ Зима</button></div></div><div className="norms"><h3>Летний расход, л/100 км</h3><div><span>Город</span><input defaultValue={car.summer.city}/><span>Трасса</span><input defaultValue={car.summer.highway}/></div><h3>Зимний расход, л/100 км</h3><div><span>Город</span><input defaultValue={car.winter.city}/><span>Трасса</span><input defaultValue={car.winter.highway}/></div></div><button className="primary"><Save/> Сохранить настройки</button></section></main>;

  return <main className="app"><header><div><h1>Новая путёвка</h1><p>{car.name}</p></div><button className="icon" onClick={resetWaybill}><X/></button></header><section className="card"><label><Gauge size={18}/> Показание одометра</label><input inputMode="numeric" placeholder="Например, 125480" value={odometer} onChange={e => setOdometer(e.target.value.replace(/\D/g,''))}/><label><Fuel size={18}/> Остаток топлива при выезде, л</label><input inputMode="decimal" placeholder="Например, 25" value={fuel} onChange={e => setFuel(e.target.value.replace(',','.'))}/></section><section className="fuelbox"><span>⛽ Расчётный остаток</span><strong>{fmt(currentFuel)} л</strong></section><section className="card"><div className="row"><h2>Поездки</h2><button className="small" onClick={() => setShowTrip(true)}><Plus size={17}/> Добавить</button></div>{trips.length===0?<p className="muted">Добавьте первую поездку.</p>:trips.map((t,i)=><div className="item" key={i}><div><b>Поездка {i+1}</b><span>Город {fmt(t.city)} км · Трасса {fmt(t.highway)} км</span></div><strong>−{fmt(t.fuel)} л</strong></div>)}{trips.length>0&&<div className="totals">Всего: {fmt(trips.reduce((s,t)=>s+t.total,0))} км · Расход: {fmt(totalTripFuel)} л</div>}</section><button className="secondary" onClick={() => setShowRefuel(true)}><Fuel/> Заправка</button><button className="primary big" onClick={() => { alert('Путёвка сохранена. В следующей версии подключим Supabase и списание 5 ₽.'); }}><Save/> Завершить путёвку</button>
      {showTrip && <div className="modal"><div className="modal-card"><div className="row"><h2>Новая поездка</h2><button className="icon" onClick={()=>setShowTrip(false)}><X/></button></div><label>Город, км</label><input autoFocus inputMode="decimal" value={city} onChange={e=>setCity(e.target.value.replace(',','.'))}/><label>Трасса, км</label><input inputMode="decimal" value={highway} onChange={e=>setHighway(e.target.value.replace(',','.'))}/><div className="preview">Расход за поездку: <b>{fmt(Number(city||0)*norms.city/100+Number(highway||0)*norms.highway/100)} л</b><br/>Остаток после поездки: <b>{fmt(currentFuel-(Number(city||0)*norms.city/100+Number(highway||0)*norms.highway/100))} л</b></div><button className="primary" onClick={addTrip}>Добавить поездку</button></div></div>}
      {showRefuel && <div className="modal"><div className="modal-card"><div className="row"><h2>Заправка АИ-92</h2><button className="icon" onClick={()=>setShowRefuel(false)}><X/></button></div><p>До заправки: <b>{fmt(currentFuel)} л</b></p><label>Заправлено, л</label><input autoFocus inputMode="decimal" value={refuelAmount} onChange={e=>setRefuelAmount(e.target.value.replace(',','.'))}/><div className="preview">После заправки: <b>{fmt(currentFuel+Number(refuelAmount||0))} л</b></div><button className="primary" onClick={addRefuel}>Сохранить заправку</button></div></div>}
    </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
