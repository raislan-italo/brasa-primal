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
  Check,
  Package,
  Phone,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAdmin } from "../../controllers/adminController";

export default function AdminDashboard() {
  const {
    activeTab,
    setActiveTab,
    loading,
    pedidos,
    produtos,
    faturamentoHoje,
    sacosVendidos,
    isModalOpen,
    setIsModalOpen,
    editando,
    formData,
    setFormData,
    carregarDadosGlobais,
    aprovarPagamento,
    abrirModal,
    salvarProduto,
    deletarProduto,
    dadosGrafico,
  } = useAdmin();

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
                      R$ {faturamentoHoje.toFixed(2).replace(".", ",")}
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
                    <AreaChart data={dadosGrafico}>
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
                className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl"
              >
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-5">Cliente</th>
                      <th className="p-5">Itens</th>
                      <th className="p-5">Valor</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pedidos.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                      >
                        <td className="p-5">
                          <p className="font-bold">
                            {p.profiles?.nome || "S/ Nome"}
                          </p>
                          <p className="text-zinc-500 text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3" />{" "}
                            {p.profiles?.telefone || "N/A"}
                          </p>
                        </td>
                        <td className="p-5 font-bold flex items-center gap-2">
                          <Package className="w-4 h-4 text-orange-500" />
                          {p.itens_pedido.reduce(
                            (acc, i) => acc + i.quantidade,
                            0,
                          )}{" "}
                          un.
                        </td>
                        <td className="p-5 font-black text-lg">
                          R$ {p.valor_total.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="p-5">
                          {p.status === "AGUARDANDO_PAGAMENTO" ? (
                            <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold">
                              <Clock className="w-3 h-3" /> Aguardando PIX
                            </span>
                          ) : p.status === "PAGO" ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3 h-3" /> Liberado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3 h-3" /> Retirado
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          {p.status === "AGUARDANDO_PAGAMENTO" && (
                            <button
                              onClick={() => aprovarPagamento(p.id)}
                              className="bg-green-600 px-4 py-2 rounded-xl hover:bg-green-500 transition-all font-bold shadow-lg shadow-green-900/20 text-xs"
                            >
                              Aprovar PIX
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
                    className="bg-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
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
                            onClick={() => deletarProduto(p.id)}
                            className="text-zinc-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg">{p.nome}</h4>
                      <p className="text-orange-500 font-black text-xl mb-4">
                        R$ {Number(p.preco).toFixed(2).replace(".", ",")}
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

      {/* Modal responsivo para produtos */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic">
                  {editando ? "Editar Item" : "Novo Produto"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                    step="0.01"
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
                  <span className="text-sm font-bold uppercase text-zinc-300">
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
                    className="flex-1 bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl font-bold uppercase text-xs shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Salvar
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
