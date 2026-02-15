/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  LogOut,
  Package,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  Loader2,
  ChevronRight,
  User,
  Settings,
  Phone,
  Save,
  Camera,
  Gift,
  Sparkles,
  ShoppingBag,
  Copy,
  Download,
} from "lucide-react";

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pedidos" | "perfil">("pedidos");

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);
  const [pixCopiadoId, setPixCopiadoId] = useState<string | null>(null); // Estado para o botão de cópia no painel

  const [brasasDisponiveis, setBrasasDisponiveis] = useState(0);
  const [recompensasUsadas, setRecompensasUsadas] = useState(0);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState({ tipo: "", texto: "" });

  const PRECO_CARVAO = 1; // Usando os valores do seu teste atual
  const META_BRASAS = 2;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return navigate("/login");
      setUser(session.user);
      setNome(session.user.user_metadata?.nome_completo || "");
      setTelefone(session.user.user_metadata?.telefone || "");
      setAvatarUrl(session.user.user_metadata?.avatar_url || null);

      const { data: pedidosData, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPedidos(pedidosData || []);

      const pedidosIds = pedidosData?.map((p) => p.id) || [];
      let qtdResgatada = 0;
      if (pedidosIds.length > 0) {
        const { data: itensGratis } = await supabase
          .from("itens_pedido")
          .select("quantidade")
          .in("pedido_id", pedidosIds)
          .eq("preco_unitario_congelado", 0);
        qtdResgatada = (itensGratis || []).reduce(
          (acc, curr) => acc + Number(curr.quantidade),
          0,
        );
      }
      setRecompensasUsadas(qtdResgatada);

      const valorTotalGasto = (pedidosData || [])
        .filter((p) => p.status === "RETIRADO")
        .reduce((acc, curr) => acc + Number(curr.valor_total), 0);
      const brasasGeradas = Math.floor(valorTotalGasto / PRECO_CARVAO);
      setBrasasDisponiveis(brasasGeradas - qtdResgatada * META_BRASAS);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const canal = supabase
      .channel("realtime_pedidos_cliente")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          carregarDados();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [user]);

  // FUNÇÃO DE DOWNLOAD DO TICKET (Para agilizar a retirada)
  const baixarTicket = (pedidoId: string) => {
    const node = document.getElementById(`qr-${pedidoId}`);
    if (!node) return;
    const svg = node.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 100;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        ctx.textAlign = "center";
        ctx.fillStyle = "#09090b";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("BRASA PRIMAL", canvas.width / 2, img.height + 50);
        ctx.fillStyle = "#52525b";
        ctx.font = "14px monospace";
        ctx.fillText(
          `Ticket: #${pedidoId.slice(0, 8)}`,
          canvas.width / 2,
          img.height + 75,
        );

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `Ticket-Brasa-${pedidoId.slice(0, 8)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Funções de Perfil mantidas
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0)
        throw new Error("Você deve selecionar uma imagem.");
      const file = event.target.files[0];
      const fileName = `${user.id}-${Math.random()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      setMensagemPerfil({ tipo: "sucesso", texto: "Foto atualizada!" });
      setTimeout(() => setMensagemPerfil({ tipo: "", texto: "" }), 3000);
    } catch (error: any) {
      setMensagemPerfil({ tipo: "erro", texto: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const atualizarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    try {
      await supabase.auth.updateUser({
        data: { nome_completo: nome, telefone: telefone },
      });
      setMensagemPerfil({ tipo: "sucesso", texto: "Perfil atualizado!" });
      setTimeout(() => setMensagemPerfil({ tipo: "", texto: "" }), 3000);
    } catch (error: any) {
      setMensagemPerfil({ tipo: "erro", texto: error.message });
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length > 2) valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    if (valor.length > 10) valor = `${valor.slice(0, 10)}-${valor.slice(10)}`;
    setTelefone(valor);
  };

  const formatarData = (dataISO: string) =>
    new Date(dataISO).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderStatusBadge = (status: string, valor: number) => {
    if (valor === 0 && status === "PAGO")
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
          <Sparkles className="w-3 h-3 shrink-0" /> Grátis Liberado
        </span>
      );
    switch (status) {
      case "PAGO":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />{" "}
            Liberado
          </span>
        );
      case "RETIRADO":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> Entregue
          </span>
        );
      case "AGUARDANDO_PAGAMENTO":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Clock className="w-3 h-3 shrink-0" /> Pendente
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-3 h-3 shrink-0" /> Cancelado
          </span>
        );
    }
  };

  const recompensasDisponiveis = Math.floor(brasasDisponiveis / META_BRASAS);
  const progressoAtual = brasasDisponiveis % META_BRASAS;
  const progressoPorcentagem = (progressoAtual / META_BRASAS) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-3 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-72 h-72 sm:w-96 sm:h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10 w-full">
        <header className="flex items-center justify-between mb-6 mt-2 sm:mt-4">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex flex-col items-center truncate px-2">
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-1 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <h1 className="text-base sm:text-xl font-black tracking-tight uppercase italic truncate">
              Brasa Primal
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all shadow-lg shrink-0"
            title="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-6 border border-zinc-800/80 backdrop-blur-md relative mx-auto w-full max-w-75 sm:max-w-sm">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded-xl transition-all duration-300 ease-in-out shadow-md ${activeTab === "pedidos" ? "left-1" : "left-[calc(50%+2px)]"}`}
          />
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`flex-1 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold z-10 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${activeTab === "pedidos" ? "text-white" : "text-zinc-500"}`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Pedidos
          </button>
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex-1 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold z-10 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${activeTab === "perfil" ? "text-white" : "text-zinc-500"}`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Perfil
          </button>
        </div>

        <div className="min-h-100 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
              <p className="text-zinc-500 font-medium text-sm">Carregando...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "pedidos" && (
                <motion.div
                  key="pedidos"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-orange-500/20 rounded-3xl p-5 sm:p-6 mb-8 shadow-[0_0_40px_rgba(234,88,12,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Flame className="w-24 h-24 text-orange-500" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black italic flex items-center gap-2 text-white">
                          <Flame className="w-5 h-5 text-orange-500" /> Clube
                          Primal
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                          Sua lealdade vira carvão.
                        </p>
                      </div>
                      {recompensasUsadas > 0 && (
                        <div className="flex flex-col items-end sm:flex">
                          <div className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Gift className="w-3 h-3" /> {recompensasUsadas} Já
                            Resgatados
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10">
                      {recompensasDisponiveis > 0 && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/20 p-2 rounded-lg">
                              <Gift className="text-yellow-500 w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-yellow-500 text-sm leading-tight">
                                Você tem {recompensasDisponiveis} Saco(s)
                                Grátis!
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                Adicione no carrinho na sua próxima compra.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate("/")}
                            className="w-full sm:w-auto whitespace-nowrap bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
                          >
                            <ShoppingBag className="w-4 h-4" /> Usar na Loja
                          </button>
                        </motion.div>
                      )}
                      <div className="flex justify-between text-xs sm:text-sm font-bold mb-2">
                        <span className="text-orange-500">
                          {progressoAtual} Brasas
                        </span>
                        <span className="text-zinc-500">{META_BRASAS}</span>
                      </div>
                      <div className="h-3 sm:h-4 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressoPorcentagem}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-linear-to-r from-orange-600 to-yellow-400 rounded-full relative"
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-500 mt-3 text-center">
                        Faltam{" "}
                        <strong className="text-white">
                          {META_BRASAS - progressoAtual} sacos comprados
                        </strong>{" "}
                        para a próxima recompensa.
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 sm:mb-6 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Meus Pedidos
                    </h2>
                  </div>

                  {pedidos.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center mx-2 sm:mx-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold mb-2">
                        Nenhum pedido
                      </h3>
                      <p className="text-zinc-500 text-xs sm:text-sm mb-6 max-w-62.5">
                        Você ainda não garantiu o carvão do seu churrasco.
                      </p>
                      <button
                        onClick={() => navigate("/")}
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm"
                      >
                        Ir para a Loja
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {pedidos.map((pedido) => (
                        <div
                          key={pedido.id}
                          className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-[1.25rem] sm:rounded-2xl overflow-hidden transition-all mx-1 sm:mx-0"
                        >
                          <div
                            onClick={() =>
                              setPedidoExpandido(
                                pedidoExpandido === pedido.id
                                  ? null
                                  : pedido.id,
                              )
                            }
                            className="p-3.5 sm:p-5 flex items-center justify-between cursor-pointer active:bg-zinc-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 w-full pr-2">
                              <div
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${Number(pedido.valor_total) === 0 ? "bg-yellow-500/10" : pedido.status === "PAGO" ? "bg-orange-500/10" : "bg-zinc-800"}`}
                              >
                                {Number(pedido.valor_total) === 0 ? (
                                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                                ) : (
                                  <Package
                                    className={`w-5 h-5 sm:w-6 sm:h-6 ${pedido.status === "PAGO" ? "text-orange-500" : "text-zinc-500"}`}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <span className="font-mono text-zinc-400 text-[10px] sm:text-xs">
                                    #{pedido.id.slice(0, 8)}
                                  </span>
                                  {renderStatusBadge(
                                    pedido.status,
                                    Number(pedido.valor_total),
                                  )}
                                </div>
                                <div
                                  className={`font-bold text-sm sm:text-base ${Number(pedido.valor_total) === 0 ? "text-yellow-500" : "text-white"}`}
                                >
                                  {Number(pedido.valor_total) === 0
                                    ? "Brinde Exclusivo"
                                    : `R$ ${Number(pedido.valor_total).toFixed(2).replace(".", ",")}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[10px] sm:text-xs text-zinc-500">
                                {formatarData(pedido.created_at)}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 transition-transform ${pedidoExpandido === pedido.id ? "rotate-90" : ""}`}
                              />
                            </div>
                          </div>

                          <AnimatePresence>
                            {pedidoExpandido === pedido.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-zinc-800/50"
                              >
                                <div className="p-4 sm:p-6 bg-zinc-950/30 flex flex-col items-center">
                                  {pedido.status === "PAGO" ? (
                                    <>
                                      <p className="text-[11px] sm:text-sm text-zinc-400 mb-3 sm:mb-4 text-center max-w-62.5">
                                        Apresente este QR Code na fábrica para
                                        retirar seu pedido.
                                      </p>

                                      {/* QR CODE COM ID PARA O DOWNLOAD */}
                                      <div
                                        id={`qr-${pedido.id}`}
                                        className={`p-3 sm:p-4 rounded-3xl mb-2 ${Number(pedido.valor_total) === 0 ? "bg-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.2)]" : "bg-white shadow-[0_0_30px_rgba(234,88,12,0.15)]"}`}
                                      >
                                        <QRCode
                                          value={`https://brasa-express.vercel.app/admin/entrega/${pedido.id}`}
                                          size={130}
                                          className="sm:w-35 sm:h-35"
                                        />
                                      </div>

                                      {/* BOTÃO DE DOWNLOAD DO TICKET */}
                                      <button
                                        onClick={() => baixarTicket(pedido.id)}
                                        className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-bold uppercase py-2.5 px-5 rounded-full border border-zinc-800 bg-zinc-900/50 transition-colors mt-2 mb-4"
                                      >
                                        <Download className="w-4 h-4" /> Baixar
                                        Ticket
                                      </button>
                                    </>
                                  ) : pedido.status === "RETIRADO" ? (
                                    <div className="text-center py-4 sm:py-6">
                                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-2" />
                                      <p className="text-zinc-400 text-xs sm:text-sm font-medium">
                                        Retirado em{" "}
                                        {formatarData(
                                          pedido.entregue_em ||
                                            pedido.updated_at,
                                        )}
                                        .
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 sm:py-6 w-full flex flex-col items-center">
                                      <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2 animate-pulse" />
                                      <p className="text-zinc-400 text-xs sm:text-sm font-medium mb-4">
                                        Aguardando pagamento do PIX.
                                      </p>

                                      {/* MOSTRANDO O PIX NO PAINEL PARA O CLIENTE PAGAR */}
                                      {pedido.qr_code_base64 &&
                                        pedido.pix_copia_cola && (
                                          <div className="w-full max-w-62.5 mx-auto space-y-4">
                                            <div className="bg-white p-3 rounded-2xl shadow-lg inline-block">
                                              <img
                                                src={`data:image/png;base64,${pedido.qr_code_base64}`}
                                                alt="QR Code PIX"
                                                className="w-full h-auto"
                                              />
                                            </div>
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(
                                                  pedido.pix_copia_cola,
                                                );
                                                setPixCopiadoId(pedido.id);
                                                setTimeout(
                                                  () => setPixCopiadoId(null),
                                                  3000,
                                                );
                                              }}
                                              className="w-full bg-zinc-900 border border-zinc-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition hover:bg-zinc-800 text-sm"
                                            >
                                              {pixCopiadoId === pedido.id ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                              ) : (
                                                <Copy className="w-4 h-4" />
                                              )}
                                              {pixCopiadoId === pedido.id
                                                ? "Copiado!"
                                                : "Copiar PIX"}
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ABA 2: PERFIL */}
              {activeTab === "perfil" && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 sm:mb-6 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Meus Dados
                    </h2>
                    <p className="text-zinc-500 text-xs sm:text-sm">
                      Atualize sua foto e contato.
                    </p>
                  </div>
                  <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-3xl sm:rounded-4xl p-4 sm:p-8 mx-1 sm:mx-0">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-zinc-800/50 text-center sm:text-left">
                      <div className="relative inline-block shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 overflow-hidden shadow-xl mx-auto">
                          {uploadingAvatar ? (
                            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-spin" />
                          ) : avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-lg border-2 border-zinc-900">
                          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={uploadAvatar}
                            disabled={uploadingAvatar}
                          />
                        </label>
                      </div>
                      <div className="w-full overflow-hidden">
                        <div className="font-bold text-lg sm:text-xl truncate">
                          {nome || "Usuário Primal"}
                        </div>
                        <div className="text-zinc-500 text-[13px] sm:text-sm truncate">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    {mensagemPerfil.texto && (
                      <div
                        className={`p-3 rounded-xl text-xs sm:text-sm font-medium text-center mb-5 sm:mb-6 ${mensagemPerfil.tipo === "sucesso" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
                      >
                        {mensagemPerfil.texto}
                      </div>
                    )}
                    <form
                      onSubmit={atualizarPerfil}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Nome Completo"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 text-sm sm:text-base"
                        />
                      </div>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-3.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                          type="tel"
                          placeholder="WhatsApp (com DDD)"
                          required
                          value={telefone}
                          onChange={handleTelefoneChange}
                          maxLength={15}
                          className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 text-sm sm:text-base"
                        />
                      </div>
                      <div className="pt-2 sm:pt-4">
                        <button
                          type="submit"
                          disabled={salvandoPerfil}
                          className="w-full bg-zinc-800 active:bg-zinc-700 disabled:opacity-50 text-white font-bold py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm sm:text-base"
                        >
                          {salvandoPerfil ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}{" "}
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
