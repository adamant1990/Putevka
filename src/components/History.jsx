import React from 'react';
import { calculateTotals } from '../utils/calculations';
import { format, formatDate } from '../utils/formatting';

export default function History({ history, currentId, onOpen, onNew, onBack, settings }) {
  const vehicleName = id => settings.vehicles.find(vehicle => vehicle.id === id)?.name || 'Автомобиль';

  return <main className="app">
    <header>
      <div><h1>Мои путёвки</h1><p>Сохранённые смены</p></div>
      <button className="icon" onClick={onBack}>×</button>
    </header>

    <section className="card">
      <button className="primary big" onClick={onNew}>＋ Новая смена</button>
      <p className="muted">Завершённые смены сохраняются в истории. Каждая путёвка хранит свой автомобиль и его нормы расхода.</p>
    </section>

    <section className="card">
      <div className="row"><h2>Смены</h2><span className="badge">{history.length}</span></div>
      {history.length === 0 ? <p className="muted">Пока нет сохранённых смен.</p> : <div className="list">
        {history.map(shift => {
          const totals = calculateTotals(shift, settings.vehicles.find(vehicle => vehicle.id === shift.vehicleId));
          return <button className={`history-item ${shift.id === currentId ? 'active' : ''}`} key={shift.id} onClick={() => onOpen(shift.id)}>
            <div>
              <b>{formatDate(shift.date)} {shift.completed ? '· Завершена' : '· Текущая'}</b>
              <span>{vehicleName(shift.vehicleId)} · {shift.trips.length} поездок · {format(totals.totalKm)} км{totals.endOdometer > 0 ? ` · одометр ${format(totals.endOdometer)} км` : ''} · {shift.refuels.length} заправок</span>
            </div>
            <strong>›</strong>
          </button>;
        })}
      </div>}
    </section>
  </main>;
}
