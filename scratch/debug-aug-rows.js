import https from 'https';

const pubId = '2PACX-1vSnrxKOEjlC6mgJfxXIP_lFp8oM1QZfM23cFXUEiKayplr9RxpdHKuynz-UGeyS2l1ZqpxPf_xkBOTW';
const gid = '1001';

console.log('--- INSPECTING AUGUST ROWS FOR INV-08, INV-10, INV-11, INV-13, INV-14 ---');

const url = `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?gid=${gid}&single=true&output=csv`;

https.get(url, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => parseAndPrint(data));
    });
    return;
  }
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => parseAndPrint(data));
});

function parseAndPrint(csvText) {
  const lines = csvText.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('inv-08') || line.includes('inv-10') || line.includes('inv-11') || line.includes('inv-13') || line.includes('inv-14')) {
      console.log(`Line ${i}:`, line);
    }
  });
}
