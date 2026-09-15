import { numberValue } from './calculations';

export const SETTINGS_KEY = 'putevka_calculator_settings';
export const SHIFT_KEY = 'putevka_shift_data';
export const HISTORY_KEY = 'putevka_shift_history';

export const DEFAULT_SETTINGS = {
  vehicles: [{ id: 'vehicle-1', name: 'Автомобиль 1', city: 18, highway: 14 }],
  activeVehicleId: 'vehicle-1'
};

export const DEFAULT_SHIFT = {
  id: '',
  date: '',
  odometer: '',
  startFuel: '',
  trips: [],
  refuels: [],
  completed: false,
  vehicleId: 'vehicle-1'
};

export const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const makeShift = (overrides = {}) => ({
  ...DEFAULT_SHIFT,
  id: makeId(),
  date: getLocalDate(),
  ...overrides
});

export const normalizeSettings = saved => {
  if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS;

  if (Array.isArray(saved.vehicles) && saved.vehicles.length > 0) {
    const vehicles = saved.vehicles.map((vehicle, index) => ({
      id: vehicle.id || `vehicle-${index + 1}`,
      name: String(vehicle.name || `Автомобиль ${index + 1}`),
      city: numberValue(vehicle.city),
      highway: numberValue(vehicle.highway)
    }));
    const activeVehicleId = vehicles.some(vehicle => vehicle.id === saved.activeVehicleId)
      ? saved.activeVehicleId
      : vehicles[0].id;
    return { vehicles, activeVehicleId };
  }

  const vehicle = {
    id: 'vehicle-1',
    name: 'Автомобиль 1',
    city: numberValue(saved.city ?? 18) || 18,
    highway: numberValue(saved.highway ?? 14) || 14
  };
  return { vehicles: [vehicle], activeVehicleId: vehicle.id };
};

export const normalizeShift = item => ({
  ...DEFAULT_SHIFT,
  ...(item || {}),
  id: item?.id || makeId(),
  date: item?.date || getLocalDate(),
  trips: Array.isArray(item?.trips) ? item.trips : [],
  refuels: Array.isArray(item?.refuels) ? item.refuels : [],
  completed: Boolean(item?.completed),
  vehicleId: item?.vehicleId || 'vehicle-1'
});

export const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
