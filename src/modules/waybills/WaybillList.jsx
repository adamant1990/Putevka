import React, { useEffect, useState } from 'react';
import { getMyWaybills } from './waybillService';
import WaybillCard from './WaybillCard';
import WaybillView from './WaybillView';

export default function WaybillList({ driverId, onBack }) {
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

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

  if (selected) return <WaybillView waybill={selected} onBack={() => setSelected(null)} />;

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
        {!loading && !error && waybills.map(w => (
          <WaybillCard key={w.id} waybill={w} onClick={() => setSelected(w)} />
        ))}
      </section>
    </main>
  );
}
