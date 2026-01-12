import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// PRODUCTION MODE: Send to actual recipients
const USE_PRODUCTION_EMAILS = true
const TESTING_EMAIL = 'lukeapp2025@gmail.com'

interface NotificationPayload {
  id: string
  company_id: string
  type: 'quota_warning' | 'quota_blocked'
  strike_count: number
  data: {
    resource: string
    current_usage: number
    limit: number
    date: string
  }
}

serve(async (req) => {
  try {
    console.log('📧 Resend quota notification triggered')

    const notification: NotificationPayload = await req.json()
    console.log('Notification:', JSON.stringify(notification))

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: { schema: 'public' }
    })

    // 1. Get company name
    console.log('Fetching company...')
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', notification.company_id)
      .single()

    if (companyError) console.error('Company fetch error:', companyError)
    console.log('Company:', company?.name)

    // 2. Get members
    console.log('Fetching members...')
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('user_id')
      .eq('company_id', notification.company_id)
      .in('role_id', ['founder', 'admin'])

    if (membersError) console.error('Members fetch error:', membersError)
    console.log('Members found:', members?.length)

    if (!members || members.length === 0) {
      console.log('No founders/admins found')
      return new Response(JSON.stringify({ success: false, error: 'No recipients' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3. Get user emails
    const userIds = members.map((m: any) => m.user_id)
    console.log('Fetching user emails for IDs:', userIds)

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email')
      .in('id', userIds)

    if (usersError) console.error('Users fetch error:', usersError)
    console.log('Users fetched:', users?.length)

    const productionEmails = [...new Set((users || []).map((u: any) => u.email).filter(Boolean))]

    // Use production or testing emails
    const emails = USE_PRODUCTION_EMAILS ? productionEmails : [TESTING_EMAIL]
    console.log('Production emails:', productionEmails)
    console.log('Sending to:', emails, USE_PRODUCTION_EMAILS ? '(PRODUCTION)' : '(TESTING MODE)')

    if (emails.length === 0) {
      console.log('No valid emails found')
      return new Response(JSON.stringify({ success: false, error: 'No valid emails' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 4. Build email
    const isBlocked = notification.type === 'quota_blocked'
    const subject = isBlocked
      ? `🚫 Operación Bloqueada: Cuota Excedida (${company?.name || 'Tu Empresa'})`
      : `⚠️ Advertencia: Cuota de ${notification.data.resource === 'spool' ? 'Spools' : 'Almacenamiento'} Excedida`

    const html = buildEmailHTML(notification, company?.name || 'Tu Empresa', isBlocked)

    // 5. Send via Resend using verified domain
    console.log('📤 Calling Resend API...')
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'LukeAPP <notificaciones@lukeapp.me>',
        to: emails,
        subject: subject,
        html: html
      })
    })

    const resendData = await resendResponse.json()
    console.log('Resend response status:', resendResponse.status)
    console.log('Resend response:', JSON.stringify(resendData))

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      throw new Error(`Resend failed: ${JSON.stringify(resendData)}`)
    }

    // 6. Mark as sent
    console.log('✅ Marking notification as sent...')
    const { error: updateError } = await supabase
      .from('system_notifications')
      .update({ is_sent: true })
      .eq('id', notification.id)

    if (updateError) {
      console.error('Failed to update is_sent:', updateError)
    } else {
      console.log('✅ Successfully marked as sent')
    }

    console.log(`✅ Sent ${isBlocked ? 'BLOCKED' : 'WARNING'} email to ${emails.length} recipients`)

    return new Response(JSON.stringify({
      success: true,
      recipients: emails.length,
      production_mode: USE_PRODUCTION_EMAILS,
      resend_data: resendData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error sending quota notification:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function buildEmailHTML(notification: NotificationPayload, companyName: string, isBlocked: boolean): string {
  const resourceLabel = notification.data.resource === 'spool' ? 'Spools' : 'Almacenamiento'
  const currentUsage = notification.data.resource === 'storage'
    ? `${notification.data.current_usage.toFixed(2)} GB`
    : notification.data.current_usage.toString()
  const limitLabel = notification.data.resource === 'storage'
    ? `${notification.data.limit} GB`
    : notification.data.limit.toString()

  const backgroundColor = isBlocked ? '#7f1d1d' : '#78350f'
  const accentColor = isBlocked ? '#ef4444' : '#fbbf24'
  const icon = isBlocked ? '🚫' : '⚠️'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f1f5f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 700; color: #60a5fa; margin: 0;">LukeAPP</h1>
      <p style="color: #94a3b8; margin-top: 8px;">${companyName}</p>
    </div>

    <!-- Alert Card -->
    <div style="background: linear-gradient(135deg, ${backgroundColor}, rgba(30, 41, 59, 0.8)); border: 2px solid ${accentColor}; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
        <h2 style="font-size: 24px; font-weight: 700; color: ${accentColor}; margin: 0;">
          ${isBlocked ? 'Operación Bloqueada' : 'Advertencia de Cuota'}
        </h2>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px;">
        ${isBlocked
      ? `Tu empresa ha excedido el límite de <strong>${resourceLabel}</strong> en <strong>3 días diferentes</strong>. Las operaciones de carga están bloqueadas.`
      : `Tu empresa ha excedido el límite de <strong>${resourceLabel}</strong> permitido por tu plan.`
    }
      </p>

      <!-- Stats -->
      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #94a3b8;">Strikes Acumulados:</span>
          <strong style="color: ${accentColor}; font-size: 18px;">${notification.strike_count} de 3</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #94a3b8;">Uso Actual:</span>
          <strong style="color: #f1f5f9;">${currentUsage}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #94a3b8;">Límite del Plan:</span>
          <strong style="color: #f1f5f9;">${limitLabel}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">Fecha:</span>
          <strong style="color: #f1f5f9;">${new Date(notification.data.date).toLocaleDateString('es-ES')}</strong>
        </div>
      </div>

      ${isBlocked ? `
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px;">
          <p style="margin: 0; color: #fca5a5; font-weight: 600;">⛔ Operaciones bloqueadas hasta que se resuelva</p>
        </div>
      ` : `
        <div style="background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 16px; border-radius: 4px;">
          <p style="margin: 0; color: #fcd34d; font-weight: 600;">⚠️ Al llegar a 3 strikes, se bloquearán las operaciones</p>
        </div>
      `}
    </div>

    <!-- Actions -->
    <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; text-align: center;">
      <h3 style="font-size: 18px; color: #f1f5f9; margin: 0 0 16px 0;">¿Qué hacer?</h3>
      <p style="color: #94a3b8; margin-bottom: 24px;">
        Contacta a nuestro equipo para ${isBlocked ? 'desbloquear tu cuenta y ' : ''}ampliar tu plan.
      </p>
      <a href="mailto:soporte@lukeapp.cl?subject=Ampliación de Plan - ${companyName}" 
         style="display: inline-block; background: linear-gradient(90deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Contactar Soporte
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: #64748b; font-size: 14px; margin: 0;">LukeAPP - Sistema de Gestión de Proyectos</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 8px;">Este es un email automático. No respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
