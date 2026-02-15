import { useEffect, useState } from "react";
import {
  Flame,
  MapPin,
  Zap,
  User,
  ShoppingBag,
  Plus,
  Minus,
  Star,
  CheckCircle2,
  Copy,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Leaf,
  Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BotaoInstalarApp from "./components/BotaoInstalarApp";
import { scaleIn, fadeUp } from "../animation";
import { supabase } from "../app/lib/supabase";
import QRCode from "react-qr-code";

export default function HomeVitrine() {
  const navigate = useNavigate();

  // Estados gerais
  const [user, setUser] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [estoque, setEstoque] = useState<number>(0);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);

  // Estados de gamificação
  const [brasasDisponiveis, setBrasasDisponiveis] = useState(0);
  const [usarResgate, setUsarResgate] = useState(false);

  // Estados de fluxo de pagamento
  const [etapa, setEtapa] = useState<"produto" | "pagamento">("produto");
  const [copiado, setCopiado] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [pedidoPago, setPedidoPago] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [detalhesFinais, setDetalhesFinais] = useState<any>(null);
  const [produtoAtivo, setProdutoAtivo] = useState<any>(null);

  // Horário de funcionamento
  const agora = new Date();
  const horaAtual = agora.getHours();
  const estaAberto = horaAtual >= 7 && horaAtual < 22;

  // Carrega dados, Estoque e gamificação
  useEffect(() => {
    async function carregarDadosIniciais() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Busca produto e estoque
      const { data: produto } = await supabase
        .from("produtos")
        .select("id, nome, preco, estoque_atual")
        .eq("ativo", true)
        .limit(1)
        .single();

      if (produto) {
        setProdutoAtivo(produto);
        setEstoque(produto.estoque_atual);
      }
      setCarregandoEstoque(false);

      // Calcula Brasas se estiver logado
      if (session?.user && produto) {
        const precoBase = Number(produto.preco);

        // Puxa pedidos para saber o total gasto
        const { data: pedidosUsuario } = await supabase
          .from("pedidos")
          .select("id, valor_total, status")
          .eq("user_id", session.user.id);

        const valorGasto = (pedidosUsuario || [])
          .filter((p) => p.status === "RETIRADO")
          .reduce((acc, curr) => acc + Number(curr.valor_total), 0);

        const brasasGeradas = Math.floor(valorGasto / precoBase);

        // Conta os brindes já usados (itens com preço 0)
        let resgatesUsados = 0;
        const pedidosIds = pedidosUsuario?.map((p) => p.id) || [];

        if (pedidosIds.length > 0) {
          const { data: itensGratis } = await supabase
            .from("itens_pedido")
            .select("quantidade")
            .in("pedido_id", pedidosIds)
            .eq("preco_unitario_congelado", 0);

          resgatesUsados = (itensGratis || []).reduce(
            (acc, curr) => acc + Number(curr.quantidade),
            0,
          );
        }

        setBrasasDisponiveis(brasasGeradas - resgatesUsados * 10);
      }
    }
    carregarDadosIniciais();
  }, []);

  // Escuta o realtime
  useEffect(() => {
    if (!pedidoId || etapa !== "pagamento") return;

    const canal = supabase
      .channel(`status_pedido_${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          if (payload.new.status === "PAGO") {
            setDetalhesFinais(payload.new);
            setPedidoPago(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [pedidoId, etapa]);

  // Matemática de compra
  const precoUnitario = produtoAtivo ? Number(produtoAtivo.preco) : 0;

  // Se usar resgate, desconta 1 saco do valor pago
  const quantidadeCobrada = usarResgate
    ? Math.max(0, quantidade - 1)
    : quantidade;
  const total = quantidadeCobrada * precoUnitario;

  const totalFormatado = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Lógica de compra e inserção inteligente
  const gerarPedido = async () => {
    if (!user) return navigate("/login");
    if (quantidade > estoque)
      return alert("Quantidade maior que o estoque disponível!");

    setProcessando(true);
    try {
      const statusInicial = total === 0 ? "PAGO" : "AGUARDANDO_PAGAMENTO";

      // Cria o Pedido
      const { data: pedido, error: errPedido } = await supabase
        .from("pedidos")
        .insert({
          user_id: user.id,
          valor_total: total,
          status: statusInicial,
        })
        .select()
        .single();

      if (errPedido) throw errPedido;
      setPedidoId(pedido.id);

      // Insere os Itens separados (O Pago e o Brinde)
      if (produtoAtivo) {
        const itensParaInserir = [];

        // Insere os sacos pagos
        if (quantidadeCobrada > 0) {
          itensParaInserir.push({
            pedido_id: pedido.id,
            produto_id: produtoAtivo.id,
            quantidade: quantidadeCobrada,
            preco_unitario_congelado: precoUnitario,
          });
        }

        // Insere o saco grátis
        if (usarResgate) {
          itensParaInserir.push({
            pedido_id: pedido.id,
            produto_id: produtoAtivo.id,
            quantidade: 1,
            preco_unitario_congelado: 0,
          });
        }

        if (itensParaInserir.length > 0) {
          const { error: errItens } = await supabase
            .from("itens_pedido")
            .insert(itensParaInserir);
          if (errItens) throw errItens;
        }
      }

      // Lógica de Pulo do PIX
      if (total === 0) {
        setDetalhesFinais(pedido);
        setPedidoPago(true);
        setEtapa("pagamento");
        setProcessando(false);

        // Atualiza a tela localmente para evitar bugs de state
        setBrasasDisponiveis((prev) => prev - 10);
        return;
      }

      // Chama a Edge Function para gerar o PIX
      const { data: pixData, error: errPix } = await supabase.functions.invoke(
        "criar-pix",
        {
          body: {
            pedido_id: pedido.id,
            valor_total: total,
            email_cliente: user.email,
          },
        },
      );

      if (errPix || !pixData.sucesso) throw new Error("Erro ao gerar PIX");

      // NOVO: Salva os dados do PIX no pedido para ele nunca mais perder
      await supabase
        .from("pedidos")
        .update({
          pix_copia_cola: pixData.pix_copia_cola,
          qr_code_base64: pixData.qr_code_base64,
        })
        .eq("id", pedido.id);

      setPixCopiaCola(pixData.pix_copia_cola);
      setQrCodeBase64(pixData.qr_code_base64);
      setEtapa("pagamento");
    } catch (error) {
      console.error(error);
      alert("Erro ao processar. Verifique sua conexão ou configuração.");
    } finally {
      setProcessando(false);
    }
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(pixCopiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden flex flex-col">
      <BotaoInstalarApp />

      <div className="bg-orange-600 overflow-hidden w-full py-2 shrink-0">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: "linear",
            repeatType: "loop",
          }}
          className="flex gap-8 whitespace-nowrap font-bold uppercase text-xs tracking-wider"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i}>
              🔥 Qualidade Primal • Retirada Rápida • 100% Natural
            </span>
          ))}
        </motion.div>
      </div>

      <nav
        className="w-full z-50 flex items-center justify-between
          py-2 sm:py-2.5 lg:py-3
          px-3 sm:px-6 lg:px-8
          bg-radial-[at_25%_25%] to-zinc-800 to-55%
          backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.35)]
          transform-gpu perspective-1000 rotate-x-0
          hover:rotate-x-1 transition-transform duration-300"
      >
        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <img
            src="/icon-192.png"
            alt="Brasa Primal"
            className="w-16 h-16 sm:w-16 sm:h-16 lg:w-30 lg:h-20
              object-contain transition-transform duration-300
              hover:scale-105 hover:-translate-y-1 shadow-md"
          />
          {/* nome sempre visível */}
          <span
            className="font-black
              text-lg sm:text-2xl lg:text-3xl
              text-white italic tracking-tight drop-shadow-md"
          >
            BRASA PRIMAL
          </span>
        </div>

        {/* Login / Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div
              onClick={() => navigate("/cliente")}
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-700 overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:-translate-y-1 shadow-md flex items-center justify-center bg-zinc-800"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 hover:bg-orange-400
              text-white font-bold
              py-1.5 px-3 sm:py-2 sm:px-5
              rounded-full shadow-md shadow-orange-500/25
              transition-transform duration-300
              hover:-translate-y-1 active:scale-95
              text-xs sm:text-sm"
            >
              Entrar
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12 lg:gap-16 items-center lg:grid-cols-2 mt-10 mb-20 flex-1 w-full">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex gap-2 bg-orange-500/10 px-4 py-1.5 rounded-full text-orange-400 text-sm font-medium border border-orange-500/20">
            <Zap className="w-4 h-4" /> Drive-Thru do Churrasco em Caxias
          </div>
          <h1 className="font-extrabold text-5xl lg:text-7xl leading-tight uppercase tracking-tighter">
            O Fogo Perfeito <br />
            <span className="text-orange-500">Sem Espera.</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto lg:mx-0 text-lg">
            A <strong>Brasa Primal</strong> fornece carvão premium selecionado
            com queima duradoura. Compre agora pelo site e retire em instantes
            no nosso estabelecimento.
          </p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2.5rem] space-y-5 max-w-sm mx-auto lg:mx-0 backdrop-blur-md"
          >
            <div className="flex items-start gap-4">
              <div className="bg-orange-500/10 p-3 rounded-2xl">
                <MapPin className="text-orange-500 w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-lg text-white">
                    Ponto de Retirada
                  </h4>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${estaAberto ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${estaAberto ? "bg-green-500" : "bg-red-500"}`}
                    />
                    {estaAberto ? "Aberto" : "Fechado"}
                  </div>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Volta Redonda, Caxias - MA
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                window.open(
                  "https://maps.app.goo.gl/f6MYZ6Bqx9TQZT3Q7",
                  "_blank",
                )
              }
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-3.5 rounded-xl text-sm font-bold transition"
            >
              <Zap className="w-4 h-4 text-orange-400" /> Abrir no GPS
            </button>
          </motion.div>
        </div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="show"
          className="w-full max-w-md mx-auto relative"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <AnimatePresence mode="wait">
              {etapa === "produto" ? (
                <motion.div
                  key="produto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col h-full"
                >
                  <div className="w-full h-48 bg-linear-to-b from-orange-500/10 to-transparent rounded-2xl mb-6 flex items-center justify-center border border-orange-500/10 relative">
                    <Flame className="w-20 h-20 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                    <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                      {carregandoEstoque ? (
                        <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                      ) : estoque > 0 ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
                          {estoque} disponíveis
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500" />{" "}
                          Esgotado
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-3xl font-black mb-1">
                    Saco de carvão primal
                  </h3>
                  <div className="flex text-orange-400 gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>

                  {/* PREÇO COM DESCONTO VISUAL */}
                  <div className="text-5xl font-black mb-6 tracking-tighter flex items-center gap-4">
                    R$ {total.toFixed(2).replace(".", ",")}
                    {usarResgate && (
                      <span className="text-2xl text-zinc-600 line-through font-medium mt-2">
                        R${" "}
                        {(quantidade * precoUnitario)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    )}
                  </div>

                  {/* CONTROLE DE QUANTIDADE */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-2xl mb-4 border transition-all ${estoque === 0 ? "opacity-50 pointer-events-none border-zinc-800 bg-zinc-950" : "border-zinc-700 bg-zinc-900/50"}`}
                  >
                    <button
                      onClick={() => {
                        setQuantidade(Math.max(1, quantidade - 1));
                        if (quantidade <= 1) setUsarResgate(false);
                      }}
                      disabled={quantidade <= 1 || estoque === 0}
                      className="p-4 hover:bg-zinc-800 disabled:opacity-30 rounded-xl transition"
                    >
                      <Minus />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-center">
                        {estoque === 0 ? 0 : quantidade}
                      </span>
                      {usarResgate && (
                        <span className="text-[10px] font-bold text-yellow-500 uppercase">
                          1 é Grátis
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setQuantidade(Math.min(estoque, quantidade + 1))
                      }
                      disabled={quantidade >= estoque || estoque === 0}
                      className="p-4 hover:bg-zinc-800 disabled:opacity-30 rounded-xl transition"
                    >
                      <Plus />
                    </button>
                  </div>

                  {/* TOGGLE DA RECOMPENSA */}
                  {brasasDisponiveis >= 10 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl mb-6 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="text-yellow-500 w-6 h-6" />
                        <div className="text-left">
                          <p className="font-bold text-yellow-500 text-sm leading-tight">
                            Saco Grátis Disponível!
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Você tem {brasasDisponiveis} brasas.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUsarResgate(!usarResgate)}
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 border ${usarResgate ? "bg-yellow-500 border-yellow-400" : "bg-zinc-800 border-zinc-700"}`}
                      >
                        <motion.div
                          animate={{ x: usarResgate ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full mt-0.5 shadow-sm"
                        />
                      </button>
                    </motion.div>
                  )}

                  <button
                    onClick={gerarPedido}
                    disabled={processando || estoque === 0 || !estaAberto}
                    className="w-full bg-orange-600 hover:bg-orange-500 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 mt-auto"
                  >
                    {processando ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ShoppingBag />
                    )}
                    {!estaAberto
                      ? "Fechado no Momento"
                      : estoque === 0
                        ? "Sem Estoque"
                        : processando
                          ? "Processando..."
                          : !user
                            ? "Fazer Login para Comprar"
                            : `Comprar ${totalFormatado}`}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="pagamento"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center text-center"
                >
                  {pedidoPago && detalhesFinais ? (
                    <div className="space-y-6 py-4 w-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic">
                          {total === 0
                            ? "Brinde Resgatado!"
                            : "Pagamento Confirmado!"}
                        </h3>
                      </div>
                      <div className="bg-white p-4 rounded-3xl mx-auto w-fit shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                        <QRCode
                          value={`https://brasa-express.vercel.app/admin/entrega/${pedidoId}`}
                          size={160}
                        />
                        <div className="text-zinc-950 font-black text-[10px] mt-2 uppercase text-center border-t border-zinc-100 pt-2">
                          Ticket: {pedidoId?.slice(0, 8)}
                        </div>
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2 text-left w-full">
                        <div className="flex justify-between font-bold text-sm">
                          <span>Saco de carvão (x{quantidade})</span>
                          <span className="text-orange-500">
                            R$ {totalFormatado}
                          </span>
                        </div>
                        <p className="text-[14px] text-white/90 text-center font-bold">
                          Apresente este QR Code na fábrica
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          window.open(
                            "https://maps.app.goo.gl/f6MYZ6Bqx9TQZT3Q7",
                            "_blank",
                          )
                        }
                        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 py-4 rounded-xl font-bold text-sm transition shadow-lg shadow-orange-600/20 mt-4"
                      >
                        <MapPin className="w-5 h-5" /> Abrir GPS para Retirada
                      </button>

                      <button
                        onClick={() => navigate("/cliente")}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-xl font-bold transition mt-2"
                      >
                        Ver meus pedidos
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-black mb-1">
                        Total: {totalFormatado}
                      </h3>
                      <p className="text-zinc-500 text-sm mb-6">
                        Escaneie no app do banco.
                      </p>
                      <div className="bg-white p-4 rounded-3xl mb-6">
                        <img
                          src={`data:image/png;base64,${qrCodeBase64}`}
                          className="w-48 h-48"
                        />
                      </div>
                      <button
                        onClick={copiarPix}
                        className="w-full bg-zinc-950 border border-zinc-800 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 hover:bg-zinc-900 transition"
                      >
                        {copiado ? (
                          <CheckCircle2 className="text-green-500" />
                        ) : (
                          <Copy />
                        )}{" "}
                        {copiado ? "Copiado!" : "Copiar PIX"}
                      </button>
                      <button
                        onClick={() => {
                          setEtapa("produto");
                          setUsarResgate(false);
                        }}
                        className="mt-4 text-zinc-500 hover:text-white underline text-sm transition"
                      >
                        <ArrowLeft className="w-4 h-4 inline" /> Voltar
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* SEÇÃO DE BENEFÍCIOS (MANTIDA) */}
      <section className="bg-zinc-900 border-t border-zinc-800 py-16 w-full shrink-0">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="text-orange-500 w-7 h-7" />
            </div>
            <h4 className="font-bold text-lg">Qualidade Primal</h4>
            <p className="text-zinc-400 text-sm">
              Pedaços grandes, menos poeira e alto poder calorífico para o seu
              churrasco render mais.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="text-orange-500 w-7 h-7" />
            </div>
            <h4 className="font-bold text-lg">Drive-Thru Ágil</h4>
            <p className="text-zinc-400 text-sm">
              Pagou no app, apresentou o QR Code e o carvão já está no
              porta-malas em segundos.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Leaf className="text-orange-500 w-7 h-7" />
            </div>
            <h4 className="font-bold text-lg">100% Ecológico</h4>
            <p className="text-zinc-400 text-sm">
              Produzido com madeira de reflorestamento, respeitando o meio
              ambiente.
            </p>
          </div>
        </div>
      </section>

      {/* RODAPÉ PROFISSIONAL (MANTIDO) */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10 w-full shrink-0 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-600 w-6 h-6" />
            <span className="font-black text-xl italic tracking-tighter">
              BRASA PRIMAL
            </span>
          </div>
          <div className="text-center md:text-right text-zinc-500 text-xs space-y-1">
            <p>
              © {new Date().getFullYear()} Brasa Primal. Todos os direitos
              reservados.
            </p>
            <p>Desenvolvido por Raislan Ítalo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
