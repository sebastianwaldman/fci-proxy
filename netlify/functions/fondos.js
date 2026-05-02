exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  try {
    // Intentar CAFCI con headers completos de browser
    const cafciHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
      'Host': 'api.pub.cafci.org.ar',
      'Origin': 'https://www.cafci.org.ar',
      'Referer': 'https://www.cafci.org.ar/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };

    const r = await fetch('https://api.pub.cafci.org.ar/fondo?estado=1&limit=10000&include=gerente,tipoFondo,moneda,calificacion', {
      headers: cafciHeaders
    });

    if (!r.ok) throw new Error('CAFCI ' + r.status);
    const raw = await r.json();
    const fondos = raw.data || [];
    const EXCLUIR = ['PYMES','INFRAESTRUCTURA','CERRADO','LIQUIDACION','ASG','RG900'];
    const mapped = fondos
      .filter(f => !EXCLUIR.some(x => (f.tipoFondo && f.tipoFondo.nombre ? f.tipoFondo.nombre.toUpperCase() : '').includes(x)))
      .map(f => ({
        id: f.id,
        gestora: f.gerente ? f.gerente.nombre : 'Desconocida',
        nombre: f.nombre,
        tipo: f.tipoFondo && f.tipoFondo.id === 1 ? 'mm' : f.tipoFondo && f.tipoFondo.id === 4 ? 'rv' : f.tipoFondo && f.tipoFondo.id === 3 ? 'rm' : 'rf',
        moneda: f.moneda && f.moneda.id === 2 ? 'usd' : 'ars',
        horizonte: f.tipoFondo && f.tipoFondo.id === 1 ? 'corto' : f.tipoFondo && f.tipoFondo.id === 4 ? 'largo' : 'mediano',
        perfil: f.tipoFondo && f.tipoFondo.id === 1 ? 'conservador' : f.tipoFondo && f.tipoFondo.id === 4 ? 'agresivo' : 'moderado',
        rescate: f.plazoRescate === 0 ? 'Inmediato (T+0)' : f.plazoRescate === 1 ? '24 hs habiles' : f.plazoRescate === 2 ? '48 hs habiles' : 'Consultar',
        minimo: '$1.000',
        desc: f.objetivo || '',
        calificacion: f.calificacion ? f.calificacion.nombre : null,
        url: 'https://www.cafci.org.ar/ficha-fondo.html?q=' + f.id,
      }));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, total: mapped.length, data: mapped, ts: new Date().toISOString() }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};