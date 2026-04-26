-- =============================================================
-- MAESTRO — Módulo Radio La Nueva 540
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: https://zplvreuiuosmmeoeaeaz.supabase.co
-- =============================================================

CREATE TABLE IF NOT EXISTS radio_auspiciadores (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre        TEXT          NOT NULL,
  empresa       TEXT,
  ruc           TEXT,
  contacto      TEXT,
  telefono      TEXT,
  email         TEXT,
  monto_mensual NUMERIC(10,2) DEFAULT 0,
  fecha_inicio  DATE,
  fecha_fin     DATE,
  estado        TEXT          DEFAULT 'activo'
                              CHECK (estado IN ('activo', 'inactivo', 'vencido')),
  tipo_pauta    TEXT,
  notas         TEXT,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- RLS: permite lectura y escritura con anon key (uso interno MAESTRO)
ALTER TABLE radio_auspiciadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maestro_anon_all" ON radio_auspiciadores
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Trigger: actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER radio_auspiciadores_updated_at
  BEFORE UPDATE ON radio_auspiciadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
