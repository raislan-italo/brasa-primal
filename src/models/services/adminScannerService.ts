import { supabase } from "../../lib/supabase";

export const AdminScannerService = {
  async getPedidoCompleto(pedidoId: string) {
    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        *,
        itens_pedido (
          quantidade,
          preco_unitario_congelado
        )
      `)
      .eq("id", pedidoId)
      .single();

    if (error) throw error;
    return data;
  },

  async darBaixa(pedidoId: string) {
    const { error } = await supabase
      .from("pedidos")
      .update({
        status: "RETIRADO",
        entregue_em: new Date().toISOString(),
      })
      .eq("id", pedidoId);

    if (error) throw new Error("Erro ao atualizar o status para RETIRADO.");
  }
};