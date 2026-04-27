-- =============================================================
-- MAESTRO — Word Caps v2: agregar tipo_pago y banco
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================================

ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS tipo_pago TEXT;
ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS banco     TEXT;
