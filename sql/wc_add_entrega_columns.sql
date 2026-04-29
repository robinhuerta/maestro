-- =============================================================
-- MAESTRO — Word Caps: Nuevas columnas para formato de entregas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: https://zplvreuiuosmmeoeaeaz.supabase.co
-- =============================================================
-- Campos basados en el formato Excel:
-- FECHA ENTREGA | CODIGO | MODELO | RESPONSABLES | ENTREGADO | PRECIO | TOTAL

ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS codigo      TEXT;
ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS modelo      TEXT;
ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS responsable TEXT;
ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS cantidad    INTEGER;
ALTER TABLE wc_movimientos ADD COLUMN IF NOT EXISTS precio      NUMERIC(10,2);
