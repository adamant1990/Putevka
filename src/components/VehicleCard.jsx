import React from 'react';

export default function VehicleCard({ vehicle, index, canDelete, onUpdate, onDelete, active, onActivate }) {
  return <div className="card vehicle-card">
    <div className="row">
      <h2>{vehicle.name || `Автомобиль ${index + 1}`}</h2>
      {canDelete && <button className="delete" onClick={() => onDelete(vehicle.id)}>×</button>}
    </div>

    <label>🚗 Название автомобиля</label>
    <input
      value={vehicle.name}
      onChange={e => onUpdate(vehicle.id, 'name', e.target.value)}
      placeholder="Например, Hyundai Solaris"
    />

    <label>🏙️ Город, л/100 км</label>
    <input
      inputMode="decimal"
      value={vehicle.city}
      onChange={e => onUpdate(vehicle.id, 'city', e.target.value)}
      placeholder="18"
    />

    <label>🛣️ Трасса, л/100 км</label>
    <input
      inputMode="decimal"
      value={vehicle.highway}
      onChange={e => onUpdate(vehicle.id, 'highway', e.target.value)}
      placeholder="14"
    />

    <label className="radio-row">
      <input
        type="radio"
        name="activeVehicle"
        checked={active}
        onChange={onActivate}
      />
      <span>Использовать для новых смен</span>
    </label>
  </div>;
}
