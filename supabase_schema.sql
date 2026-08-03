-- Schema do Supabase para SerraBus Conect (Atualizado com MDM e IoT)

-- Remove tabelas antigas para forçar a atualização estrutural
DROP TABLE IF EXISTS public.totens CASCADE;
DROP TABLE IF EXISTS public.linhas CASCADE;
DROP TABLE IF EXISTS public.campanhas CASCADE;
DROP TABLE IF EXISTS public.anuncios CASCADE;
DROP TABLE IF EXISTS public.atualizacoes CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.informativos CASCADE;

-- 1. Totens (Atualizado com recursos de IoT)
CREATE TABLE public.totens (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    codigo TEXT,
    nome TEXT NOT NULL,
    cidade TEXT DEFAULT 'Serra',
    bairro TEXT,
    localizacao TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'instalacao')),
    ultima_conexao TIMESTAMP WITH TIME ZONE,
    versao TEXT,
    token TEXT,
    modo TEXT DEFAULT 'kiosk',
    orientacao TEXT DEFAULT 'vertical',
    resolucao TEXT DEFAULT '1080x1920',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Linhas de Ônibus
CREATE TABLE IF NOT EXISTS public.linhas (
    id SERIAL PRIMARY KEY,
    numero TEXT NOT NULL,
    nome TEXT NOT NULL,
    cor TEXT,
    destinos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Campanhas
CREATE TABLE public.campanhas (
    id SERIAL PRIMARY KEY,
    cliente TEXT,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    data_inicio TEXT,
    data_fim TEXT,
    prioridade TEXT,
    periodo TEXT,
    dias_restantes INTEGER,
    progresso INTEGER,
    totens INTEGER,
    totens_alvo JSONB DEFAULT '{"tipo": "todos", "ids": []}'::jsonb,
    anuncios INTEGER,
    exibicoes INTEGER,
    ctr DOUBLE PRECISION,
    status TEXT CHECK (status IN ('ativa', 'agendada', 'pausada', 'encerrada')),
    formato TEXT,
    investimento DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Anúncios
CREATE TABLE IF NOT EXISTS public.anuncios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('imagem', 'video', 'html')),
    campanha TEXT,
    exibicoes INTEGER,
    status TEXT CHECK (status IN ('ativo', 'inativo')),
    resolucao TEXT,
    tamanho TEXT,
    duracao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Atualizações / Atividades (Painel)
CREATE TABLE IF NOT EXISTS public.atualizacoes (
    id SERIAL PRIMARY KEY,
    tipo TEXT,
    titulo TEXT,
    descricao TEXT,
    badge TEXT,
    badge_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    perfil TEXT,
    status TEXT CHECK (status IN ('ativo', 'inativo')),
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Logs Gerais
CREATE TABLE IF NOT EXISTS public.logs (
    id SERIAL PRIMARY KEY,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo TEXT CHECK (tipo IN ('info', 'warning', 'error', 'success')),
    mensagem TEXT,
    usuario TEXT
);

-- 8. Informativos
CREATE TABLE IF NOT EXISTS public.informativos (
    id SERIAL PRIMARY KEY,
    categoria TEXT,
    prioridade TEXT,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    cor_fundo TEXT,
    cor_texto TEXT,
    data_inicio TEXT,
    data_fim TEXT,
    totens_alvo TEXT,
    ativo BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- NOVAS TABELAS: GERENCIAMENTO DE DISPOSITIVOS E IOT
-- ==========================================

-- 9. Configuração de Totens (1:1 com totens)
CREATE TABLE IF NOT EXISTS public.totem_config (
    id SERIAL PRIMARY KEY,
    totem_id INTEGER REFERENCES public.totens(id) ON DELETE CASCADE,
    tema TEXT DEFAULT 'escuro',
    fullscreen BOOLEAN DEFAULT true,
    mostrarMapa BOOLEAN DEFAULT true,
    mostrarPublicidade BOOLEAN DEFAULT true,
    mostrarNoticias BOOLEAN DEFAULT true,
    mostrarTempo BOOLEAN DEFAULT true,
    mostrarLinhas BOOLEAN DEFAULT true,
    mostrarPrevisao BOOLEAN DEFAULT true,
    tempoPublicidade INTEGER DEFAULT 10,
    tempoMapa INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Totem Campanhas (N:N) - Tabela Profissional para Segmentação
CREATE TABLE IF NOT EXISTS public.totem_campaigns (
    id SERIAL PRIMARY KEY,
    totem_id INTEGER REFERENCES public.totens(id) ON DELETE CASCADE,
    campanha_id INTEGER REFERENCES public.campanhas(id) ON DELETE CASCADE,
    inicio TIMESTAMP WITH TIME ZONE,
    fim TIMESTAMP WITH TIME ZONE,
    prioridade TEXT DEFAULT 'media',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(totem_id, campanha_id)
);

-- 11. Totem Layout
CREATE TABLE IF NOT EXISTS public.totem_layout (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    json JSONB NOT NULL,
    versao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Atualizações OTA
CREATE TABLE IF NOT EXISTS public.totem_updates (
    id SERIAL PRIMARY KEY,
    versao TEXT NOT NULL,
    arquivo TEXT NOT NULL,
    checksum TEXT,
    obrigatorio BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Comandos Remotos da Fila (Remote Commands)
CREATE TABLE IF NOT EXISTS public.totem_commands (
    id SERIAL PRIMARY KEY,
    totem_id INTEGER REFERENCES public.totens(id) ON DELETE CASCADE,
    comando TEXT NOT NULL, -- Ex: REBOOT, CLEAR_CACHE, UPDATE, RELOAD
    payload JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- 14. Totem Telemetria / Logs do Dispositivo
CREATE TABLE IF NOT EXISTS public.totem_logs (
    id SERIAL PRIMARY KEY,
    totem_id INTEGER REFERENCES public.totens(id) ON DELETE CASCADE,
    cpu TEXT,
    ram TEXT,
    internet TEXT,
    temperatura TEXT,
    erros TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Chaves de Ativação (Registration PINs)
CREATE TABLE IF NOT EXISTS public.activation_keys (
    id SERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    totem_id INTEGER REFERENCES public.totens(id) ON DELETE SET NULL,
    expira TIMESTAMP WITH TIME ZONE,
    utilizado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- POLÍTICAS RLS E SEGURANÇA
-- ==========================================

-- Para fins de MVP, liberando todas temporariamente. Em Produção, configuraríamos policies usando auth.uid()
ALTER TABLE public.totens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico totens" ON public.totens;
CREATE POLICY "Acesso publico totens" ON public.totens FOR ALL USING (true);

ALTER TABLE public.linhas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico linhas" ON public.linhas;
CREATE POLICY "Acesso publico linhas" ON public.linhas FOR ALL USING (true);

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico campanhas" ON public.campanhas;
CREATE POLICY "Acesso publico campanhas" ON public.campanhas FOR ALL USING (true);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico anuncios" ON public.anuncios;
CREATE POLICY "Acesso publico anuncios" ON public.anuncios FOR ALL USING (true);

ALTER TABLE public.atualizacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico atualizacoes" ON public.atualizacoes;
CREATE POLICY "Acesso publico atualizacoes" ON public.atualizacoes FOR ALL USING (true);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico usuarios" ON public.usuarios;
CREATE POLICY "Acesso publico usuarios" ON public.usuarios FOR ALL USING (true);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico logs" ON public.logs;
CREATE POLICY "Acesso publico logs" ON public.logs FOR ALL USING (true);

ALTER TABLE public.informativos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico informativos" ON public.informativos;
CREATE POLICY "Acesso publico informativos" ON public.informativos FOR ALL USING (true);

ALTER TABLE public.totem_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico totem_config" ON public.totem_config;
CREATE POLICY "Acesso publico totem_config" ON public.totem_config FOR ALL USING (true);

ALTER TABLE public.totem_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico totem_campaigns" ON public.totem_campaigns;
CREATE POLICY "Acesso publico totem_campaigns" ON public.totem_campaigns FOR ALL USING (true);

ALTER TABLE public.totem_commands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico totem_commands" ON public.totem_commands;
CREATE POLICY "Acesso publico totem_commands" ON public.totem_commands FOR ALL USING (true);

ALTER TABLE public.totem_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico totem_logs" ON public.totem_logs;
CREATE POLICY "Acesso publico totem_logs" ON public.totem_logs FOR ALL USING (true);

ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico activation_keys" ON public.activation_keys;
CREATE POLICY "Acesso publico activation_keys" ON public.activation_keys FOR ALL USING (true);


-- Limpar dados existentes para evitar duplicidade ao rodar o script novamente
TRUNCATE TABLE public.totens RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.linhas RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.campanhas RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.usuarios RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.activation_keys RESTART IDENTITY CASCADE;

-- Insert dummy data
INSERT INTO public.totens (nome, localizacao, bairro, codigo, status, ultima_conexao, versao, lat, lng) VALUES
('Totem Carone Mall', 'R. José Marcelino, 100 - Centro, Vitória', 'Centro', 'T-VIX-001', 'online', NOW(), 'v2.1.8', -20.2976, -40.2958),
('Totem Terminal Laranjeiras', 'Terminal Laranjeiras - Serra', 'Laranjeiras', 'T-SER-002', 'online', NOW(), 'v2.1.8', -20.2108, -40.2573),
('Totem Shopping Montserrat', 'Av. Eldes Scherrer Souza, 2162 - Laranjeiras', 'Laranjeiras', 'T-SER-003', 'offline', NOW() - INTERVAL '1 day', 'v2.1.7', -20.2230, -40.2510);

INSERT INTO public.totem_config (totem_id) VALUES (1), (2), (3);

INSERT INTO public.linhas (numero, nome, cor, destinos) VALUES
('523', 'Terminal Laranjeiras', '#2D9B5A', '["Terminal Laranjeiras", "Serra Sede"]'),
('507', 'Centro / Vitória', '#3B82F6', '["Centro", "Vitória"]');

INSERT INTO public.campanhas (nome, descricao, periodo, dias_restantes, progresso, totens, anuncios, exibicoes, ctr, status, formato, investimento) VALUES
('Festival de Inverno', 'Festival de Inverno 2025', '01/05/2025 - 31/05/2025', 31, 100, 3, 15, 45230, 2.45, 'ativa', 'imagem', 5200),
('Líquida Carone', 'Promoção Líquida Carone', '10/05/2025 - 25/05/2025', 25, 100, 2, 20, 38420, 2.12, 'ativa', 'video', 4800);

INSERT INTO public.usuarios (nome, email, perfil, status, ultimo_acesso) VALUES
('Admin', 'admin@serrabus.com.br', 'Administrador', 'ativo', NOW());

INSERT INTO public.activation_keys (codigo, token, totem_id) VALUES 
('13-XT5L', 'tok_abc123', 1),
('14-88N0', 'tok_def456', 2),
('17-6VLH', 'tok_ghi789', 3);

-- ==========================================
-- DESIGNER DE LAYOUT DO TOTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.totem_layouts (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  layout_data JSONB NOT NULL DEFAULT '{}',
  thumbnail TEXT,
  is_template BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','arquivado')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.totem_layout_assignments (
  id SERIAL PRIMARY KEY,
  layout_id INT REFERENCES public.totem_layouts(id) ON DELETE CASCADE,
  totem_id INT REFERENCES public.totens(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
