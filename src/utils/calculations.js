export const parseNumber = value => {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text || !/^\d+(?:\.\d+)?$/.test(text)) return 0;
  return Number(text);
};

export const sumValues = value => String(value ?? '')
  .replace(/,/g, '.')
  .split(/\s+/)
  .map(item => parseNumber(item))
  .reduce((sum, item) => sum + item, 0);

export const numberValue = value => sumValues(value);

export const getTripKm = trip => numberValue(trip?.cityKm) + numberValue(trip?.highwayKm);

export const calculateTotals = (shift, vehicle) => {
  const trips = Array.isArray(shift?.trips) ? shift.trips : [];
  const refuels = Array.isArray(shift?.refuels) ? shift.refuels : [];
  const cityNorm = numberValue(vehicle?.city);
  const highwayNorm = numberValue(vehicle?.highway);
  const city = trips.reduce((sum, trip) => sum + numberValue(trip.cityKm), 0);
  const highway = trips.reduce((sum, trip) => sum + numberValue(trip.highwayKm), 0);
  const totalKm = city + highway;
  const cityFuel = city * cityNorm / 100;
  const highwayFuel = highway * highwayNorm / 100;
  const totalFuel = cityFuel + highwayFuel;
  const totalRefuel = refuels.reduce((sum, item) => sum + numberValue(item.liters), 0);
  const startFuel = numberValue(shift?.startFuel);
  const estimatedEndFuel = startFuel + totalRefuel - totalFuel;
  const remainingFuel = Math.max(0, estimatedEndFuel);
  const remainingCityKm = cityNorm > 0 ? remainingFuel * 100 / cityNorm : 0;
  const startOdometer = numberValue(shift?.odometer);
  const endOdometer = startOdometer > 0 ? startOdometer + totalKm : 0;

  return {
    cityNorm,
    highwayNorm,
    city,
    highway,
    totalKm,
    cityFuel,
    highwayFuel,
    totalFuel,
    totalRefuel,
    startFuel,
    estimatedEndFuel,
    remainingFuel,
    remainingCityKm,
    startOdometer,
    endOdometer
  };
};

export const calculateEndOdometer = shift => {
  const start = numberValue(shift?.odometer);
  const totalKm = Array.isArray(shift?.trips)
    ? shift.trips.reduce((sum, trip) => sum + getTripKm(trip), 0)
    : 0;
  return start > 0 ? start + totalKm : 0;
};
