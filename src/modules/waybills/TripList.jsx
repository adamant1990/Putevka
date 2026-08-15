import React, { useState } from 'react';

export default function TripList({ trips, fmt, onDelete }) {
  const [pending, setPending] = useState(null);

  if (!trips.length) return <p className="muted">Добавьте поездку.</p>;

  return <>
    {trips.map((t, i) => <div className="item" key={i}>
      <div>
        <b>Поездка {i + 1}</b>
        <span>Город {fmt(t.city)} км · Трасса {fmt(t.highway)} км</span>
      </div>
      <div className="trip-actions">
        <strong>−{fmt(t.fuel)} л</strong>
        <button className="icon danger" title="Удалить поездку" onClick={() => setPending(i)}>🗑️</button>
      </div>
    </div>)}

    {pending !== null && <div className="modal">
      <div className="modal-card">
        <div className="row">
          <h2>Удалить поездку?</h2>
          <button className="icon" onClick={() => setPending(null)}>×</button>
        </div>
        <div className="preview">
          Город: <b>{fmt(trips[pending].city)} км</b><br />
          Трасса: <b>{fmt(trips[pending].highway)} км</b><br />
          Расход: <b>{fmt(trips[pending].fuel)} л</b>
        </div>
        <div className="row">
          <button className="small" onClick={() => setPending(null)}>Отмена</button>
          <button className="primary danger-button" onClick={() => { onDelete(pending); setPending(null); }}>Удалить</button>
        </div>
      </div>
    </div>}
  </>;
}
