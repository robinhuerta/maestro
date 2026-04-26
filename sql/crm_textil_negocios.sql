-- =============================================================
-- MAESTRO — Módulo CRM IA Textil
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: https://zplvreuiuosmmeoeaeaz.supabase.co
-- (Mismo proyecto que Radio La Nueva 540)
-- =============================================================

CREATE TABLE IF NOT EXISTS crm_negocios (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente     TEXT          NOT NULL,
  empresa     TEXT,
  producto    TEXT,
  valor       NUMERIC(12,2) DEFAULT 0,
  etapa       TEXT          DEFAULT 'new_lead'
                            CHECK (etapa IN ('new_lead','quote','negotiation','logistics','closed_won','closed_lost')),
  prioridad   TEXT          DEFAULT 'medium'
                            CHECK (prioridad IN ('low','medium','high')),
  telefono    TEXT,
  email       TEXT,
  notas       TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE crm_negocios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maestro_anon_all" ON crm_negocios
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER crm_negocios_updated_at
  BEFORE UPDATE ON crm_negocios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
