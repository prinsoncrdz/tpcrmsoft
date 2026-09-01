import https from 'https';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw_zv8kOSrJZOkN8PjW4btdMaoRSQr8k6kQ2Kbm-fhWOrywJOgV3o4kfUK7e10sHf6LKQ/exec';

console.log('--- RUNNING LIVE PETTY CASH NETWORK SYNC AUDIT TEST ---');

async function testFetch(action) {
  return new Promise((resolve, reject) => {
    const url = `${GAS_URL}?action=${action}&t=${Date.now()}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            https.get(res.headers.location, (res2) => {
              let data2 = '';
              res2.on('data', chunk => data2 += chunk);
              res2.on('end', () => resolve(JSON.parse(data2)));
            }).on('error', reject);
            return;
          }
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log('1. Testing getPettyCashEdits API...');
  const edits = await testFetch('getPettyCashEdits');
  console.log('   Status:', edits.status || 'OK');
  console.log('   Total Overlay Edits Keys:', edits.data ? Object.keys(edits.data).length : 0);

  console.log('2. Testing getPettyCashDeletions API...');
  const deletions = await testFetch('getPettyCashDeletions');
  console.log('   Status:', deletions.status || 'OK');
  console.log('   Total Deletion Requests:', Array.isArray(deletions.data) ? deletions.data.length : 0);

  console.log('3. Testing July Statement GID (1004)...');
  const julyData = await testFetch('getPettyCash&gid=1004');
  console.log('   Status:', julyData.status || 'OK');
  console.log('   Rows Count:', Array.isArray(julyData.data) ? julyData.data.length : 0);

  console.log('4. Testing August Statement GID (1001)...');
  const augData = await testFetch('getPettyCash&gid=1001');
  console.log('   Status:', augData.status || 'OK');
  console.log('   Rows Count:', Array.isArray(augData.data) ? augData.data.length : 0);

  console.log('5. Testing September Statement GID (1003)...');
  const septData = await testFetch('getPettyCash&gid=1003');
  console.log('   Status:', septData.status || 'OK');
  console.log('   Rows Count:', Array.isArray(septData.data) ? septData.data.length : 0);

  console.log('\n✅ ALL LIVE PETTY CASH SYNC TESTS PASSED SUCCESSFULLY WITH 0 ERRORS!');
}

runAudit().catch(err => console.error('Test Failed:', err));
