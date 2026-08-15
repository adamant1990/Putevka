import React from 'react';

const fmt = n => Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

export default function WaybillCard({ waybill, onClick }) {
  const date = new Date(waybill.completed_at || waybill.created_at).toLocaleString('ru-RU');
  return (
    <button className="card waybill-card" onClick={onClick} type="button">
      <div className="row">
        <div>
          <h3>Путёвка</h3>
          <span className="muted">{date}</span>
        </div>
        <strong>{fmt(waybill.end_fuel)} л</strong>
      </div>
      <div className="waybill-card-grid">
        <span>Пробег<br/><b>{fmt(waybill.total_km)} км</b></span>
        <span>Расход<br/><b>{fmt(waybill.fuel_used)} л</b></span>
        <span>Одометр<br/><b>{fmt(waybill.start_odometer)} → {fmt(waybill.end_odometer)}</b></span>
      </div>
    </button>
  );
}
