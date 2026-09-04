import https from 'https';

const projectRef = 'mpfhcds9kp54qlvpj4hd0a';
const url = `https://${projectRef}.supabase.co/rest/v1/projects?select=*`;
const apiKey = 'sb_publishable_MpfhCDs9Kp54qLVPJ4HD0A_P3eTT-Zq';

console.log('--- TESTING SUPABASE PROJECT CONNECTION ---');
console.log('URL:', `https://${projectRef}.supabase.co`);
console.log('Key:', apiKey);

const options = {
  headers: {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
  });
}).on('error', (err) => {
  console.error('Connection Error:', err);
});
