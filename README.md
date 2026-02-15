<div align="center">
  <img src="/public/logo_brasa.png" width="250" alt="Logo Brasa Primal">

  # 🔥 Brasa Primal | O Drive-Thru do Churrasco
  
  **O Fogo Perfeito. Sem Espera.**

  [![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange?style=for-the-badge&logo=fire)](#)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
  [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
</div>

---

## Sobre o Projeto

**Brasa Primal** não é apenas um e-commerce; é uma revolução na forma como a cidade de Caxias, MA, compra carvão. Nós unimos a conveniência do digital com a velocidade do mundo real através de um sistema híbrido de vendas e logística rápida.

O sistema é uma plataforma **Full-Stack** completa que gerencia desde a vitrine digital e o programa de fidelidade do cliente até a operação no pátio da fábrica, utilizando validação instantânea via QR Code para um **Drive-Thru sem filas**.

### A Experiência "Primal"

1. **Compra Online:** O cliente escolhe o produto e paga via PIX instantâneo (processado via Edge Functions).  
2. **Ticket Inteligente:** Um QR Code exclusivo é gerado direto no painel do usuário.  
3. **Drive-Thru:** O cliente se dirige à fábrica.  
4. **Validação Relâmpago:** O operador escaneia o QR Code no terminal. O sistema valida o pagamento, impede fraudes e libera o pedido na hora.

---

## Funcionalidades Principais

O ecossistema é dividido em duas frentes de alta performance:

### Para o Cliente (Web App)
* **Vitrine Dinâmica:** Estoque sincronizado em tempo real. Se o produto acabar na fábrica, a vitrine é atualizada instantaneamente.  
* **Gamificação (Clube Primal):**  
  * Acúmulo automático de "Brasas" a cada pedido **retirado**.  
  * Recompensa de produtos grátis calculada matematicamente.  
  * Barras de progresso e animações com `Framer Motion`.  
* **Checkout Descomplicado:** PIX "Copia e Cola" e QR Code renderizado em tela.  
* **Painel do Usuário:**  
  * Histórico com badges de status em tempo real (Aguardando PIX, Liberado, Retirado).  
  * Geração e download offline do Ticket de Retirada (`HTML5 Canvas` para `.png`).  
  * Atualização de perfil e upload de foto de avatar.  

### Para o Operador (Painel Admin)
* **Terminal Scanner (Drive-Thru):**  
  * Câmera de leitura contínua de QR Codes para validação veicular.  
  * Prevenção de dupla-retirada e alertas sonoros/visuais para fraudes.  
  * Auto-Loop: O scanner se reinicia sozinho após 4 segundos para atender o próximo carro.  
* **Dashboard Executivo:** Indicadores de vendas diárias e gráficos de faturamento em área (`Recharts`).  
* **Gestão de Estoque:** CRUD completo de produtos, alteração de preços e ativação de catálogo que reflete instantaneamente na Vitrine.  

---

## Tech Stack & Arquitetura

O projeto foi construído com foco em **baixa latência** e **alta disponibilidade**.

**Frontend:**
* `React` + `TypeScript` + `Vite`  
* `Tailwind CSS` (Estilização utilitária e responsividade)  
* `Framer Motion` (Animações fluidas de interface)  
* `Lucide React` (Iconografia)  
* `Recharts` (Data Visualization no Admin)  
* `Html5-Qrcode` (Motor de leitura ótica da câmera)  

**Backend & BaaS (Supabase):**
* **Auth:** Autenticação segura e gerenciamento de sessões.  
* **Database (PostgreSQL):** Modelagem relacional para tabelas de `pedidos`, `itens_pedido`, `produtos` e `profiles`.  
* **Realtime:** WebSockets nativos para transição de status (O cliente vê a tela ficar verde no exato milissegundo que o Admin dá a baixa).  
* **Storage:** Buckets otimizados para os avatares dos clientes.  
* **Edge Functions (Deno):** Integração backend isolada para geração segura do payload do PIX com a API bancária.  

---

## Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js >= 18.x  
- npm ou yarn  
- Conta no [Supabase](https://supabase.com/) configurada com Database e Auth  
- Navegador moderno para testar frontend  

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/brasa-primal.git
cd brasa-primal  
```

### 2. Instalar dependências
```bash
npm install
# ou
yarn install
```

### 3. Criar variáveis de ambiente
#### Crie um arquivo `.env.local` na raiz do projeto: 
```bash
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Rodar o FrontEnd
```bash
npm run dev
# ou
yarn run dev
```
#### Acesse http://localhost:5173

### 5. Rodar as Edge Functions (PIX)
```bash
supabase functions serve
```

## Scripts Úteis
- `npm run dev` -> inicia o frontend em modo de desenvolvimento
- `npm run bild` -> Gera build de produção
- `npm run preview` -> Visualiza build de produção localmente
- `supabase start` -> Inicia o supabase localmente
- `supabase functions serve` -> Testa Edge Functions localmente

----

## Roamap
- [x] Vitrine digital com estoque em tempo real
- [x] Checkout com PIX instantâneo
- [x] QR Code para validação Drive-Thru
- [x] Painel Admin para operadores
- [ ] Notificações em tempo real para o cliente
- [ ] App Mobile PWA com instalação nativa
- [ ] Gamificação completa do Clube Primal (brasas, badges e conquistas)
---

## Contato
- Website: 
- E-mail: raislanitalo62@gmail.com
- Whatsapp: (99)98180-6908
- Instagram: @raislan_italo
