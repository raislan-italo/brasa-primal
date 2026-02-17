import { supabase } from "../../lib/supabase";

export const ClientService = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getPedidos(userId: string) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getItensGratisResgatados(pedidosIds: string[]) {
    if (pedidosIds.length === 0) return 0;
    const { data, error } = await supabase
      .from("itens_pedido")
      .select("quantidade")
      .in("pedido_id", pedidosIds)
      .eq("preco_unitario_congelado", 0);

    if (error) throw error;
    return (data || []).reduce((acc, curr) => acc + Number(curr.quantidade), 0);
  },

  async atualizarPerfilUsuario(nome: string, telefone: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: { nome_completo: nome, telefone: telefone },
    });
    if (error) throw error;
    return data.user;
  },

  async uploadAvatarUsuario(userId: string, file: File) {
    // Pega a extensão original do arquivo (ex: .png, .jpg)
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    // Faz o upload (adicionado upsert: true por segurança)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Atualiza os metadados do usuário no banco
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });
    if (updateError) throw updateError;

    // Retorna a URL e o usuário atualizado
    return { publicUrl, updatedUser: data.user };
  },

  async logout() {
    await supabase.auth.signOut();
  }
};