import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados dos inputs
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const navigate = useNavigate();

  // Máscara para telefone: (99) 99999-9999
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número

    if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos

    if (valor.length > 2) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    }
    if (valor.length > 10) {
      valor = `${valor.slice(0, 10)}-${valor.slice(10)}`;
    }

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { nome_completo: nome, telefone: telefone },
          },
        });
        if (error) throw error;
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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos de fundo (Brasas brilhantes) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Botão voltar */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-zinc-400 hover:text-white flex items-center gap-2 text-sm transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para a loja
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo e header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-900 blur-xl opacity-20 rounded-full animate-pulse" />
            {/* logo*/}
            <img
              src="/icon-192.png"
              alt="Brasa Primal"
              className="
                relative
                w-25 h-20
                sm:w-24 sm:h-24
                md:w-28 md:h-28
                lg:w-32 lg:h-32
                object-contain
                drop-shadow-[0_0_20px_rgba(249,115,22,0.45)]
              "
            />
          </div>
          <h2 className="text-3xl font-black text-white mt-6 tracking-tighter uppercase italic">
            Brasa Primal
          </h2>
          <p className="text-zinc-400 text-sm mt-2 text-center max-w-62.5">
            O portal de acesso para o melhor drive-thru de carvão.
          </p>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-4xl p-6 sm:p-8 shadow-2xl border border-zinc-800/80">
          {/* TOGGLE PILL (Entrar / Cadastrar) */}
          <div className="flex bg-zinc-950/50 p-1 rounded-2xl mb-8 border border-zinc-800/50 relative">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded-xl transition-all duration-300 ease-in-out shadow-md ${isLogin ? "left-1" : "left-[calc(50%+2px)]"}`}
            />
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErro("");
              }}
              className={`flex-1 py-2.5 text-sm font-bold z-10 transition-colors ${isLogin ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErro("");
              }}
              className={`flex-1 py-2.5 text-sm font-bold z-10 transition-colors ${!isLogin ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Cadastrar
            </button>
          </div>

          {/* EXIBIÇÃO DE ERROS */}
          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-medium overflow-hidden"
              >
                {erro}
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORMULÁRIO */}
          <form className="space-y-4" onSubmit={handleAuth}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Nome e Sobrenome"
                      required={!isLogin}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="tel"
                      placeholder="WhatsApp (com DDD)"
                      required={!isLogin}
                      value={telefone}
                      onChange={handleTelefoneChange}
                      maxLength={15} // (99) 99999-9999 = 15 chars
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inputs de Email e Senha */}
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha segura"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
              />

              {/* OLHO PARA MOSTRAR/OCULTAR SENHA (Aparece só se houver digitação) */}
              {senha.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-3.5 text-zinc-500 hover:text-orange-500 transition-colors"
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(234,88,12,0.2)] mt-6"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Acessar Sistema" : "Criar Minha Conta"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
