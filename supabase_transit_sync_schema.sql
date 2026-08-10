-- ====================================================
-- SCHEMA: Sincronização Estação × Linhas × GPS × ETA
-- ConnectBus / SerraBus Conect
-- ====================================================
-- SEGURO: usa IF NOT EXISTS, sem DROP TABLE de dados existentes

-- ============================================
-- 1. bus_stops — Pontos de Ônibus / Estações
-- ============================================
CREATE TABLE IF NOT EXISTS public.bus_stops (
  id          SERIAL PRIMARY KEY,
  code        TEXT UNIQUE,
  name        TEXT NOT NULL,
  address     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  city        TEXT DEFAULT 'Serra',
  bairro      TEXT,
  active      BOOLEAN DEFAULT true,
  source      TEXT DEFAULT 'manual',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. routes — Linhas de Ônibus (GTFS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.routes (
  id               SERIAL PRIMARY KEY,
  route_id         TEXT UNIQUE NOT NULL,
  route_short_name TEXT,
  route_long_name  TEXT,
  codigo           TEXT,
  nome             TEXT NOT NULL,
  route_color      TEXT DEFAULT '3B82F6',
  cor              TEXT,
  empresa          TEXT,
  active           BOOLEAN DEFAULT true,
  source           TEXT DEFAULT 'manual',
  ativo            BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. stop_routes — Relação Estação × Linha
-- ============================================
-- FONTE OFICIAL: stopId → routeId
CREATE TABLE IF NOT EXISTS public.stop_routes (
  id            SERIAL PRIMARY KEY,
  stop_id       TEXT NOT NULL,
  route_id      TEXT NOT NULL REFERENCES public.routes(route_id) ON DELETE CASCADE,
  stop_sequence INTEGER,
  direction     TEXT,
  active        BOOLEAN DEFAULT true,
  source        TEXT DEFAULT 'manual',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stop_id, route_id)
);

CREATE INDEX IF NOT EXISTS stop_routes_stop_id_idx   ON public.stop_routes(stop_id);
CREATE INDEX IF NOT EXISTS stop_routes_route_id_idx  ON public.stop_routes(route_id);
CREATE INDEX IF NOT EXISTS stop_routes_active_idx    ON public.stop_routes(active);

-- ============================================
-- 4. totem_stops — Vínculo Totem × Estação
-- ============================================
CREATE TABLE IF NOT EXISTS public.totem_stops (
  id          SERIAL PRIMARY KEY,
  totem_id    INTEGER NOT NULL REFERENCES public.totens(id) ON DELETE CASCADE,
  stop_id     TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT true,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(totem_id, stop_id)
);

CREATE INDEX IF NOT EXISTS totem_stops_totem_idx ON public.totem_stops(totem_id);
CREATE INDEX IF NOT EXISTS totem_stops_stop_idx  ON public.totem_stops(stop_id);

-- ============================================
-- 5. vehicle_positions — Posições GPS em Tempo Real
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_positions (
  id           SERIAL PRIMARY KEY,
  vehicle_id   TEXT UNIQUE NOT NULL,
  route_id     TEXT REFERENCES public.routes(route_id) ON DELETE SET NULL,
  trip_id      TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  speed_kmh    DOUBLE PRECISION DEFAULT 0,
  bearing      DOUBLE PRECISION DEFAULT 0,
  direction    TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  source       TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS vehicle_positions_route_id_idx ON public.vehicle_positions(route_id);
CREATE INDEX IF NOT EXISTS vehicle_positions_updated_idx  ON public.vehicle_positions(updated_at DESC);

-- ============================================
-- 6. arrivals — Estimativas de Chegada (ETA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.arrivals (
  id              SERIAL PRIMARY KEY,
  stop_id         TEXT NOT NULL,
  route_id        TEXT REFERENCES public.routes(route_id) ON DELETE CASCADE,
  trip_id         TEXT,
  vehicle_id      TEXT,
  eta_minutes     INTEGER,
  distance_km     DOUBLE PRECISION,
  scheduled_time  TIMESTAMPTZ,
  status          TEXT DEFAULT 'on_time' CHECK (status IN ('on_time','delayed','early','no_data')),
  active          BOOLEAN DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  source          TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS arrivals_stop_id_idx   ON public.arrivals(stop_id);
CREATE INDEX IF NOT EXISTS arrivals_route_id_idx  ON public.arrivals(route_id);
CREATE INDEX IF NOT EXISTS arrivals_active_idx    ON public.arrivals(active);

-- ============================================
-- SEGURANÇA — Row Level Security
-- ============================================
ALTER TABLE public.bus_stops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_routes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totem_stops       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrivals          ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (frontend com anon key)
DROP POLICY IF EXISTS "Read bus_stops"         ON public.bus_stops;
CREATE POLICY "Read bus_stops"                 ON public.bus_stops         FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write bus_stops"        ON public.bus_stops;
CREATE POLICY "Write bus_stops"                ON public.bus_stops         FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read routes"            ON public.routes;
CREATE POLICY "Read routes"                    ON public.routes            FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write routes"           ON public.routes;
CREATE POLICY "Write routes"                   ON public.routes            FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read stop_routes"       ON public.stop_routes;
CREATE POLICY "Read stop_routes"               ON public.stop_routes       FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write stop_routes"      ON public.stop_routes;
CREATE POLICY "Write stop_routes"              ON public.stop_routes       FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read totem_stops"       ON public.totem_stops;
CREATE POLICY "Read totem_stops"               ON public.totem_stops       FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write totem_stops"      ON public.totem_stops;
CREATE POLICY "Write totem_stops"              ON public.totem_stops       FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read vehicle_positions" ON public.vehicle_positions;
CREATE POLICY "Read vehicle_positions"         ON public.vehicle_positions  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write vehicle_positions" ON public.vehicle_positions;
CREATE POLICY "Write vehicle_positions"        ON public.vehicle_positions  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read arrivals"          ON public.arrivals;
CREATE POLICY "Read arrivals"                  ON public.arrivals           FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write arrivals"         ON public.arrivals;
CREATE POLICY "Write arrivals"                 ON public.arrivals           FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA — Estações Reais da Serra, ES
-- ============================================
INSERT INTO public.bus_stops (code, name, address, latitude, longitude, city, bairro, source) VALUES
  ('ST-TL01', 'Terminal Laranjeiras',       'Av. Eldes Scherrer Souza, Laranjeiras, Serra - ES',   -20.21083, -40.25731, 'Serra', 'Parque Residencial Laranjeiras', 'seed'),
  ('ST-SM02', 'Shopping Montserrat',        'Av. Eldes Scherrer Souza, 2162, Colina de Laranjeiras', -20.22305, -40.25102, 'Serra', 'Colina de Laranjeiras', 'seed'),
  ('ST-CM03', 'Carone Mall',                'Av. Central, Parque Residencial Laranjeiras, Serra',   -20.19830, -40.24510, 'Serra', 'Parque Residencial Laranjeiras', 'seed'),
  ('ST-PA04', 'Primeira Avenida - Laranjeiras', 'Av. Primeira Avenida, Laranjeiras, Serra',         -20.21540, -40.25890, 'Serra', 'Parque Residencial Laranjeiras', 'seed'),
  ('ST-HDS06','Hospital Dório Silva',       'Av. Eldes Scherrer Souza, Laranjeiras, Serra',         -20.20810, -40.25110, 'Serra', 'Parque Residencial Laranjeiras', 'seed'),
  ('ST-JT09', 'Jacaraípe Terminal Provisório', 'Av. Abido Saad, Jacaraípe, Serra',                 -20.16040, -40.19550, 'Serra', 'Jacaraípe', 'seed')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA — Linhas de Ônibus Reais da Serra
-- ============================================
INSERT INTO public.routes (route_id, route_short_name, route_long_name, codigo, nome, route_color, source) VALUES
  ('501', '501', 'Terminal Laranjeiras / Centro',       '501', 'T. Laranjeiras / Centro',        '2D9B5A', 'seed'),
  ('503', '503', 'Terminal Laranjeiras / Vila Velha',   '503', 'T. Laranjeiras / Vila Velha',    '3B82F6', 'seed'),
  ('504', '504', 'Terminal Laranjeiras / IBES',         '504', 'T. Laranjeiras / IBES',          '8B5CF6', 'seed'),
  ('507', '507', 'Terminal Laranjeiras / Centro / Vitória', '507', 'T. Laranjeiras / Vitória',  'EF4444', 'seed'),
  ('508', '508', 'Terminal Laranjeiras / Bairro Novo',  '508', 'T. Laranjeiras / Bairro Novo',   'F97316', 'seed'),
  ('515', '515', 'Terminal Laranjeiras / Nova Almeida',  '515', 'T. Laranjeiras / Nova Almeida', '06B6D4', 'seed'),
  ('523', '523', 'Carone Mall / Terminal Laranjeiras',  '523', 'Carone Mall / T. Laranjeiras',  'EC4899', 'seed'),
  ('800', '800', 'Terminal Laranjeiras / Terminal Jacaraípe', '800', 'T. Laranjeiras / T. Jacaraípe', 'F59E0B', 'seed'),
  ('806', '806', 'Jacaraípe / Centro',                  '806', 'Jacaraípe / Centro',             '10B981', 'seed'),
  ('810', '810', 'Jacaraípe / Terminal Laranjeiras',   '810', 'Jacaraípe / T. Laranjeiras',     '6366F1', 'seed'),
  ('814', '814', 'Terminal Laranjeiras / Cascata',      '814', 'T. Laranjeiras / Cascata',       '0EA5E9', 'seed'),
  ('850', '850', 'Terminal Laranjeiras / Eldorado',     '850', 'T. Laranjeiras / Eldorado',      'A855F7', 'seed'),
  ('560', '560', 'Shopping Montserrat / Centro',        '560', 'Shopping Montserrat / Centro',   'F43F5E', 'seed')
ON CONFLICT (route_id) DO NOTHING;

-- ============================================
-- SEED DATA — Relações Estação × Linha (stop_routes)
-- ============================================
-- Terminal Laranjeiras: linhas que realmente passam lá
INSERT INTO public.stop_routes (stop_id, route_id, direction, source) VALUES
  ('ST-TL01', '501', 'Centro',          'seed'),
  ('ST-TL01', '503', 'Vila Velha',      'seed'),
  ('ST-TL01', '504', 'IBES',            'seed'),
  ('ST-TL01', '507', 'Vitória',         'seed'),
  ('ST-TL01', '508', 'Bairro Novo',     'seed'),
  ('ST-TL01', '515', 'Nova Almeida',    'seed'),
  ('ST-TL01', '800', 'Jacaraípe',       'seed'),
  ('ST-TL01', '814', 'Cascata',         'seed'),
  ('ST-TL01', '850', 'Eldorado',        'seed')
ON CONFLICT (stop_id, route_id) DO NOTHING;

-- Shopping Montserrat
INSERT INTO public.stop_routes (stop_id, route_id, direction, source) VALUES
  ('ST-SM02', '507', 'Vitória',         'seed'),
  ('ST-SM02', '560', 'Centro',          'seed'),
  ('ST-SM02', '800', 'Jacaraípe',       'seed')
ON CONFLICT (stop_id, route_id) DO NOTHING;

-- Carone Mall: 523 só passa aqui, não no Terminal Laranjeiras!
INSERT INTO public.stop_routes (stop_id, route_id, direction, source) VALUES
  ('ST-CM03', '523', 'T. Laranjeiras',  'seed'),
  ('ST-CM03', '800', 'Jacaraípe',       'seed')
ON CONFLICT (stop_id, route_id) DO NOTHING;

-- Primeira Avenida
INSERT INTO public.stop_routes (stop_id, route_id, direction, source) VALUES
  ('ST-PA04', '501', 'Centro',          'seed'),
  ('ST-PA04', '507', 'Vitória',         'seed'),
  ('ST-PA04', '815', 'Serra Dourada',   'seed')
ON CONFLICT (stop_id, route_id) DO NOTHING;

-- Hospital Dório Silva
INSERT INTO public.stop_routes (stop_id, route_id, direction, source) VALUES
  ('ST-HDS06','503', 'Vila Velha',      'seed'),
  ('ST-HDS06','504', 'IBES',            'seed'),
  ('ST-HDS06','523', 'T. Laranjeiras',  'seed'),
  ('ST-HDS06','800', 'Jacaraípe',       'seed')
ON CONFLICT (stop_id, route_id) DO NOTHING;

-- Jacaraípe Terminal
INSERT INTO public.stop_routes (stop_id, route_id, direction, source) VALUES
  ('ST-JT09', '806', 'Centro',          'seed'),
  ('ST-JT09', '810', 'T. Laranjeiras',  'seed'),
  ('ST-JT09', '800', 'T. Laranjeiras',  'seed')
ON CONFLICT (stop_id, route_id) DO NOTHING;

-- ============================================
-- SEED DATA — Veículos de Exemplo (vehicle_positions)
-- ============================================
INSERT INTO public.vehicle_positions (vehicle_id, route_id, latitude, longitude, speed_kmh, bearing, direction, source) VALUES
  ('V-501-01', '501', -20.2120, -40.2590, 42.0, 180.0, 'Centro',       'seed'),
  ('V-503-01', '503', -20.2145, -40.2610, 38.0, 200.0, 'Vila Velha',   'seed'),
  ('V-507-01', '507', -20.2130, -40.2570, 50.0, 160.0, 'Vitória',      'seed'),
  ('V-523-01', '523', -20.1990, -40.2460, 35.0, 90.0,  'T. Laranjeiras','seed'),
  ('V-800-01', '800', -20.2100, -40.2530, 55.0, 0.0,   'Jacaraípe',    'seed')
ON CONFLICT (vehicle_id) DO NOTHING;

-- ============================================
-- SEED DATA — Estimativas de Chegada (arrivals)
-- ============================================
INSERT INTO public.arrivals (stop_id, route_id, vehicle_id, eta_minutes, distance_km, status, source) VALUES
  ('ST-TL01', '501', 'V-501-01', 4,  1.8, 'on_time', 'seed'),
  ('ST-TL01', '503', 'V-503-01', 8,  3.2, 'on_time', 'seed'),
  ('ST-TL01', '507', 'V-507-01', 12, 5.1, 'delayed', 'seed'),
  ('ST-CM03', '523', 'V-523-01', 3,  0.9, 'on_time', 'seed'),
  ('ST-CM03', '800', 'V-800-01', 7,  2.4, 'on_time', 'seed')
ON CONFLICT DO NOTHING;
