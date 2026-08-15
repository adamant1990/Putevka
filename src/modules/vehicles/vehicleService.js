import { supabase } from '../../supabase';

export async function getVehicleTypes({ activeOnly = false } = {}) {
  let query = supabase
    .from('vehicle_types')
    .select('id,name,city_consumption,highway_consumption,is_active,created_at')
    .order('name');

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createVehicleType({ name, cityConsumption, highwayConsumption }) {
  const { data, error } = await supabase
    .from('vehicle_types')
    .insert({
      name: name.trim(),
      city_consumption: Number(cityConsumption),
      highway_consumption: Number(highwayConsumption),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicleType(id, changes) {
  const { data, error } = await supabase
    .from('vehicle_types')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
