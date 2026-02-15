import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, data } = await req.json()

    // Só nos interessa quando um pagamento é atualizado
    if (action === "payment.updated" || action === "payment.created") {
      const paymentId = data.id
      const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

      // 1. Pergunta ao Mercado Pago o status real desse ID
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const mpData = await mpResponse.json()

      // 2. Se estiver aprovado, atualiza nosso banco
      if (mpData.status === 'approved') {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SERVICE_ROLE_KEY') ?? ''
        )

        await supabaseAdmin
          .from('pedidos')
          .update({ status: 'PAGO' })
          .eq('gateway_pagamento_id', paymentId.toString())
      }
    }

    return new Response(JSON.stringify({ recebido: true }), { status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ erro: error.message }), { status: 400 })
  }
})