// Quick check
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(data => {
    console.log('HEALTH_RESPONSE:', JSON.stringify(data));
    process.exit(0);
  })
  .catch(err => {
    console.error('HEALTH_ERROR:', err.message);
    process.exit(1);
  });

