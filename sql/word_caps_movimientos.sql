-- =============================================================
-- MAESTRO — Módulo Word Caps (Sistema de Reventa)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: https://zplvreuiuosmmeoeaeaz.supabase.co
-- =============================================================

CREATE TABLE IF NOT EXISTS wc_movimientos (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo        TEXT          NOT NULL
                            CHECK (tipo IN ('entrega', 'cobro', 'compra')),
  cliente     TEXT,
  descripcion TEXT,
  monto       NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha       DATE          NOT NULL DEFAULT CURRENT_DATE,
  proveedor   TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE wc_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maestro_anon_all" ON wc_movimientos
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
