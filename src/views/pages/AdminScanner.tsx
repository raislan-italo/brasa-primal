import {
  CheckCircle2,
  Loader2,
  Camera,
  AlertTriangle,
  Package,
  Gift,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminScanner } from "../../controllers/adminScannerController";

export default function AdminScanner() {
  const { status, pedidoInfo, erroMsg, reiniciarManualmente } =
    useAdminScanner();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mb-8 text-center relative z-10">
        <div className="bg-orange-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
          <Camera className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
          Terminal <span className="text-orange-500">Primal</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Aponte o ticket para a câmera.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Câmera ativa */}
        {status === "aguardando" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm space-y-6 relative z-10"
          >
            <div
              id="reader"
              className="overflow-hidden rounded-4xl border-2 border-zinc-800 bg-zinc-900/80 backdrop-blur-md shadow-2xl 
                [&>div]:border-none 
                [&_video]:rounded-4xl [&_video]:object-cover
                [&_#reader__dashboard_section_csr]:hidden
                [&_#reader__dashboard_section_swaplink]:hidden
                [&_#reader__header_message]:hidden
                [&_a]:hidden"
            />
            <div className="flex items-center justify-center gap-3 text-orange-500 animate-pulse bg-orange-500/10 py-3 rounded-xl border border-orange-500/20">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Aguardando QR Code...
              </span>
            </div>
          </motion.div>
        )}

        {/* Processando */}
        {status === "processando" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 relative z-10"
          >
            <Loader2 className="w-16 h-16 animate-spin text-orange-500" />
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
              Autenticando Ticket...
            </p>
          </motion.div>
        )}

        {/* Sucesso */}
        {status === "sucesso" && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md text-center bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(34,197,94,0.15)] relative z-10"
          >
            <div className="bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-500/30">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight text-white">
              Liberado!
            </h2>
            <p className="text-zinc-400 text-sm mb-8 font-mono">
              Ticket: #{pedidoInfo?.id.slice(0, 8)}
            </p>

            <div className="bg-zinc-950 rounded-2xl p-6 mb-8 border border-zinc-800 shadow-inner">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3 font-bold">
                Entregue ao Cliente:
              </p>
              <div className="flex items-center justify-center gap-4 text-5xl font-black text-white mb-2">
                {pedidoInfo?.qtdTotal}{" "}
                <Package className="w-10 h-10 text-orange-500" />
              </div>
              <p className="text-zinc-400 font-medium">
                {pedidoInfo?.qtdTotal > 1 ? " sacos " : " saco "} de carvão
              </p>

              {pedidoInfo?.qtdBrindes > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-center gap-2 text-yellow-500 font-bold bg-yellow-500/10 py-2 rounded-xl">
                  <Gift className="w-5 h-5" /> Inclui {pedidoInfo.qtdBrindes}{" "}
                  saco(s) grátis!
                </div>
              )}
            </div>

            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4 animate-pulse">
              Reabrindo câmera em instantes...
            </p>
            <button
              onClick={reiniciarManualmente}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
            >
              <RefreshCcw className="w-5 h-5" /> Pular e Escanear Agora
            </button>
          </motion.div>
        )}

        {/* Erro */}
        {status === "erro" && (
          <motion.div
            key="error"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md text-center bg-red-950/40 backdrop-blur-xl border border-red-900 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-10"
          >
            <div className="bg-red-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-500/30">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-red-500">
              Operação Negada
            </h2>

            <div className="bg-red-950/50 rounded-2xl p-6 mb-8 border border-red-900/50">
              <p className="text-red-200 font-medium text-sm leading-relaxed">
                {erroMsg}
              </p>
            </div>

            <p className="text-red-500/50 text-xs uppercase tracking-widest mb-4 animate-pulse">
              Reabrindo câmera em instantes...
            </p>
            <button
              onClick={reiniciarManualmente}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-red-900/20"
            >
              <RefreshCcw className="w-5 h-5" /> Tentar Novamente Agora
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
