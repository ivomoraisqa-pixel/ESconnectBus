-- Schema do Supabase para o Intelligent Transit Engine (ITE) - Módulo GTFS / PostGIS

-- 1. Habilitar a extensão espacial do PostGIS (Requer privilégios de superusuário no Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- DADOS ESTÁTICOS GTFS
-- ==========================================

-- 2. Tabela de Linhas (Routes)
CREATE TABLE IF NOT EXISTS public.routes (
    id SERIAL PRIMARY KEY,
    route_id TEXT UNIQUE NOT NULL, -- Código GTFS (ex: 507)
    codigo TEXT,
    nome TEXT NOT NULL,
    cor TEXT,
    empresa TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Abrigos / Pontos de Ônibus (Stops)
CREATE TABLE IF NOT EXISTS public.stops (
    id SERIAL PRIMARY KEY,
    stop_id TEXT UNIQUE NOT NULL, -- Código GTFS
    code TEXT,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    bairro TEXT,
    cidade TEXT,
    possui_totem BOOLEAN DEFAULT false,
    acessibilidade BOOLEAN DEFAULT false,
    wifi BOOLEAN DEFAULT false,
    energia BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'ativo',
    -- Campo Geográfico para cálculos espaciais (Raio, ETA)
    geom geometry(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexação Espacial para Stops
CREATE INDEX IF NOT EXISTS stops_geom_idx ON public.stops USING GIST (geom);

-- Trigger para auto-atualizar o campo GEOM sempre que a latitude/longitude mudar
CREATE OR REPLACE FUNCTION public.update_stop_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stop_geom ON public.stops;
CREATE TRIGGER trg_update_stop_geom
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.stops
FOR EACH ROW EXECUTE FUNCTION public.update_stop_geom();


-- 4. Tabela de Viagens (Trips)
CREATE TABLE IF NOT EXISTS public.trips (
    id SERIAL PRIMARY KEY,
    trip_id TEXT UNIQUE NOT NULL, -- Código GTFS
    route_id TEXT REFERENCES public.routes(route_id) ON DELETE CASCADE,
    service_id TEXT,
    headsign TEXT, -- Destino no letreiro
    direction_id INTEGER CHECK (direction_id IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Trajetos (Shapes)
CREATE TABLE IF NOT EXISTS public.shapes (
    id SERIAL PRIMARY KEY,
    shape_id TEXT NOT NULL,
    pt_sequence INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    dist_traveled DOUBLE PRECISION,
    geom geometry(Point, 4326)
);
CREATE INDEX IF NOT EXISTS shapes_shape_id_idx ON public.shapes(shape_id);

-- ==========================================
-- DADOS EM TEMPO REAL (GTFS-RT / GPS)
-- ==========================================

-- 6. Tabela de Veículos (Realtime)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_id TEXT UNIQUE NOT NULL, -- Prefixo do carro (ex: 24056)
    route_id TEXT REFERENCES public.routes(route_id),
    trip_id TEXT REFERENCES public.trips(trip_id),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    velocidade DOUBLE PRECISION DEFAULT 0,
    heading DOUBLE PRECISION,
    ocupacao TEXT, -- (ex: EMPTY, MANY_SEATS_AVAILABLE)
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    geom geometry(Point, 4326)
);

CREATE INDEX IF NOT EXISTS vehicles_geom_idx ON public.vehicles USING GIST (geom);

-- Trigger para atualizar geometria do veículo
CREATE OR REPLACE FUNCTION public.update_vehicle_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_vehicle_geom ON public.vehicles;
CREATE TRIGGER trg_update_vehicle_geom
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_geom();

-- 7. Histórico de GPS (Para IA de Previsão)
CREATE TABLE IF NOT EXISTS public.gps_history (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    route_id TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    geom geometry(Point, 4326)
);

-- Índice temporal e espacial para ML/AI Engine
CREATE INDEX IF NOT EXISTS gps_history_time_idx ON public.gps_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS gps_history_geom_idx ON public.gps_history USING GIST (geom);

-- ==========================================
-- SEGURANÇA / RLS
-- ==========================================

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_history ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública Segura para APIs de Consulta (Totem)
DROP POLICY IF EXISTS "Leitura publica routes" ON public.routes;
CREATE POLICY "Leitura publica routes" ON public.routes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica stops" ON public.stops;
CREATE POLICY "Leitura publica stops" ON public.stops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica trips" ON public.trips;
CREATE POLICY "Leitura publica trips" ON public.trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica shapes" ON public.shapes;
CREATE POLICY "Leitura publica shapes" ON public.shapes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica vehicles" ON public.vehicles;
CREATE POLICY "Leitura publica vehicles" ON public.vehicles FOR SELECT USING (true);
