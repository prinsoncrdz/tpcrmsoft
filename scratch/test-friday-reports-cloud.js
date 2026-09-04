import https from 'https';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw_zv8kOSrJZOkN8PjW4btdMaoRSQr8k6kQ2Kbm-fhWOrywJOgV3o4kfUK7e10sHf6LKQ/exec';

console.log('--- TESTING FRIDAY REPORTS CLOUD BACKEND FETCH ---');

https.get(`${GAS_URL}?action=getFridayReports&t=${Date.now()}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Raw getFridayReports response:', data);
  });
});
