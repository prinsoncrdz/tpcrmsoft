import https from 'https';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw_zv8kOSrJZOkN8PjW4btdMaoRSQr8k6kQ2Kbm-fhWOrywJOgV3o4kfUK7e10sHf6LKQ/exec';

console.log('--- TESTING FRIDAY REPORT CLOUD SAVE & FETCH END-TO-END ---');

const testReport = {
  id: `report-test-${Date.now()}`,
  staffName: 'Srelyang Thim',
  roleDesignation: 'Project Owner',
  weekEnding: '04-09-2026',
  userEmail: 'srelyang.thim@turningpointretail.com',
  departmentReportingTo: 'CEO Walter Dantis',
  keyAchievements: 'Completed CRM project milestone verification and client documentation.',
  tasks: [
    {
      id: 'task-1',
      projectArea: 'Retail Expansion',
      taskTitle: 'Store layout finalization',
      deadline: '04-09-2026',
      priorityLevel: 'High',
      progressPct: 100,
      taskStatus: 'Completed'
    }
  ],
  topPriorityNextWeek: 'Prepare monthly executive presentation deck',
  status: 'Submitted to CEO',
  submittedAt: new Date().toISOString()
};

function saveReport() {
  const data = JSON.stringify({
    action: 'saveFridayReports',
    reports: [testReport],
    tasks: [testReport]
  });

  const req = https.request(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Save Response:', body);
      fetchReports();
    });
  });

  req.write(data);
  req.end();
}

function fetchReports() {
  https.get(`${GAS_URL}?action=getFridayReports&t=${Date.now()}`, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Fetch Response:', body);
    });
  });
}

saveReport();
