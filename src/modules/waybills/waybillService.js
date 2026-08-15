import { supabase } from '../../supabase';

export async function saveWaybill({
  driverId,
  vehicleTypeId,
  startOdometer,
  endOdometer,
  startFuel,
  fuelUsed,
  fuelAdded,
  endFuel,
  totalKm,
  trips = [],
  refuels = [],
}) {
  const { data, error } = await supabase.rpc('create_waybill_and_charge', {
    p_vehicle_type_id: vehicleTypeId,
    p_start_odometer: Number(startOdometer),
    p_end_odometer: Number(endOdometer),
    p_start_fuel: Number(startFuel),
    p_fuel_used: Number(fuelUsed),
    p_fuel_added: Number(fuelAdded),
    p_end_fuel: Number(endFuel),
    p_total_km: Number(totalKm),
    p_trips: trips.map(trip => ({
      city: Number(trip.city) || 0,
      highway: Number(trip.highway) || 0,
      fuel: Number(trip.fuel) || 0,
    })),
    p_refuels: refuels.map(litres => Number(litres) || 0),
    p_charge: 5,
  });

  if (error) throw error;

  return data?.waybill || data;
}

export async function getMyWaybills(driverId) {
  const { data, error } = await supabase
    .from('waybills')
    .select('*')
    .eq('driver_id', driverId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
