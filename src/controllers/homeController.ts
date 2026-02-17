import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HomeService } from "../models/services/homeService";

export function useHomeController() {
  const navigate = useNavigate();

  // Estados Gerais
  const [user, setUser] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [estoque, setEstoque] = useState<number>(0);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);
  const [produtoAtivo, setProdutoAtivo] = useState<any>(null);

  // Estados de Gamificação
  const [brasasDisponiveis, setBrasasDisponiveis] = useState(0);
  const [usarResgate, setUsarResgate] = useState(false);

  // Estados de Fluxo e Pagamento
  const [etapa, setEtapa] = useState<"produto" | "pagamento">("produto");
  const [copiado, setCopiado] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [pedidoPago, setPedidoPago] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [detalhesFinais, setDetalhesFinais] = useState<any>(null);

  // Horário de Funcionamento
  const agora = new Date();
  const horaAtual = agora.getHours();
  const estaAberto = horaAtual >= 7 && horaAtual < 22;

  // Carrega dados iniciais
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const session = await HomeService.getSession();
        setUser(session?.user || null);

        const produto = await HomeService.getProdutoAtivo();
        if (produto) {
          setProdutoAtivo(produto);
          setEstoque(produto.estoque_atual);
        }
        setCarregandoEstoque(false);

        // Calcula Brasas
        if (session?.user && produto) {
          const precoBase = Number(produto.preco);
          const pedidosUsuario = await HomeService.getPedidosUsuario(session.user.id);

          const valorGasto = pedidosUsuario
            .filter((p) => p.status === "RETIRADO")
            .reduce((acc, curr) => acc + Number(curr.valor_total), 0);

          const brasasGeradas = Math.floor(valorGasto / precoBase);

          const pedidosIds = pedidosUsuario.map((p) => p.id);
          const resgatesUsados = await HomeService.getItensGratis(pedidosIds);

          setBrasasDisponiveis(brasasGeradas - resgatesUsados * 10);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setCarregandoEstoque(false);
      }
    }
    carregarDadosIniciais();
  }, []);

  // Escuta o Realtime para pagamento
  useEffect(() => {
    if (!pedidoId || etapa !== "pagamento") return;

    const canal = supabase
      .channel(`status_pedido_${pedidoId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${pedidoId}` }, (payload) => {
        if (payload.new.status === "PAGO") {
          setDetalhesFinais(payload.new);
          setPedidoPago(true);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [pedidoId, etapa]);

  // Matemática de compra
  const precoUnitario = produtoAtivo ? Number(produtoAtivo.preco) : 0;
  const quantidadeCobrada = usarResgate ? Math.max(0, quantidade - 1) : quantidade;
  const total = quantidadeCobrada * precoUnitario;
  const totalFormatado = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const gerarPedido = async () => {
    if (!user) return navigate("/login");
    if (quantidade > estoque) return alert("Quantidade maior que o estoque disponível!");

    setProcessando(true);
    try {
      const statusInicial = total === 0 ? "PAGO" : "AGUARDANDO_PAGAMENTO";

      // 1. Cria Pedido
      const pedido = await HomeService.criarPedido(user.id, total, statusInicial);
      setPedidoId(pedido.id);

      // 2. Insere Itens
      if (produtoAtivo) {
        const itensParaInserir = [];
        if (quantidadeCobrada > 0) {
          itensParaInserir.push({ pedido_id: pedido.id, produto_id: produtoAtivo.id, quantidade: quantidadeCobrada, preco_unitario_congelado: precoUnitario });
        }
        if (usarResgate) {
          itensParaInserir.push({ pedido_id: pedido.id, produto_id: produtoAtivo.id, quantidade: 1, preco_unitario_congelado: 0 });
        }
        if (itensParaInserir.length > 0) {
          await HomeService.inserirItensPedido(itensParaInserir);
        }
      }

      // 3. Pulo do PIX (Brinde)
      if (total === 0) {
        setDetalhesFinais(pedido);
        setPedidoPago(true);
        setEtapa("pagamento");
        setBrasasDisponiveis((prev) => prev - 10);
        return;
      }

      // 4. Gera PIX
      const pixData = await HomeService.gerarPixFunction(pedido.id, total, user.email);
      await HomeService.salvarPixNoPedido(pedido.id, pixData.pix_copia_cola, pixData.qr_code_base64);

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

  return {
    navigate, user, quantidade, setQuantidade, estoque, carregandoEstoque,
    brasasDisponiveis, usarResgate, setUsarResgate, etapa, setEtapa,
    copiado, processando, pedidoPago, pedidoId, qrCodeBase64, detalhesFinais,
    estaAberto, precoUnitario, total, totalFormatado, gerarPedido, copiarPix
  };
}