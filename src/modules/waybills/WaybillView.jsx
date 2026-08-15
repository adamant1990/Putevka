import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

const fmt = n => Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

export default function WaybillView({ waybill, onBack }) {
  const [trips, setTrips] = useState([]);
  const [refuels, setRefuels] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('waybill_trips').select('*').eq('waybill_id', waybill.id),
      supabase.from('waybill_refuels').select('*').eq('waybill_id', waybill.id),
    ]).then(([t, r]) => {
      if (!mounted) return;
      if (t.error || r.error) setError((t.error || r.error).message);
      else { setTrips(t.data || []); setRefuels(r.data || []); }
    });
    return () => { mounted = false; };
  }, [waybill.id]);

  return (
    <main className="app">
      <header>
        <div><h1>Путёвка</h1><p>{new Date(waybill.completed_at || waybill.created_at).toLocaleString('ru-RU')}</p></div>
        <button className="icon" onClick={onBack}>×</button>
      </header>
      <section className="card">
        <h2>Основные данные</h2>
        <div className="preview">
          Одометр при выезде: <b>{fmt(waybill.start_odometer)} км</b><br/>
          Одометр при сдаче: <b>{fmt(waybill.end_odometer)} км</b><br/>
          Пройдено: <b>{fmt(waybill.total_km)} км</b><br/>
          Начальный остаток: <b>{fmt(waybill.start_fuel)} л</b><br/>
          Расход: <b>{fmt(waybill.fuel_used)} л</b><br/>
          Заправлено: <b>{fmt(waybill.fuel_added)} л</b><br/>
          Конечный остаток: <b>{fmt(waybill.end_fuel)} л</b>
        </div>
      </section>
      {error && <div className="error">{error}</div>}
      <section className="card">
        <h2>Поездки</h2>
        {!trips.length ? <p className="muted">Поездок нет.</p> : trips.map((t, i) => (
          <div className="item" key={t.id || i}>
            <div><b>Поездка {i + 1}</b><span>Город {fmt(t.city_km)} км · Трасса {fmt(t.highway_km)} км</span></div>
            <strong>−{fmt(t.fuel_used)} л</strong>
          </div>
        ))}
      </section>
      <section className="card">
        <h2>Заправки</h2>
        {!refuels.length ? <p className="muted">Заправок нет.</p> : refuels.map((r, i) => (
          <div className="item" key={r.id || i}>
            <div><b>⛽ {r.fuel_type || 'Заправка'}</b><span>Заправлено топлива</span></div>
            <strong>+{fmt(r.litres)} л</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
