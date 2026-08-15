import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const authHeader = req.headers.get('Authorization') || ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Не авторизован' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Недостаточно прав' }), { status: 403, headers: { 'Content-Type': 'application/json' } })

  const { phone, password, full_name } = await req.json()
  const digits = String(phone || '').replace(/\D/g, '')
  const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits
  if (!/^7\d{10}$/.test(normalized)) return new Response(JSON.stringify({ error: 'Неверный номер телефона' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  if (!password || String(password).length < 6) return new Response(JSON.stringify({ error: 'Пароль должен быть не менее 6 символов' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  if (!full_name?.trim()) return new Response(JSON.stringify({ error: 'Укажите ФИО' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const email = `${normalized}@putevka.local`
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (createError) return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const { error: profileError } = await admin.from('profiles').upsert({ id: created.user.id, full_name: full_name.trim(), role: 'driver', is_active: true })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  return new Response(JSON.stringify({ ok: true, id: created.user.id }), { headers: { 'Content-Type': 'application/json' } })
})
