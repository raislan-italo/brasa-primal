import { Lock, Mail, Loader2, ShieldAlert, EyeOff, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "../../controllers/adminAuthController";

export default function AdminAuthScreen() {
  const {
    loading,
    erro,
    mostrarSenha,
    setMostrarSenha,
    email,
    setEmail,
    senha,
    setSenha,
    handleAdminLogin,
  } = useAdminAuth();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Background discreto */}
      <div className="absolute top-[-20%] right-[-10%] w-125 h-125 bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">
            Acesso Restrito
          </h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">
            Terminal Operacional Brasa Primal
          </p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-800">
          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-bold overflow-hidden"
              >
                {erro}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
              <input
                type="email"
                placeholder="E-mail Operacional"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-zinc-600 font-sans"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha de Acesso"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-zinc-600 font-sans"
              />
              {senha.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-3.5 text-zinc-600 hover:text-red-500 transition-colors"
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
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.15)] mt-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Autenticar"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
