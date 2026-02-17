import { supabase } from "../../lib/supabase";

export const AdminService = {
  async getPedidos() {
    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        id, created_at, status, valor_total, 
        profiles (nome, telefone), 
        itens_pedido (quantidade)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProdutos() {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;
    return data;
  },

  async aprovarPagamentoPix(pedidoId: string) {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "PAGO" })
      .eq("id", pedidoId);

    if (error) throw error;
  },

  async salvarProduto(produto: any, idEditar?: string) {
    if (idEditar) {
      const { error } = await supabase.from("produtos").update(produto).eq("id", idEditar);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("produtos").insert([produto]);
      if (error) throw error;
    }
  },

  async deletarProduto(produtoId: string) {
    const { error } = await supabase.from("produtos").delete().eq("id", produtoId);
    if (error) throw error;
  }
};