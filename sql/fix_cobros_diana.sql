-- =============================================================
-- MAESTRO — CORRECCIÓN: Eliminar 12 cobros IZIPAY erróneos
-- Estos montos eran solo NOTAS en el Excel, no cobros reales.
-- Total a eliminar: S/. 43,882.02
-- Total correcto después: S/. 848,451.27
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. S/. 1,665.30 — 2-nov-2024 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 1665.30
  AND fecha = '2024-11-02' AND tipo_pago = 'IZIPAY';

-- 2. S/. 2,844.40 — 5-nov-2024 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 2844.40
  AND fecha = '2024-11-05' AND tipo_pago = 'IZIPAY';

-- 3 y 4. S/. 4,160.00 x2 — 5-nov-2024 IZIPAY GHC (notas, no cobros)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 4160.00
  AND fecha = '2024-11-05' AND tipo_pago = 'IZIPAY';

-- 5. S/. 521.04 — 14-nov-2024 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 521.04
  AND fecha = '2024-11-14' AND tipo_pago = 'IZIPAY';

-- 6. S/. 8,732.88 — 7-dic-2024 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 8732.88
  AND fecha = '2024-12-07' AND tipo_pago = 'IZIPAY';

-- 7. S/. 3,669.12 — 26-dic-2024 IZIPAY (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 3669.12
  AND fecha = '2024-12-26' AND tipo_pago = 'IZIPAY';

-- 8. S/. 2,329.60 — 5-feb-2025 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 2329.60
  AND fecha = '2025-02-05' AND tipo_pago = 'IZIPAY';

-- 9. S/. 2,912.00 — 26-feb-2025 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 2912.00
  AND fecha = '2025-02-26' AND tipo_pago = 'IZIPAY';

-- 10. S/. 6,011.20 — 21-mar-2025 IZIPAY (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 6011.20
  AND fecha = '2025-03-21' AND tipo_pago = 'IZIPAY';

-- 11. S/. 1,664.00 — 7-abr-2025 IZIPAY GHC (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 1664.00
  AND fecha = '2025-04-07' AND tipo_pago = 'IZIPAY';

-- 12. S/. 5,212.48 — 11-abr-2025 IZIPAY (nota, no cobro)
DELETE FROM wc_movimientos
WHERE tipo = 'cobro' AND cliente = 'DIANA' AND monto = 5212.48
  AND fecha = '2025-04-11' AND tipo_pago = 'IZIPAY';


-- === VERIFICACIÓN (ejecutar después) ===
-- SELECT SUM(monto) as total_cobrado,
--        COUNT(*) as total_filas
-- FROM wc_movimientos
-- WHERE tipo = 'cobro' AND cliente = 'DIANA';
-- Resultado esperado: total_cobrado = 848,451.27
