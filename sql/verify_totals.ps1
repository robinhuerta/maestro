# Verify SQL import totals
$cobrosLines = Get-Content "c:\proyectos\MAESTRO\sql\diana_cobros_import.sql" | Where-Object { $_ -match "^\('cobro'" }
$entregasLines = Get-Content "c:\proyectos\MAESTRO\sql\diana_entregas_import.sql" | Where-Object { $_ -match "^\('entrega'" }

$totalCobros = 0
foreach ($line in $cobrosLines) {
    if ($line -match ",'DIANA',(\d+\.?\d*),") {
        $totalCobros += [decimal]$matches[1]
    }
}

$totalEntregas = 0
foreach ($line in $entregasLines) {
    if ($line -match ",'DIANA',(\d+\.?\d*),") {
        $totalEntregas += [decimal]$matches[1]
    }
}

Write-Host "=== VERIFICACION SQL ==="
Write-Host "Cobros: $($cobrosLines.Count) filas | Total: S/. $totalCobros"
Write-Host "Entregas: $($entregasLines.Count) filas | Total: S/. $totalEntregas"
Write-Host "Por Cobrar (entregado - cobrado): S/. $($totalEntregas - $totalCobros)"
Write-Host ""
Write-Host "=== EXCEL del usuario ==="
Write-Host "Cobrado: S/. 848,451.27"
Write-Host "Entregado: S/. 994,393.00"
Write-Host "Por Cobrar: S/. 145,941.73"
Write-Host ""
Write-Host "=== SITIO EN VIVO ==="
Write-Host "Cobrado: S/. 892,333.29"
Write-Host "Entregado: S/. 994,393.00"
Write-Host "Por Cobrar: S/. 102,059.71"
Write-Host ""
Write-Host "Diferencia cobrado (vivo vs SQL): S/. $(892333.29 - $totalCobros)"
