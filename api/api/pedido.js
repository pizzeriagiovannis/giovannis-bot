export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_KEY;
  const pedidoData = req.body;

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const listRes = await fetch(
      `${SB_URL}/rest/v1/pedidos?select=num&created_at=gte.${hoy.toISOString()}&order=num.desc&limit=1`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const listData = await listRes.json();
    const nextNum = listData && listData.length > 0 ? (listData[0].num || 0) + 1 : 1;

    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const pedido = {
      num:       nextNum,
      dir:       pedidoData.dir      || 'Retira en local',
      entre:     pedidoData.entre    || '',
      tel:       pedidoData.tel      || '',
      tipo:      pedidoData.tipo     || 'retiro',
      pago:      pedidoData.pago     || 'Efectivo',
      envio:     pedidoData.envio    || 0,
      subtotal:  pedidoData.total    || 0,
      descuento: 0,
      descPct:   0,
      total:     pedidoData.total    || 0,
      items:     JSON.stringify(pedidoData.items || []),
      hora,
      obs:       pedidoData.obs      || '',
      pagado:    pedidoData.pago === 'MP',
      entregado: false,
      rendido:   false
    };

    const insertRes = await fetch(`${SB_URL}/rest/v1/pedidos`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(pedido)
    });

    const insertData = await insertRes.json();

    if (!insertRes.ok) throw new Error(JSON.stringify(insertData));

    res.status(200).json({ success: true, pedido: insertData[0] || pedido });
  } catch (e) {
    console.error('Error guardando pedido:', e);
    res.status(500).json({ error: e.message });
  }
}
