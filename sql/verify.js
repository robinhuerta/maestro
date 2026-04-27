// Parse the Excel data pasted by the user to find missing amounts
const excelData = `2-nov-2024		IZIPAY	GHC	S/.1,665.30
5-nov-2024		IZIPAY	GHC	 S/.  2,844.40 
5-nov-2024		IZIPAY	GHC	 S/.  4,160.00 
5-nov-2024		IZIPAY	GHC	 S/.  4,160.00 
14-nov-2024		IZIPAY	GHC	S/.521.04
7-dic-2024		IZIPAY	GHC	 S/.  8,732.88 
26-dic-2024		IZIPAY		 S/.  3,669.12 
5-feb-2025		IZIPAY	GHC	2329.60
26-feb-2025		IZIPAY	GHC	2912
21-mar-2025		IZIPAY		S/.6,011.20
7-abr-2025		IZIPAY	GHC	S/.1,664.00
11-abr-2025		IZIPAY		 S/.  5,212.48 `;

// These are rows where "a cuentas" column is EMPTY but the amount is in "descripcion"
const amounts = [1665.30, 2844.40, 4160.00, 4160.00, 521.04, 8732.88, 3669.12, 2329.60, 2912.00, 6011.20, 1664.00, 5212.48];
const total = amounts.reduce((a, b) => a + b, 0);

console.log('=== COBROS IZIPAY CON MONTO EN COLUMNA EQUIVOCADA ===');
console.log('(El monto está en "descripcion" en vez de "a cuentas")\n');

const dates = ['2-nov-2024','5-nov-2024','5-nov-2024','5-nov-2024','14-nov-2024','7-dic-2024','26-dic-2024','5-feb-2025','26-feb-2025','21-mar-2025','7-abr-2025','11-abr-2025'];

dates.forEach((d, i) => {
    console.log(`  ${(i+1).toString().padStart(2)}. ${d.padEnd(15)} IZIPAY   S/. ${amounts[i].toLocaleString('es-PE', {minimumFractionDigits: 2})}`);
});

console.log(`\n  TOTAL FALTANTE: S/. ${total.toLocaleString('es-PE', {minimumFractionDigits: 2})}`);
console.log(`\n=== VERIFICACIÓN ===`);
console.log(`  Excel dice:       S/. 848,451.27`);
console.log(`  + Faltantes:    + S/.  ${total.toLocaleString('es-PE', {minimumFractionDigits: 2})}`);
console.log(`  = Total real:     S/. ${(848451.27 + total).toLocaleString('es-PE', {minimumFractionDigits: 2})}`);
console.log(`  Supabase dice:    S/. 892,333.29`);
console.log(`  Diferencia:       S/. ${(848451.27 + total - 892333.29).toFixed(2)}`);
