import { useEffect, useState } from "react";
import {
  Flame,
  RefreshCcw,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Tag,
  Plus,
  Edit,
  Trash2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase"; // Ajuste se seu caminho for diferente
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 1. Tipagem Robusta
type Pedido = {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  profiles: { nome: string; telefone: string } | null;
  itens_pedido: { quantidade: number }[];
};

type Produto = {
  id: string;
  nome: string;
  preco: number;
  estoque_atual: number;
  ativo: boolean;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "pedidos" | "produtos" | "clientes"
  >("dashboard");
  const [loading, setLoading] = useState(true);

  // Estados de Dados
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // KPIs
  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
  const [sacosVendidos, setSacosVendidos] = useState(0);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    preco: 0,
    estoque_atual: 0,
    ativo: true,
  });

  useEffect(() => {
    carregarDadosGlobais();
  }, []);

  const carregarDadosGlobais = async () => {
    setLoading(true);
    try {
      // A. Busca Pedidos com Join nas tabelas certas
      const { data: dataPedidos, error: errPedidos } = await supabase
        .from("pedidos")
        .select(
          `
          id, created_at, status, valor_total, 
          profiles (nome, telefone), 
          itens_pedido (quantidade)
        `,
        )
        .order("created_at", { ascending: false });

      if (errPedidos) throw errPedidos;
      const listaPedidos = dataPedidos as unknown as Pedido[];
      setPedidos(listaPedidos);

      // B. Busca Produtos
      const { data: dataProdutos, error: errProdutos } = await supabase
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });

      if (errProdutos) throw errProdutos;
      setProdutos(dataProdutos);

      // C. Calcula KPIs de HOJE (Comparação de data segura)
      const hojeStr = new Date().toLocaleDateString("pt-BR");
      const pedidosHoje = listaPedidos.filter(
        (p) =>
          new Date(p.created_at).toLocaleDateString("pt-BR") === hojeStr &&
          (p.status === "PAGO" || p.status === "RETIRADO"),
      );

      setFaturamentoHoje(
        pedidosHoje.reduce((acc, p) => acc + Number(p.valor_total), 0),
      );
      setSacosVendidos(
        pedidosHoje.reduce(
          (acc, p) =>
            acc +
            p.itens_pedido.reduce((sum, item) => sum + item.quantidade, 0),
          0,
        ),
      );
    } catch (error: any) {
      console.error("Erro no Admin:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funções de Ação (Aprovar, Salvar, Deletar)
  const aprovarPagamento = async (pedidoId: string) => {
    if (!window.confirm("Confirmar recebimento do PIX?")) return;
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "PAGO" })
      .eq("id", pedidoId);
    if (!error) carregarDadosGlobais();
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await supabase.from("produtos").update(formData).eq("id", editando.id);
      } else {
        await supabase.from("produtos").insert([formData]);
      }
      setIsModalOpen(false);
      carregarDadosGlobais();
    } catch (err) {
      alert("Erro ao salvar" + err);
    }
  };

  const abrirModal = (p?: Produto) => {
    if (p) {
      setEditando(p);
      setFormData({
        nome: p.nome,
        preco: Number(p.preco),
        estoque_atual: p.estoque_atual,
        ativo: p.ativo,
      });
    } else {
      setEditando(null);
      setFormData({ nome: "", preco: 0, estoque_atual: 0, ativo: true });
    }
    setIsModalOpen(true);
  };

  // Lógica do Gráfico (Últimos 7 dias)
  const dadosGrafico = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      const total = pedidos
        .filter(
          (p) =>
            new Date(p.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            }) === label &&
            (p.status === "PAGO" || p.status === "RETIRADO"),
        )
        .reduce((acc, curr) => acc + Number(curr.valor_total), 0);

      return { data: label, total };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-zinc-900/50 border-r border-zinc-800 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-2 rounded-xl">
            <Flame className="text-orange-500 w-6 h-6" />
          </div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">
            Brasa Admin
          </h1>
        </div>

        <nav className="space-y-2">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "pedidos", label: "Pedidos", icon: ShoppingCart },
            { id: "produtos", label: "Estoque", icon: Tag },
            { id: "clientes", label: "Clientes", icon: Users },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-zinc-500 hover:bg-zinc-800"}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black capitalize">{activeTab}</h2>
            <button
              onClick={carregarDadosGlobais}
              className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <RefreshCcw
                className={`w-5 h-5 ${loading ? "animate-spin text-orange-500" : ""}`}
              />
            </button>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dash"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">
                      Vendas Hoje
                    </p>
                    <p className="text-3xl font-black text-green-500">
                      R$ {faturamentoHoje.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">
                      Volume Hoje
                    </p>
                    <p className="text-3xl font-black">{sacosVendidos} un.</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 text-orange-500">
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">
                      Total Pedidos
                    </p>
                    <p className="text-3xl font-black">{pedidos.length}</p>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico()}>
                      <defs>
                        <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#f97316"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272a"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="data"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "none",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#f97316"
                        strokeWidth={3}
                        fill="url(#color)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeTab === "pedidos" && (
              <motion.div
                key="ped"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden"
              >
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="p-5">Cliente</th>
                      <th className="p-5">Itens</th>
                      <th className="p-5">Valor</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pedidos.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-zinc-800 hover:bg-zinc-800/20"
                      >
                        <td className="p-5">
                          <p className="font-bold">
                            {p.profiles?.nome || "S/ Nome"}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            {p.profiles?.telefone}
                          </p>
                        </td>
                        <td className="p-5 font-bold">
                          {p.itens_pedido.reduce(
                            (acc, i) => acc + i.quantidade,
                            0,
                          )}{" "}
                          un.
                        </td>
                        <td className="p-5 font-black">
                          R$ {p.valor_total.toFixed(2)}
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-5">
                          {p.status === "AGUARDANDO_PAGAMENTO" && (
                            <button
                              onClick={() => aprovarPagamento(p.id)}
                              className="bg-green-600 p-2 rounded-lg hover:bg-green-500 transition-all"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === "produtos" && (
              <motion.div
                key="prod"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-end">
                  <button
                    onClick={() => abrirModal()}
                    className="bg-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-orange-600/20"
                  >
                    <Plus className="w-4 h-4" /> Novo Produto
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtos.map((p) => (
                    <div
                      key={p.id}
                      className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-3 h-3 rounded-full ${p.ativo ? "bg-green-500" : "bg-zinc-700"}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirModal(p)}
                            className="text-zinc-500 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Excluir?"))
                                supabase
                                  .from("produtos")
                                  .delete()
                                  .eq("id", p.id)
                                  .then(() => carregarDadosGlobais());
                            }}
                            className="text-zinc-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg">{p.nome}</h4>
                      <p className="text-orange-500 font-black text-xl mb-4">
                        R$ {Number(p.preco).toFixed(2)}
                      </p>
                      <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase">
                        <span>Estoque</span>
                        <span
                          className={
                            p.estoque_atual < 10 ? "text-red-500" : "text-white"
                          }
                        >
                          {p.estoque_atual} unidades
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODAL RESPONSIVO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-6 uppercase italic">
                Gerenciar Produto
              </h3>
              <form onSubmit={salvarProduto} className="space-y-4">
                <input
                  placeholder="Nome"
                  className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-orange-500"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Preço"
                    className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-orange-500"
                    value={formData.preco}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preco: Number(e.target.value),
                      })
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Estoque"
                    className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-orange-500"
                    value={formData.estoque_atual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estoque_atual: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData({ ...formData, ativo: e.target.checked })
                    }
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-sm font-bold uppercase">
                    Ativo para venda
                  </span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-zinc-800 py-4 rounded-2xl font-bold uppercase text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 py-4 rounded-2xl font-bold uppercase text-xs shadow-lg shadow-orange-600/20"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
