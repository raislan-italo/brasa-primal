import { useState, useEffect } from "react";
import { AdminService } from "../models/services/adminService";

// Tipagens
export type Pedido = {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  profiles: { nome: string; telefone: string } | null;
  itens_pedido: { quantidade: number }[];
};

export type Produto = {
  id: string;
  nome: string;
  preco: number;
  estoque_atual: number;
  ativo: boolean;
};

export function useAdmin() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "pedidos" | "produtos" | "clientes">("dashboard");
  const [loading, setLoading] = useState(true);

  // Dados
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // KPIs
  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
  const [sacosVendidos, setSacosVendidos] = useState(0);

  // Estados do Modal de Produtos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({ nome: "", preco: 0, estoque_atual: 0, ativo: true });

  const carregarDadosGlobais = async () => {
    setLoading(true);
    try {
      const [dataPedidos, dataProdutos] = await Promise.all([
        AdminService.getPedidos(),
        AdminService.getProdutos()
      ]);

      const listaPedidos = dataPedidos as unknown as Pedido[];
      setPedidos(listaPedidos);
      setProdutos(dataProdutos as Produto[]);

      // Processar KPIs Diários
      const hojeStr = new Date().toLocaleDateString("pt-BR");
      const pedidosHoje = listaPedidos.filter(
        (p) => new Date(p.created_at).toLocaleDateString("pt-BR") === hojeStr &&
          (p.status === "PAGO" || p.status === "RETIRADO")
      );

      setFaturamentoHoje(pedidosHoje.reduce((acc, p) => acc + Number(p.valor_total), 0));
      setSacosVendidos(pedidosHoje.reduce((acc, p) => acc + p.itens_pedido.reduce((sum, item) => sum + item.quantidade, 0), 0));

    } catch (error: any) {
      console.error("Erro no Admin:", error.message);
      alert("Falha ao carregar dados do painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosGlobais();
  }, []);

  // Ações de Pedidos
  const aprovarPagamento = async (pedidoId: string) => {
    if (!window.confirm("Confirmar recebimento do PIX?")) return;
    try {
      await AdminService.aprovarPagamentoPix(pedidoId);
      carregarDadosGlobais();
    } catch (err: any) {
      alert("Erro ao aprovar PIX: " + err.message);
    }
  };

  // Ações de Produtos
  const abrirModal = (p?: Produto) => {
    if (p) {
      setEditando(p);
      setFormData({ nome: p.nome, preco: Number(p.preco), estoque_atual: p.estoque_atual, ativo: p.ativo });
    } else {
      setEditando(null);
      setFormData({ nome: "", preco: 0, estoque_atual: 0, ativo: true });
    }
    setIsModalOpen(true);
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AdminService.salvarProduto(formData, editando?.id);
      setIsModalOpen(false);
      carregarDadosGlobais();
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    }
  };

  const deletarProduto = async (id: string) => {
    if (!window.confirm("Excluir produto permanentemente?")) return;
    try {
      await AdminService.deletarProduto(id);
      carregarDadosGlobais();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // Processamento do Gráfico
  const dadosGrafico = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    const total = pedidos
      .filter((p) => new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) === label && (p.status === "PAGO" || p.status === "RETIRADO"))
      .reduce((acc, curr) => acc + Number(curr.valor_total), 0);

    return { data: label, total };
  });

  return {
    activeTab, setActiveTab, loading, pedidos, produtos,
    faturamentoHoje, sacosVendidos, isModalOpen, setIsModalOpen,
    editando, formData, setFormData,
    carregarDadosGlobais, aprovarPagamento, abrirModal, salvarProduto, deletarProduto, dadosGrafico
  };
}