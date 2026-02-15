import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function BotaoInstalarApp() {
  const [promptInstalacao, setPromptInstalacao] = useState<any>(null);

  useEffect(() => {
    // Escuta o evento do navegador que avisa que o app pode ser instalado
    const handler = (e: Event) => {
      e.preventDefault(); // Impede o banner padrão feio do navegador
      setPromptInstalacao(e); // Salva o evento para usarmos no botão
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const instalarApp = async () => {
    if (!promptInstalacao) return;
    
    // Mostra a janela nativa de instalação do celular
    promptInstalacao.prompt();
    
    const { outcome } = await promptInstalacao.userChoice;
    if (outcome === "accepted") {
      console.log("Usuário instalou o BrasaPrimal!");
    }
    setPromptInstalacao(null);
  };

  // Se o prompt não estiver pronto (ex: usuário já instalou ou está no iPhone), não mostra o botão
  if (!promptInstalacao) return null;

  return (
    <button 
      onClick={instalarApp}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-bounce"
    >
      <Download className="w-5 h-5" />
      Instalar App BrasaExpress
    </button>
  );
}