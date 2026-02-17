import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../models/services/authService";
import { supabase } from "../lib/supabase";

export function useAdminAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const EMAIL_ADMIN = "raislanitalo62@gmail.com"; 

  const handleAdminLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    // Trava de segurança no frontend
    if (email.toLowerCase() !== EMAIL_ADMIN) {
      setErro("Acesso negado. Credenciais sem privilégio de administrador.");
      setLoading(false);
      return;
    }

    try {
      await AuthService.signIn(email, senha);
      
      // Validação extra de segurança após o login
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email !== EMAIL_ADMIN) {
        await supabase.auth.signOut();
        throw new Error("Acesso restrito.");
      }

      navigate("/admin");
    } catch (err: any) {
      if (err.message.includes("Invalid login credentials")) {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro("Erro de autenticação: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, erro, mostrarSenha, setMostrarSenha,
    email, setEmail, senha, setSenha, handleAdminLogin
  };
}