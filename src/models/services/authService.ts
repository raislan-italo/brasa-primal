import { supabase } from "../../lib/supabase";

export const AuthService = {
  async signIn(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, senha: string, nome: string, telefone: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome_completo: nome, telefone: telefone },
      },
    });
    if (error) throw error;
    return data;
  }
};