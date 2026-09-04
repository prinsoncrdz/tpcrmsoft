import https from 'https';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw_zv8kOSrJZOkN8PjW4btdMaoRSQr8k6kQ2Kbm-fhWOrywJOgV3o4kfUK7e10sHf6LKQ/exec';

function fetchWithRedirect(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect (GET request for redirected location)
        return https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
        }).on('error', reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('--- TESTING GOOGLE APPS SCRIPT POST & GET WITH REDIRECT FOLLOWING ---');
  
  const testReport = {
    id: `report-test-1`,
    staffName: 'Srelyang Thim',
    roleDesignation: 'Project Owner',
    weekEnding: '04-09-2026',
    userEmail: 'srelyang.thim@turningpointretail.com',
    departmentReportingTo: 'CEO Walter Dantis',
    keyAchievements: 'Completed CRM project milestone verification and client documentation.',
    tasks: [],
    status: 'Submitted to CEO',
    submittedAt: new Date().toISOString()
  };

  const postPayload = JSON.stringify({
    action: 'saveFridayReports',
    reports: [testReport],
    tasks: [testReport]
  });

  const saveRes = await fetchWithRedirect(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  }, postPayload);

  console.log('POST Response:', saveRes);

  const getRes = await fetchWithRedirect(`${GAS_URL}?action=getFridayReports&t=${Date.now()}`);
  console.log('GET Response:', getRes);
}

runTest();
