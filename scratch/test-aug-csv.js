import https from 'https';

const docId = '1hy0DmROBeDcDQMOKdSPwQGU3SxK08Hrm0uQQHd7sVX4';
const pubId = '2PACX-1vSnrxKOEjlC6mgJfxXIP_lFp8oM1QZfM23cFXUEiKayplr9RxpdHKuynz-UGeyS2l1ZqpxPf_xkBOTW';
const gid = '1001';

console.log('--- FETCHING AUGUST PETTY CASH GOOGLE SHEET CSV ---');

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
  console.log('CSV Length:', csvText.length);
  const lines = csvText.split('\n');
  console.log('Total Raw Lines:', lines.length);
  console.log('\n--- FIRST 15 LINES ---');
  lines.slice(0, 15).forEach((line, i) => console.log(`Line ${i}:`, line));
}
