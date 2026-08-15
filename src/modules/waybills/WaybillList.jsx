import React, { useEffect, useState } from 'react';
import { getMyWaybills } from './waybillService';

const fmt = n => Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

export default function WaybillList({ driverId, onBack }) {
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getMyWaybills(driverId);
        if (mounted) setWaybills(data || []);
      } catch (e) {
        if (mounted) setError(e.message || 'Не удалось загрузить путёвки');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [driverId]);

  return (
    <main className="app">
      <header>
        <div><h1>Мои путёвки</h1><p>История сданных путёвок</p></div>
        <button className="icon" onClick={onBack}>×</button>
      </header>
      <section className="card">
        {loading && <p className="muted">Загрузка...</p>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && !waybills.length && <p className="muted">Путёвок пока нет.</p>}
        {!loading && waybills.map(w => (
          <div className="item" key={w.id}>
            <div>
              <b>{new Date(w.completed_at || w.created_at).toLocaleString('ru-RU')}</b>
              <span>Пробег: {fmt(w.total_km)} км · Расход: {fmt(w.fuel_used)} л</span>
              <span>Одометр: {fmt(w.start_odometer)} → {fmt(w.end_odometer)} км</span>
            </div>
            <strong>{fmt(w.end_fuel)} л</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
