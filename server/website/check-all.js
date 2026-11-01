// check-all.js
async function check() {
  console.log('Checking Server (5000) and Client (5173)...');
  try {
    const sRes = await fetch('http://localhost:5000/api/health');
    const sData = await sRes.json();
    console.log('Server /api/health:', sRes.status, sData.status);

    const cRes = await fetch('http://localhost:5173/');
    console.log('Client HTTP status:', cRes.status, cRes.headers.get('content-type'));

    const proxyRes = await fetch('http://localhost:5173/api/health');
    const proxyData = await proxyRes.json();
    console.log('Client Proxy /api/health:', proxyRes.status, proxyData.status);

    console.log('\nAll systems operational!');
  } catch (err) {
    console.error('Check failed:', err.message);
  }
}

check();
