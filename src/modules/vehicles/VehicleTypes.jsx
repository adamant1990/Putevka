import React, { useEffect, useState } from 'react';
import { createVehicleType, getVehicleTypes, updateVehicleType } from './vehicleService';

const numberValue = value => Number(String(value).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;

export default function VehicleTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', city: '', highway: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getVehicleTypes());
    } catch (e) {
      setError(e.message || 'Не удалось загрузить виды автомобилей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditing(null);
    setForm({ name: '', city: '', highway: '' });
  };

  const save = async () => {
    setError('');
    if (!form.name.trim()) return setError('Введите название автомобиля');
    if (!numberValue(form.city) || !numberValue(form.highway)) return setError('Введите расход для города и трассы');

    setSaving(true);
    try {
      const changes = {
        name: form.name.trim(),
        city_consumption: numberValue(form.city),
        highway_consumption: numberValue(form.highway),
      };
      if (editing) await updateVehicleType(editing.id, changes);
      else await createVehicleType(changes);
      reset();
      await load();
    } catch (e) {
      setError(e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async item => {
    setError('');
    try {
      await updateVehicleType(item.id, { is_active: !item.is_active });
      await load();
    } catch (e) {
      setError(e.message || 'Не удалось изменить статус');
    }
  };

  const edit = item => {
    setEditing(item);
    setForm({ name: item.name, city: String(item.city_consumption), highway: String(item.highway_consumption) });
  };

  return (
    <section className="card">
      <div className="row">
        <h2>Виды автомобилей</h2>
        {!editing && <button className="small" onClick={() => setEditing({ new: true })}>＋ Добавить</button>}
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? <p className="muted">Загрузка...</p> : !items.length ? <p className="muted">Видов автомобилей пока нет.</p> : items.map(item => (
        <div className="driver-item" key={item.id}>
          <div>
            <b>{item.name}</b>
            <span>{item.is_active ? 'Активен' : 'Отключён'}</span>
            <span>Город: {item.city_consumption} л/100 км · Трасса: {item.highway_consumption} л/100 км</span>
          </div>
          <div className="driver-balance">
            <button className="small" onClick={() => edit(item)}>Изменить</button>
            <button className="small" onClick={() => toggle(item)}>{item.is_active ? 'Отключить' : 'Включить'}</button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="modal">
          <div className="modal-card">
            <div className="row">
              <h2>{editing.new ? 'Новый автомобиль' : 'Изменить автомобиль'}</h2>
              <button className="icon" onClick={reset}>×</button>
            </div>
            <label>Название</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="УАЗ" />
            <label>Расход город, л/100 км</label>
            <input inputMode="decimal" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="18" />
            <label>Расход трасса, л/100 км</label>
            <input inputMode="decimal" value={form.highway} onChange={e => setForm({ ...form, highway: e.target.value })} placeholder="14" onKeyDown={e => e.key === 'Enter' && save()} />
            <button className="primary" disabled={saving} onClick={save}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </div>
      )}
    </section>
  );
}
