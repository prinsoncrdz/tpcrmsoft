/**
 * Turning Point Retail CRM & Petty Cash - Google Apps Script Backend Bridge
 * 
 * INSTRUCTIONS TO DEPLOY ON GOOGLE SHEETS:
 * 1. Open Google Sheet: https://docs.google.com/spreadsheets/d/1hy0DmROBeDcDQMOKdSPwQGU3SxK08Hrm0uQQHd7sVX4/edit
 * 2. Click Extensions > Apps Script
 * 3. Delete all existing code and replace with this complete Code.gs script.
 * 4. Click "Deploy" (top right) > "New deployment"
 * 5. Click Gear Icon ⚙️ > Select "Web app"
 * 6. Set Description: "Turning Point CRM & Live Chat API v3"
 * 7. Set Execute as: "Me"
 * 8. Set Who has access: "Anyone" (CRITICAL: Must be "Anyone" so the website can read/write)
 * 9. Click "Deploy" > Copy the Web App URL!
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var postData = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }
    
    var action = params.action || postData.action || 'read';
    var gid = params.gid || postData.gid || '1178829100';

    if (action === 'read') {
      return handleRead(gid);
    } else if (action === 'updateCell') {
      return handleCellUpdate(postData);
    } else if (action === 'addProject') {
      return handleAddProject(postData);
    } else if (action === 'addPettyCash') {
      return handleAddPettyCash(postData);
    } else if (action === 'getChatMessages') {
      return handleGetChatMessages();
    } else if (action === 'sendChatMessage') {
      return handleSendChatMessage(postData);
    }

    return responseJSON({ status: 'success', message: 'Turning Point CRM API Operational' });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function handleRead(gid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(ss, gid);
  if (!sheet) {
    return responseJSON({ status: 'error', message: 'Sheet tab not found for GID ' + gid });
  }
  
  var values = sheet.getDataRange().getValues();
  
  var cleanValues = values.map(function(row) {
    return row.map(function(cell) {
      if (cell instanceof Date) {
        return Utilities.formatDate(cell, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
      }
      return cell === null || cell === undefined ? '' : cell.toString();
    });
  });
  
  return responseJSON({ status: 'success', gid: gid, sheetName: sheet.getName(), data: cleanValues });
}

function handleCellUpdate(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(ss, data.gid || '1178829100');
  
  if (!sheet) return responseJSON({ status: 'error', message: 'Sheet not found' });
  
  var rowIndex = parseInt(data.rowIndex);
  var columnIndex = parseInt(data.columnIndex);
  var value = data.value;
  
  if (rowIndex > 0 && columnIndex > 0) {
    sheet.getRange(rowIndex, columnIndex).setValue(value);
    
    if ((data.gid || '1178829100') === '1178829100') {
      sheet.getRange(rowIndex, 17).setValue(Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd-MMM-yyyy'));
    }
    
    return responseJSON({ status: 'success', message: 'Cell updated in Google Sheet', rowIndex: rowIndex, colIndex: columnIndex, value: value });
  }
  
  return responseJSON({ status: 'error', message: 'Invalid row or column index' });
}

function handleAddProject(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(ss, '1178829100');
  
  if (!sheet) return responseJSON({ status: 'error', message: 'CRM Sheet tab not found' });
  
  var project = data.project || {};
  var lastRow = sheet.getLastRow() + 1;
  
  var rowValues = [
    project.projectId || ('TP-PRJ-' + Math.floor(100 + Math.random() * 900)),
    project.projectName || '',
    project.client || '',
    project.sector || 'RETAIL & FRANCHISE',
    project.owner || 'Walter Dantis (CEO)',
    project.assignee || 'Srelyang Thim',
    project.startDate || Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd'),
    project.targetEndDate || '2026-12-31',
    project.completion || '0%',
    project.status || 'In Progress',
    project.priority || 'High',
    project.statusUpdate || 'Project created in Turning Point CRM.',
    project.driveLink || '',
    project.nextAction || '',
    project.nextActionDueDate || '',
    '', // Days to deadline formula
    Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd-MMM-yyyy'),
    project.remarks || ''
  ];
  
  sheet.getRange(lastRow, 1, 1, rowValues.length).setValues([rowValues]);
  
  return responseJSON({ status: 'success', message: 'Project added to Google Sheet', rowIndex: lastRow });
}

function handleAddPettyCash(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var gid = data.gid || '1004';
  var sheet = getSheetByGid(ss, gid);
  
  if (!sheet) return responseJSON({ status: 'error', message: 'Petty Cash Sheet tab not found' });
  
  var item = data.item || {};
  var lastRow = sheet.getLastRow() + 1;
  
  var rowValues = [
    '',
    item.date || Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd'),
    item.description || '',
    item.voucherNo || '-',
    item.category || 'Supplies',
    item.paymentMethod || 'Card/Online',
    item.paidBy || 'Admin Manager',
    item.cashIn || '$0.00',
    item.cashOut || '$0.00',
    item.cardSpent || '$0.00'
  ];
  
  sheet.getRange(lastRow, 1, 1, rowValues.length).setValues([rowValues]);
  
  return responseJSON({ status: 'success', message: 'Petty Cash transaction added to Google Sheet', rowIndex: lastRow });
}

// Global Chat Messages Cloud Read Handler
function handleGetChatMessages() {
  var props = PropertiesService.getScriptProperties();
  var rawMessages = props.getProperty('TP_GLOBAL_CHAT_MESSAGES') || '[]';
  var messages = [];
  try {
    messages = JSON.parse(rawMessages);
  } catch (err) {
    messages = [];
  }

  // Prune messages older than 24 hours (86,400,000 ms)
  var now = new Date().getTime();
  var oneDayMs = 24 * 60 * 60 * 1000;
  var validMessages = messages.filter(function(m) {
    return (now - (m.timestamp || 0)) < oneDayMs;
  });

  return responseJSON({ status: 'success', data: validMessages });
}

// Global Chat Messages Cloud Send Handler
function handleSendChatMessage(data) {
  var props = PropertiesService.getScriptProperties();
  var rawMessages = props.getProperty('TP_GLOBAL_CHAT_MESSAGES') || '[]';
  var messages = [];
  try {
    messages = JSON.parse(rawMessages);
  } catch (err) {
    messages = [];
  }

  var msg = data.message || {};
  var now = new Date().getTime();
  var oneDayMs = 24 * 60 * 60 * 1000;

  // Prune expired messages older than 24 hours
  var validMessages = messages.filter(function(m) {
    return (now - (m.timestamp || 0)) < oneDayMs;
  });

  // Append new message if valid
  if (msg.text) {
    validMessages.push(msg);
  }

  props.setProperty('TP_GLOBAL_CHAT_MESSAGES', JSON.stringify(validMessages));

  return responseJSON({ status: 'success', message: 'Chat message synced globally', data: validMessages });
}

function getSheetByGid(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId().toString() === gid.toString()) {
      return sheets[i];
    }
  }
  
  var gidStr = gid.toString();
  if (gidStr === '1178829100') return ss.getSheetByName('CRM Sheet') || sheets[0];
  if (gidStr === '2002') return ss.getSheetByName('Petty Cash Dashboard') || sheets[1];
  if (gidStr === '1004') return ss.getSheetByName('Petty Cash July 2026') || sheets[2];
  if (gidStr === '1001') return ss.getSheetByName('Petty Cash August 2026') || sheets[3];
  if (gidStr === '1003') return ss.getSheetByName('Petty Cash September 2026') || sheets[4];
  
  return sheets[0];
}

function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
