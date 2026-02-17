import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../models/services/authService";

export function useAuthController() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados dos inputs
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Máscara para telefone: (99) 99999-9999
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos

    if (valor.length > 2) valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    if (valor.length > 10) valor = `${valor.slice(0, 10)}-${valor.slice(10)}`;

    setTelefone(valor);
  };

  const handleAuth = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    // Validações de frontend
    if (!isLogin) {
      if (nome.trim().split(" ").length < 2) {
        setErro("Por favor, informe seu nome e sobrenome.");
        setLoading(false);
        return;
      }
      if (telefone.replace(/\D/g, "").length < 10) {
        setErro("Informe um número de WhatsApp válido com DDD.");
        setLoading(false);
        return;
      }
    }

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await AuthService.signIn(email, senha);
      } else {
        await AuthService.signUp(email, senha, nome, telefone);
      }
      navigate("/");
    } catch (err: any) {
      // Tradução de erros comuns do Supabase
      if (err.message.includes("Invalid login credentials")) {
        setErro("E-mail ou senha incorretos.");
      } else if (err.message.includes("User already registered")) {
        setErro("Este e-mail já está cadastrado.");
      } else {
        setErro(err.message || "Ocorreu um erro na autenticação.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    isLogin, setIsLogin, loading, erro, setErro, mostrarSenha, setMostrarSenha,
    nome, setNome, telefone, handleTelefoneChange, email, setEmail, senha, setSenha,
    handleAuth, navigate
  };
}