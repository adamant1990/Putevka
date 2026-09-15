import React, { useState } from 'react';
import { makeId } from '../utils/storage';
import { numberValue } from '../utils/calculations';
import VehicleCard from './VehicleCard';

export default function Settings({ settings, history, onSave, onBack }) {
  const [vehicles, setVehicles] = useState(settings.vehicles);
  const [activeVehicleId, setActiveVehicleId] = useState(settings.activeVehicleId);

  const addVehicle = () => {
    const number = vehicles.length + 1;
    const vehicle = { id: makeId(), name: `Автомобиль ${number}`, city: 18, highway: 14 };
    setVehicles(prev => [...prev, vehicle]);
    setActiveVehicleId(vehicle.id);
  };

  const updateVehicle = (id, field, value) => {
    setVehicles(prev => prev.map(vehicle => (
      vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
    )));
  };

  const removeVehicle = id => {
    if (vehicles.length <= 1) {
      window.alert('Должен остаться хотя бы один автомобиль.');
      return;
    }
    if (history.some(item => item.vehicleId === id)) {
      window.alert('Этот автомобиль уже используется в сохранённых путёвках. Сначала оставьте его в списке, чтобы история не потеряла привязку к автомобилю.');
      return;
    }
    if (!window.confirm('Удалить этот автомобиль?')) return;

    const next = vehicles.filter(vehicle => vehicle.id !== id);
    setVehicles(next);
    if (activeVehicleId === id) setActiveVehicleId(next[0].id);
  };

  const save = () => {
    const cleanedVehicles = vehicles.map((vehicle, index) => ({
      ...vehicle,
      name: String(vehicle.name || `Автомобиль ${index + 1}`).trim(),
      city: numberValue(vehicle.city),
      highway: numberValue(vehicle.highway)
    }));

    onSave({
      vehicles: cleanedVehicles,
      activeVehicleId: cleanedVehicles.some(vehicle => vehicle.id === activeVehicleId)
        ? activeVehicleId
        : cleanedVehicles[0].id
    });
    onBack();
  };

  return <main className="app">
    <header>
      <div><h1>Настройки</h1><p>Автомобили и нормы расхода</p></div>
      <button className="icon" onClick={onBack}>×</button>
    </header>

    <section className="card">
      <h2>Автомобили</h2>
      <p className="muted">Добавьте все автомобили, которыми пользуетесь. Для каждого автомобиля задаются свои нормы расхода.</p>

      {vehicles.map((vehicle, index) => <VehicleCard
        key={vehicle.id}
        vehicle={vehicle}
        index={index}
        canDelete={vehicles.length > 1}
        onUpdate={updateVehicle}
        onDelete={removeVehicle}
        active={activeVehicleId === vehicle.id}
        onActivate={() => setActiveVehicleId(vehicle.id)}
      />)}

      <button className="primary" onClick={addVehicle}>＋ Добавить автомобиль</button>
      <button className="primary big" onClick={save}>Сохранить настройки</button>
    </section>
  </main>;
}
