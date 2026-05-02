exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  try {
    // Probar endpoint de estadisticas que tiene menos restricciones
    const endpoints = [
      'https://api.pub.cafci.org.ar/fondo?estado=1&limit=500',
      'https://estadisticas.cafci.org.ar/fondo?estado=1&limit=500',
    ];
    let raw = null;
    let lastError = '';
    for (const url of endpoints) {
      try {
        const r = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.cafci.org.ar/',
            'Origin': 'https://www.cafci.org.ar'
          }
        });
        if (r.ok) { raw = await r.json(); break; }
        lastError = url + ' -> ' + r.status;
      } catch(err) { lastError = err.message; }
    }
    if (!raw) throw new Error('Todos los endpoints fallaron: ' + lastError);
    const fondos = raw.data || [];
    const mapped = fondos.slice(0, 100).map(f => ({
      id: f.id,
      gestora: f.gerente ? f.gerente.nombre : 'Desconocida',
      nombre: f.nombre,
      tipo: f.tipoFondo && f.tipoFondo.id === 1 ? 'mm' : f.tipoFondo && f.tipoFondo.id === 4 ? 'rv' : 'rf',
      moneda: f.moneda && f.moneda.id === 2 ? 'usd' : 'ars',
    }));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, total: fondos.length, sample: mapped.length, data: mapped, lastError, ts: new Date().toISOString() }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};