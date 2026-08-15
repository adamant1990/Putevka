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
  const { data: waybill, error: waybillError } = await supabase
    .from('waybills')
    .insert({
      driver_id: driverId,
      vehicle_type_id: vehicleTypeId,
      start_odometer: Number(startOdometer),
      end_odometer: Number(endOdometer),
      start_fuel: Number(startFuel),
      fuel_used: Number(fuelUsed),
      fuel_added: Number(fuelAdded),
      end_fuel: Number(endFuel),
      total_km: Number(totalKm),
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (waybillError) throw waybillError;

  if (trips.length) {
    const { error } = await supabase.from('waybill_trips').insert(
      trips.map(trip => ({
        waybill_id: waybill.id,
        city_km: Number(trip.city) || 0,
        highway_km: Number(trip.highway) || 0,
        fuel_used: Number(trip.fuel) || 0,
      }))
    );
    if (error) throw error;
  }

  if (refuels.length) {
    const { error } = await supabase.from('waybill_refuels').insert(
      refuels.map(litres => ({
        waybill_id: waybill.id,
        litres: Number(litres) || 0,
        fuel_type: 'АИ-92',
      }))
    );
    if (error) throw error;
  }

  return waybill;
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
