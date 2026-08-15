import React from 'react';

const fmt = n => Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

export default function WaybillCard({ waybill, onClick }) {
  const date = new Date(waybill.completed_at || waybill.created_at).toLocaleString('ru-RU');
  return (
    <button className="card waybill-card" onClick={onClick} type="button">
      <div className="waybill-card-head">
        <div>
          <b>Путёвка</b>
          <span className="muted">{date}</span>
        </div>
        <span className="waybill-card-arrow">›</span>
      </div>
      <div className="waybill-card-stats">
        <span>Пробег <b>{fmt(waybill.total_km)} км</b></span>
        <span>Расход <b>{fmt(waybill.fuel_used)} л</b></span>
        <span>Остаток <b>{fmt(waybill.end_fuel)} л</b></span>
      </div>
    </button>
  );
}
