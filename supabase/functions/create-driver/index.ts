import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  // Browser sends OPTIONS before the authenticated POST request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await caller.auth.getUser()

    if (!user) {
      return json({ error: 'Не авторизован' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return json({ error: 'Недостаточно прав' }, 403)
    }

    const { phone, password, full_name } = await req.json()

    const digits = String(phone || '').replace(/\D/g, '')
    const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits

    if (!/^7\d{10}$/.test(normalized)) {
      return json({ error: 'Неверный номер телефона' }, 400)
    }

    if (!password || String(password).length < 6) {
      return json({ error: 'Пароль должен быть не менее 6 символов' }, 400)
    }

    if (!full_name?.trim()) {
      return json({ error: 'Укажите ФИО' }, 400)
    }

    const email = `${normalized}@putevka.local`

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createError) {
      return json({ error: createError.message }, 400)
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: created.user.id,
        full_name: full_name.trim(),
        role: 'driver',
        is_active: true,
      })

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: profileError.message }, 400)
    }

    return json({ ok: true, id: created.user.id })
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }, 500)
  }
})
