import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com o CORS (permissão para o seu site chamar essa API)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Recebe os dados enviados pelo seu frontend (React)
    const { pedido_id, valor_total, email_cliente } = await req.json()

    // 2. Pega a sua chave secreta do Mercado Pago configurada no Supabase
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    // 3. Faz a requisição blindada para a API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': pedido_id, // Garante que não cobre duas vezes o mesmo pedido
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_amount: Number(valor_total),
        description: 'Carvão Premium - BrasaExpress',
        payment_method_id: 'pix',
        payer: { email: email_cliente }
      })
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) throw new Error(mpData.message || "Erro no Mercado Pago")

    // 4. Conecta no banco de dados contornando as regras de segurança (Modo Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // 5. Salva o PIX gerado e o ID da transação no banco
    const pixCopiaCola = mpData.point_of_interaction.transaction_data.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction.transaction_data.qr_code_base64;

    await supabaseAdmin
      .from('pedidos')
      .update({
        gateway_pagamento_id: mpData.id.toString(),
        pix_copia_cola: pixCopiaCola
      })
      .eq('id', pedido_id)

    // 6. Devolve o PIX pro frontend renderizar na tela
    return new Response(JSON.stringify({ 
      sucesso: true, 
      pix_copia_cola: pixCopiaCola,
      qr_code_base64: qrCodeBase64
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ erro: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})