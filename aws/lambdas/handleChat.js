// ============================================================================
// TURNING POINT RETAIL SOLUTIONS - AWS LAMBDA CHAT HANDLER (NODE.JS 20.X)
// File: aws/lambdas/handleChat.js
// ============================================================================

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'TurningPoint_Chat';

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
      const items = response.Items || [];
      items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', data: items })
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const msg = body.message || body;
      const msgId = msg.id || `MSG-${Date.now()}`;
      const now = new Date().toISOString();

      const dbRecord = {
        PK: 'CHAT#GLOBAL',
        SK: `MSG#${now}#${msgId}`,
        id: msgId,
        senderName: msg.senderName || msg.sender || 'Staff',
        senderEmail: msg.senderEmail || '',
        text: msg.text || msg.content || '',
        attachmentUrl: msg.attachmentUrl || '',
        createdAt: now
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: dbRecord
      });
      await docClient.send(command);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', message: 'Chat message saved to DynamoDB', messageItem: dbRecord })
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
