# 🚍 ESconnectBus - Sistema Inteligente de Gestão de Totens & Mídia Digital (DOOH)

O **ESconnectBus** é uma plataforma completa e moderna para gestão de mobilidade urbana, totens informativos e veiculação de mídia Digital Out-Of-Home (DOOH) em tempo real, integrando transporte público, informativos municipais e publicidade direcionada.

---

## 🚀 Principais Funcionalidades Implementadas

### 🎯 1. Automação e Gerenciamento Avançado de Campanhas (DOOH)
- **Segmentação por Totens Específicos ou Todos:** Direcionamento preciso de campanhas publicitárias para totens individuais cadastrados ou para toda a rede.
- **Validação de Janela de Exibição & Automação de Status:**
  - **Programação por Datas:** Data inicial e data final com encerramento automático.
  - **Automação de Horários:** Horário Comercial (08h - 18h), Pico Manhã (06h - 09h), Pico Tarde (17h - 20h), Integral (24h) e **Horário Personalizado** (com definição customizada de hora de início e término).
  - **Encerramento / Pausa Automática:** Assim que o período programado expira, o status da campanha é atualizado automaticamente para `ENCERRADA` no Supabase e a veiculação é suspensa imediatamente.
- **Motor de Exibição em Tempo Real (Live Background Engine):**
  - Contagem contínua e incremento ao vivo das exibições em totens com status online.
- **Suporte Multi-mídia Completo:**
  - Suporte completo para imagens estáticas (`.png`, `.jpg`, `.gif`) e vídeos (`.mp4`, `.webm`, `.mov`, `.mkv`, `.avi`).
  - **Preservação de Mídia ao Editar:** Permite atualizar apenas alvos, valores ou horários sem perder a imagem/vídeo previamente enviada.

---

### 📋 2. Gestão de Anúncios via Quadro Kanban (Drag & Drop)
- **Fluxo Visual por Status:** Colunas organizadas para anúncios **Ativos** (🟢), **Pausados** (⏸️) e **Finalizados** (🏁).
- **Arraste e Solte (Drag & Drop):** Alteração instantânea do status do anúncio ao mover o card entre as colunas do quadro.
- **Ações Rápidas por Card:**
  - `⏸️ Pausar` na coluna Ativos.
  - `▶️ Play (Ativar)` na coluna Pausados.
  - `🔄 Renovar` na coluna Finalizados (redireciona para a tela de campanha preenchendo todos os dados para reativação).
- **Modal de Detalhes com Frame Preview 1080x1920:** Visualização em formato real de totem com reprodução de vídeo/imagem, métricas acumuladas, valor do anúncio (R$) e totens direcionados.

---

### 📱 3. Simulador de Totem & Preview Interativo
- **Carrossel Alternado de 15s (Personalizável):** Alternância contínua entre a tela do **Painel Principal** (Próximos Ônibus e Mapa) e os **Anúncios Ativos**.
- **Carrossel de Informativos Municipais:** Rotação sequencial dos banners informativos da prefeitura toda vez que a tela retorna ao Painel Principal.
- **Status de Mídias nos Cards dos Totens:** Exibição resumida nos cards da grade de gerenciamento com a lista exata de campanhas e informativos que estão sendo veiculados naquele totem.

---

### 📊 4. Analytics & Relatórios de Exibição
- **Métricas em Tempo Real:** Atualização ao vivo a cada 3 segundos na interface de relatórios e campanhas.
- **Cálculo da Estimativa Total Projetada:** Fórmula matemática inteligente para projeção de exibições até o fim da campanha, levando em consideração:
  1. Quantidade de totens alvos ativos.
  2. Dias totais de veiculação.
  3. Duração da janela diária de funcionamento.
  4. Fator de compartilhamento de tempo no ciclo rotativo com outras campanhas concorrentes no mesmo totem.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML5 Semântico, CSS3 (Design System com Dark Mode / Glassmorphism), JavaScript (ES6+ Single Page Application).
- **Backend & API:** Node.js, Express API, Supabase Database (PostgreSQL) & Realtime.
- **Vídeos & Imagens:** Processamento em Base64 / URL com suporte a múltiplos formatos.

---

## 📌 Histórico de Atualizações & Melhorias

### [16/08/2026]
- 🔄 **Preservação de Mídia ao Editar:** Corrigido fluxo de edição para não sobrescrever vídeos ou imagens ao alterar totens alvo ou horários.
- ⏰ **Horários Personalizados & Valor do Anúncio:** Adicionado seletor de horas customizadas e campo de valor financeiro do anúncio (R$).
- 🛑 **Encerramento Automático:** Validação de expiração por data e horário alterando status para `ENCERRADA` no Supabase e retirando dos totens.
- 📋 **Quadro Kanban de Anúncios (Drag & Drop):** Implementação da página de Anúncios no formato Kanban com suporte a Drag & Drop, modais de preview e ação de renovação rápida.
- ⚡ **Contador em Tempo Real e Projeções:** Motor de exibição em segundo plano e estatísticas projetadas nos relatórios.
- 📢 **Carrossel de Informativos:** Transição rotativa de informativos no Painel Principal.
