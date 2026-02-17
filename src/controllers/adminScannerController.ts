/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { AdminScannerService } from "../models/services/adminScannerService";

export function useAdminScanner() {
  const [status, setStatus] = useState<"aguardando" | "processando" | "sucesso" | "erro">("aguardando");
  const [pedidoInfo, setPedidoInfo] = useState<any>(null);
  const [erroMsg, setErroMsg] = useState("");
  
  const restartTimerRef = useRef<number | null>(null);

  // Efeito para ligar a câmera sincronizado com o status "aguardando"
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (status === "aguardando") {
      const timerMount = window.setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1, 
          },
          false
        );

        scanner.render(
          async (decodedText) => {
            const idPedido = decodedText.split("/").pop();
            if (idPedido) {
              if (scanner) scanner.clear().catch(console.error);
              processarQRCode(idPedido);
            }
          },
          () => { /* ignora falhas de foco */ }
        );
      }, 50);

      return () => {
        window.clearTimeout(timerMount);
        if (scanner) scanner.clear().catch(console.error);
      };
    }
  }, [status]);

  const processarQRCode = async (id: string) => {
    setStatus("processando");

    try {
      const pedido = await AdminScannerService.getPedidoCompleto(id);

      if (!pedido) throw new Error("Pedido não encontrado no banco de dados.");
      if (pedido.status === "RETIRADO") throw new Error("ALERTA: Este pedido já foi entregue!");
      if (pedido.status === "AGUARDANDO_PAGAMENTO") throw new Error("ALERTA: O pagamento está pendente!");
      if (pedido.status !== "PAGO") throw new Error(`Status inválido: ${pedido.status}`);

      // Validação passou, efetua a baixa
      await AdminScannerService.darBaixa(id);

      // Cálculos da entrega
      const qtdTotal = pedido.itens_pedido.reduce((acc: number, item: any) => acc + Number(item.quantidade), 0);
      const qtdBrindes = pedido.itens_pedido
        .filter((i: any) => Number(i.preco_unitario_congelado) === 0)
        .reduce((acc: number, item: any) => acc + Number(item.quantidade), 0);

      setPedidoInfo({ ...pedido, qtdTotal, qtdBrindes });
      setStatus("sucesso");

      // Inicia auto-reset
      restartTimerRef.current = window.setTimeout(() => {
        reiniciarManualmente();
      }, 4000);

    } catch (error: any) {
      console.error("Erro na leitura: ", error);
      setErroMsg(error.message);
      setStatus("erro");

      restartTimerRef.current = window.setTimeout(() => {
        reiniciarManualmente();
      }, 4000);
    }
  };

  const reiniciarManualmente = () => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    setPedidoInfo(null);
    setErroMsg("");
    setStatus("aguardando"); 
  };

  // Limpa timer se o componente for desmontado (admin saiu da página)
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    };
  }, []);

  return {
    status,
    pedidoInfo,
    erroMsg,
    reiniciarManualmente
  };
}