import { supabase } from "../../lib/supabase";

export const HomeService = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProdutoAtivo() {
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, preco, estoque_atual")
      .eq("ativo", true)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignora erro se não achar nada
    return data;
  },

  async getPedidosUsuario(userId: string) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, valor_total, status")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  async getItensGratis(pedidosIds: string[]) {
    if (pedidosIds.length === 0) return 0;
    const { data, error } = await supabase
      .from("itens_pedido")
      .select("quantidade")
      .in("pedido_id", pedidosIds)
      .eq("preco_unitario_congelado", 0);

    if (error) throw error;
    return (data || []).reduce((acc, curr) => acc + Number(curr.quantidade), 0);
  },

  async criarPedido(userId: string, total: number, status: string) {
    const { data, error } = await supabase
      .from("pedidos")
      .insert({ user_id: userId, valor_total: total, status })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async inserirItensPedido(itens: any[]) {
    const { error } = await supabase.from("itens_pedido").insert(itens);
    if (error) throw error;
  },

  async gerarPixFunction(pedidoId: string, total: number, email: string) {
    const { data, error } = await supabase.functions.invoke("criar-pix", {
      body: { pedido_id: pedidoId, valor_total: total, email_cliente: email },
    });
    if (error || !data?.sucesso) throw new Error("Erro ao gerar PIX");
    return data;
  },

  async salvarPixNoPedido(pedidoId: string, pixCopiaCola: string, qrCodeBase64: string) {
    const { error } = await supabase
      .from("pedidos")
      .update({ pix_copia_cola: pixCopiaCola, qr_code_base64: qrCodeBase64 })
      .eq("id", pedidoId);

    if (error) throw error;
  }
};