// ============================================================================
// TURNING POINT RETAIL SOLUTIONS - AWS LAMBDA P&L HANDLER (NODE.JS 20.X)
// File: aws/lambdas/handlePnL.js
// ============================================================================

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'TurningPoint_PnL';

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
      const pnl = body.pnl || body;
      const monthKey = pnl.month || new Date().toISOString().slice(0, 7);

      const dbRecord = {
        PK: `PNL#${monthKey}`,
        SK: 'METADATA',
        month: monthKey,
        revenue: parseFloat(pnl.revenue || 0),
        cogs: parseFloat(pnl.cogs || 0),
        grossProfit: parseFloat(pnl.grossProfit || 0),
        opex: parseFloat(pnl.opex || 0),
        netIncome: parseFloat(pnl.netIncome || 0),
        updatedAt: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: dbRecord
      });
      await docClient.send(command);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', message: 'PnL saved to DynamoDB', pnl: dbRecord })
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
