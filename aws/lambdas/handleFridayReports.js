// ============================================================================
// TURNING POINT RETAIL SOLUTIONS - AWS LAMBDA FRIDAY REPORTS HANDLER (NODE.JS 20.X)
// File: aws/lambdas/handleFridayReports.js
// ============================================================================

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'TurningPoint_FridayReports';

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  try {
    if (method === 'GET') {
      const command = new ScanCommand({ TableName: TABLE_NAME });
      const response = await docClient.send(command);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', data: response.Items || [] })
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const report = body.report || body;
      const reportId = report.id || `REP-${Date.now()}`;
      const weekEnding = report.weekEnding || new Date().toISOString().split('T')[0];

      const dbRecord = {
        PK: `REPORT#${weekEnding}`,
        SK: `USER#${report.userEmail || report.submittedBy || 'staff'}`,
        id: reportId,
        weekEnding: weekEnding,
        userEmail: report.userEmail || '',
        userName: report.userName || report.submittedBy || '',
        tasksAccomplished: report.tasksAccomplished || [],
        blockers: report.blockers || '',
        nextWeekGoals: report.nextWeekGoals || [],
        ceoFeedback: report.ceoFeedback || '',
        submittedAt: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: dbRecord
      });
      await docClient.send(command);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', message: 'Friday report saved to DynamoDB', report: dbRecord })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', message: err.message })
    };
  }
};
