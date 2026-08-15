import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { supabase } from './supabase';

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

function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = async () => {
    setError(''); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message === 'Invalid login credentials' ? 'Неверный логин или пароль' : error.message);
    onLogin(data.user);
  };
  return <main className="app auth-page"><section className="card auth-card"><h1>Путёвка</h1><p>Вход в приложение</p><label>Email</label><input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Введите email"/><label>Пароль</label><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Введите пароль"/>{error && <div className="error">{error}</div>}<button className="primary big" disabled={loading || !email || !password} onClick={login}>{loading ? 'Вход...' : 'Войти'}</button></section></main>;
}

function App({ user, profile, onLogout }) {
  const [screen, setScreen] = useState('home');
  const [carId, setCarId] = useState(1);
  const [odometer, setOdometer] = useState('');
  const [startFuel, setStartFuel] = useState('');
  const [odometerLocked, setOdometerLocked] = useState(false);
  const [startFuelLocked, setStartFuelLocked] = useState(false);
  const [trips, setTrips] = useState([]); const [refuels, setRefuels] = useState([]);
  const [city, setCity] = useState(''); const [highway, setHighway] = useState(''); const [refuel, setRefuel] = useState('');
  const [showTrip, setShowTrip] = useState(false); const [showRefuel, setShowRefuel] = useState(false); const [showFinish, setShowFinish] = useState(false);
  const car = cars.find(x => x.id === Number(carId)) || cars[0]; const norm = car[car.season];
  const cityKm = sum(city), highwayKm = sum(highway); const draftFuel = cityKm * norm.city / 100 + highwayKm * norm.highway / 100;
  const usedFuel = trips.reduce((a, x) => a + x.fuel, 0); const addedFuel = refuels.reduce((a, x) => a + x, 0); const tripKm = trips.reduce((a, x) => a + x.city + x.highway, 0);
  const currentOdometer = num(odometer) + tripKm; const remaining = Math.max(0, num(startFuel) + addedFuel - usedFuel); const lowFuel = remaining <= 10;
  const addTrip = () => { if (!cityKm && !highwayKm) return; setTrips([...trips, { city: cityKm, highway: highwayKm, fuel: draftFuel }]); setCity(''); setHighway(''); setShowTrip(false); };
  const addRefuel = () => { const litres = num(refuel); if (!litres) return; setRefuels([...refuels, litres]); setRefuel(''); setShowRefuel(false); };

  if (screen === 'admin' && profile?.role !== 'admin') setScreen('home');
  if (screen === 'home') return <main className="app"><header><div><h1>Путёвка</h1><p>{profile?.full_name || user.email}</p></div><div className="header-actions">{profile?.role === 'admin' && <button className="icon" onClick={() => setScreen('admin')}>⚙️</button>}<button className="icon" onClick={onLogout}>↪</button></div></header><section className="card profile"><span>👤</span><div><b>{profile?.role === 'admin' ? 'Администратор' : 'Водитель'}</b><span>{profile?.full_name || user.email}</span></div></section><section className="card"><label>🚗 Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{cars.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></section><button className="primary big" onClick={() => setScreen('waybill')}>＋ Новая путёвка</button></main>;
  if (screen === 'admin') return <main className="app"><header><div><h1>Администратор</h1><p>Нормы расхода</p></div><button className="icon" onClick={() => setScreen('home')}>×</button></header><section className="card"><label>🚗 Автомобиль</label><select value={carId} onChange={e => setCarId(e.target.value)}>{cars.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select><h3>Лето, л/100 км</h3><div className="norm-row"><span>Город</span><NumericInput decimal defaultValue={car.summer.city}/><span>Трасса</span><NumericInput decimal defaultValue={car.summer.highway}/></div><h3>Зима, л/100 км</h3><div className="norm-row"><span>Город</span><NumericInput decimal defaultValue={car.winter.city}/><span>Трасса</span><NumericInput decimal defaultValue={car.winter.highway}/></div><button className="primary">Сохранить</button></section></main>;
  return <main className="app"><header><div><h1>Новая путёвка</h1><p>{car.name}</p></div><button className="icon" onClick={() => setScreen('home')}>×</button></header><section className="card"><label>Одометр при выезде</label><div className="locked-field"><NumericInput value={odometer} onChange={e => !odometerLocked && setOdometer(e.target.value)} placeholder="125480" onEnter={() => setOdometer(odometer.trim())}/><button className="small" onClick={() => setOdometerLocked(!odometerLocked)}>{odometerLocked ? 'Изменить' : 'Зафиксировать'}</button></div><label>Начальный остаток, л</label><div className="locked-field"><NumericInput decimal value={startFuel} onChange={e => !startFuelLocked && setStartFuel(e.target.value)} placeholder="25" onEnter={() => setStartFuel(startFuel.trim())}/><button className="small" onClick={() => setStartFuelLocked(!startFuelLocked)}>{startFuelLocked ? 'Изменить' : 'Зафиксировать'}</button></div></section><section className={`fuelbox ${lowFuel ? 'fuelbox-low' : ''}`}><span>{lowFuel && <span className="warning">⚠️</span>} ⛽ Расчётный остаток</span><strong>{fmt(remaining)} л</strong></section><section className="card"><div className="row"><h2>Поездки</h2><button className="small" onClick={() => setShowTrip(true)}>＋ Добавить</button></div>{!trips.length ? <p className="muted">Добавьте поездку.</p> : trips.map((t,i)=><div className="item" key={i}><div><b>Поездка {i+1}</b><span>Город {fmt(t.city)} км · Трасса {fmt(t.highway)} км</span></div><strong>−{fmt(t.fuel)} л</strong></div>)}{!!trips.length && <div className="totals">По поездкам: {fmt(tripKm)} км · Расход: {fmt(usedFuel)} л</div>}</section><section className="card"><div className="row"><h2>Заправки</h2><button className="small" onClick={() => setShowRefuel(true)}>＋ Заправка</button></div>{!refuels.length ? <p className="muted">Заправок не было.</p> : refuels.map((litres,i)=><div className="item" key={i}><div><b>⛽ Заправка АИ-92</b><span>Заправлено топлива</span></div><strong>+{fmt(litres)} л</strong></div>)}{!!refuels.length && <div className="totals">Всего заправлено: {fmt(addedFuel)} л</div>}</section><button className="primary big" onClick={() => setShowFinish(true)}>✓ Сдать путёвку</button>{showTrip && <div className="modal"><div className="modal-card"><div className="row"><h2>Новая поездка</h2><button className="icon" onClick={() => setShowTrip(false)}>×</button></div><label>Город, км</label><NumericInput autoFocus placeholder="25 31" value={city} onChange={e => setCity(e.target.value)} onEnter={addTrip}/><label>Трасса, км</label><NumericInput placeholder="120 80" value={highway} onChange={e => setHighway(e.target.value)} onEnter={addTrip}/><div className="preview">Всего: <b>{fmt(cityKm + highwayKm)} км</b><br/>Расход: <b>{fmt(draftFuel)} л</b></div><button className="primary" onClick={addTrip}>Добавить поездку</button></div></div>}{showRefuel && <div className="modal"><div className="modal-card"><div className="row"><h2>Заправка АИ-92</h2><button className="icon" onClick={() => setShowRefuel(false)}>×</button></div><p>Сейчас в расчёте: <b>{fmt(remaining)} л</b></p><label>Заправлено, л</label><NumericInput autoFocus decimal placeholder="20" value={refuel} onChange={e => setRefuel(e.target.value)} onEnter={addRefuel}/><div className="preview">После заправки: <b>{fmt(remaining + num(refuel))} л</b></div><button className="primary" onClick={addRefuel}>Сохранить заправку</button></div></div>}{showFinish && <div className="modal"><div className="modal-card"><div className="row"><h2>Сдача путёвки</h2><button className="icon" onClick={() => setShowFinish(false)}>×</button></div><div className="preview"><b>Итог:</b><br/>Начальный одометр: <b>{fmt(num(odometer))} км</b><br/>Пройдено: <b>{fmt(tripKm)} км</b><br/>Расчётный одометр: <b>{fmt(currentOdometer)} км</b><br/>Расход: <b>{fmt(usedFuel)} л</b><br/>Заправлено: <b>{fmt(addedFuel)} л</b><br/>Расчётный остаток: <b>{fmt(remaining)} л</b></div><button className="primary" onClick={() => { setShowFinish(false); alert('Путёвка сохранена'); }}>Сохранить путёвку</button></div></div>}</main>;
}

function Root() {
  const [session, setSession] = useState(null); const [profile, setProfile] = useState(null); const [loading, setLoading] = useState(true);
  const loadProfile = async user => { const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single(); setProfile(data || null); setSession(user); };
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session?.user) loadProfile(data.session.user); else setLoading(false); }); const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => { if (s?.user) loadProfile(s.user); else { setSession(null); setProfile(null); } setLoading(false); }); return () => listener.subscription.unsubscribe(); }, []);
  const logout = async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); };
  if (loading) return <main className="app"><section className="card"><p>Загрузка...</p></section></main>;
  return session ? <App user={session} profile={profile} onLogout={logout}/> : <Auth onLogin={u => loadProfile(u)}/>;
}
createRoot(document.getElementById('root')).render(<Root />);
