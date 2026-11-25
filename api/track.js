export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: '尚未設定 TRACK17_API_KEY 環境變數' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ ok: false, error: '缺少單號 code' });
  }

  try {
    await fetch('https://api.17track.net/track/v2.4/register', {
      method: 'POST',
      headers: {
        '17token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ number: code }])
    });

    const infoRes = await fetch('https://api.17track.net/track/v2.4/gettrackinfo', {
      method: 'POST',
      headers: {
        '17token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ number: code }])
    });

    const data = await infoRes.json();
    const accepted = data?.data?.accepted?.[0];
    const trackInfo = accepted?.track_info;
    const latestEvent = trackInfo?.tracking?.providers?.[0]?.events?.[0]?.description || '';
    const statusText = trackInfo?.latest_status?.status || '';

    return res.status(200).json({
      ok: true,
      code,
      statusText,
      latestEvent: latestEvent || statusText || '尚無最新物流事件'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || '查詢失敗' });
  }
}
