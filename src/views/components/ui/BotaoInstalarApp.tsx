import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BotaoInstalarApp() {
  const [promptInstalacao, setPromptInstalacao] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as any).standalone);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) return; // Se já instalou, não faz mais nada

    // Detecta se é um dispositivo Apple (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIpadIphone =
      /macintosh|iphone|ipad|ipod/.test(userAgent) &&
      window.navigator.maxTouchPoints > 1;

    if (isIpadIphone) {
      setIsIOS(true);
    }

    // Escuta o evento de instalação para Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptInstalacao(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const instalarAndroid = async () => {
    if (!promptInstalacao) return;
    promptInstalacao.prompt();
    const { outcome } = await promptInstalacao.userChoice;
    if (outcome === "accepted") {
      setPromptInstalacao(null);
    }
  };

  if (isStandalone) return null; // Não exibe se já for o App
  if (!promptInstalacao && !isIOS) return null; // Não exibe em navegadores não suportados

  return (
    <>
      {/* Botão Flutuante (Android ou iOS) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-max">
        <button
          onClick={isIOS ? () => setShowIOSModal(true) : instalarAndroid}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-xl shadow-orange-600/30 flex items-center gap-2 animate-bounce transition-all active:scale-95"
        >
          <Download className="w-5 h-5" />
          Baixar App Brasa Primal
        </button>
      </div>

      {/* Modal de Instrução Exclusivo para iOS */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm pb-10">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative"
            >
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black mb-4">Instalar no iPhone</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Para instalar o Brasa Primal no seu iPhone ou iPad, siga estes
                passos rápidos:
              </p>

              <ol className="space-y-4 text-sm font-medium">
                <li className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <Share className="w-5 h-5 text-blue-500" />
                  <span>
                    1. Toque em <strong>Compartilhar</strong> na barra do
                    Safari.
                  </span>
                </li>
                <li className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <PlusSquare className="w-5 h-5 text-zinc-300" />
                  <span>
                    2. Role para baixo e selecione{" "}
                    <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </li>
              </ol>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
