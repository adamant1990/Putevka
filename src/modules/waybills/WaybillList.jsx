import React, { useEffect, useMemo, useState } from 'react';
import { getMyWaybills } from './waybillService';
import WaybillCard from './WaybillCard';
import WaybillView from './WaybillView';

export default function WaybillList({ driverId, onBack }) {
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');

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

  const filtered = useMemo(() => {
    if (!date) return waybills;
    return waybills.filter(w => {
      const value = w.completed_at || w.created_at;
      return value && new Date(value).toLocaleDateString('sv-SE') === date;
    });
  }, [waybills, date]);

  if (selected) return <WaybillView waybill={selected} onBack={() => setSelected(null)} />;

  return (
    <main className="app">
      <header>
        <div><h1>Мои путёвки</h1><p>История сданных путёвок</p></div>
        <button className="icon" onClick={onBack}>×</button>
      </header>
      <section className="card">
        <label>📅 Показать за дату</label>
        <div className="row">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          {date && <button className="small" onClick={() => setDate('')}>Сбросить</button>}
        </div>
      </section>
      <section className="card">
        {loading && <p className="muted">Загрузка...</p>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && !filtered.length && <p className="muted">Путёвок за выбранную дату нет.</p>}
        {!loading && !error && filtered.map(w => (
          <WaybillCard key={w.id} waybill={w} onClick={() => setSelected(w)} />
        ))}
      </section>
    </main>
  );
}
