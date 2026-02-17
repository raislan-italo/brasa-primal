/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ClientService } from "../models/services/clientService";

export function useClientController() {
  const navigate = useNavigate();

  // Estados Gerais
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pedidos" | "perfil">("pedidos");

  // Estados de Pedidos e Gamificação
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);
  const [pixCopiadoId, setPixCopiadoId] = useState<string | null>(null);
  const [brasasDisponiveis, setBrasasDisponiveis] = useState(0);
  const [recompensasUsadas, setRecompensasUsadas] = useState(0);

  // Estados de Perfil
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState({ tipo: "", texto: "" });

  const PRECO_CARVAO = 1;
  const META_BRASAS = 2;

  const carregarDados = async () => {
    setLoading(true);
    try {
      const session = await ClientService.getSession();
      if (!session) return navigate("/login");

      setUser(session.user);
      setNome(session.user.user_metadata?.nome_completo || "");
      setTelefone(session.user.user_metadata?.telefone || "");
      setAvatarUrl(session.user.user_metadata?.avatar_url || null);

      const pedidosData = await ClientService.getPedidos(session.user.id);
      setPedidos(pedidosData);

      const pedidosIds = pedidosData.map((p) => p.id);
      const qtdResgatada = await ClientService.getItensGratisResgatados(pedidosIds);
      setRecompensasUsadas(qtdResgatada);

      const valorTotalGasto = pedidosData
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
    carregarDados();
  }, []);

  useEffect(() => {
    // Só prossegue se o ID do usuário já existir
    if (!user?.id) return;

    // Nome ÚNICO para o canal evita conflitos de re-renderização
    const canal = supabase
      .channel(`pedidos_cliente_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `user_id=eq.${user.id}`
        },
        () => {
          carregarDados();
        }
      )
      .subscribe();

    return () => {
      const limparCanal = async () => {
        try {
          await supabase.removeChannel(canal);
        } catch (err) {
          console.log(err)
        }
      };
      limparCanal();
    };
  }, [user?.id]);

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
        ctx.fillText(`Ticket: #${pedidoId.slice(0, 8)}`, canvas.width / 2, img.height + 75);

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
    await ClientService.logout();
    navigate("/");
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error("Selecione uma imagem.");

      // Chama o Service que agora devolve a URL e o Usuário novo
      const { publicUrl, updatedUser } = await ClientService.uploadAvatarUsuario(user.id, event.target.files[0]);

      // Atualiza os estados da tela
      setAvatarUrl(publicUrl);
      setUser(updatedUser);

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
      const updatedUser = await ClientService.atualizarPerfilUsuario(nome, telefone);
      setUser(updatedUser);
      setMensagemPerfil({ tipo: "sucesso", texto: "Perfil atualizado!" });
      setTimeout(() => setMensagemPerfil({ tipo: "", texto: "" }), 3000);
    } catch (error: any) {
      setMensagemPerfil({ tipo: "erro", texto: error.message });
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
    setTelefone(v);
  };

  const copiarPix = (pix: string, id: string) => {
    navigator.clipboard.writeText(pix);
    setPixCopiadoId(id);
    setTimeout(() => setPixCopiadoId(null), 3000);
  };

  return {
    loading, user, activeTab, setActiveTab, pedidos, pedidoExpandido, setPedidoExpandido,
    pixCopiadoId, copiarPix, brasasDisponiveis, recompensasUsadas, nome, setNome, telefone, handleTelefoneChange,
    avatarUrl, uploadingAvatar, salvandoPerfil, mensagemPerfil,
    baixarTicket, handleLogout, uploadAvatar, atualizarPerfil,
    recompensasDisponiveis: Math.floor(brasasDisponiveis / META_BRASAS),
    progressoAtual: brasasDisponiveis % META_BRASAS,
    progressoPorcentagem: ((brasasDisponiveis % META_BRASAS) / META_BRASAS) * 100,
    META_BRASAS
  };
}