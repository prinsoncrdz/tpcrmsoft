// ============================================================================
// TURNING POINT RETAIL SOLUTIONS - AWS LAMBDA PETTY CASH HANDLER (NODE.JS 20.X)
// File: aws/lambdas/handlePettyCash.js
// ============================================================================

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'TurningPoint_PettyCash';

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const queryParams = event.queryStringParameters || {};
  const action = queryParams.action || '';

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
    // 1. GET MONTH-WISE PETTY CASH TRANSACTIONS
    if (method === 'GET') {
      const monthTag = queryParams.monthTag || queryParams.gid || 'PETTY_CASH_AUG';

      let items = [];
      if (monthTag === 'PETTY_CASH_DASHBOARD' || monthTag === 'ALL') {
        const command = new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
          ExpressionAttributeValues: { ':false': false }
        });
        const response = await docClient.send(command);
        items = response.Items || [];
      } else {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `PETTYCASH#${monthTag}`
          }
        });
        const response = await docClient.send(command);
        items = (response.Items || []).filter(item => !item.isDeleted);
      }

      // Sort Date-Wise (DD-MM-YYYY or YYYY-MM-DD)
      items.sort((a, b) => new Date(a.date || '2026-08-01') - new Date(b.date || '2026-08-01'));

      // Calculate Month-Wise Payment Breakdown Cards & Totals
      let abaTotal = 0;
      let cardTotal = 0;
      let cashTotal = 0;
      let bankTotal = 0;
      let totalSpent = 0;

      items.forEach(item => {
        const amt = parseFloat((item.cardSpent || item.cashOut || item.cashIn || '0').toString().replace('$', '').replace(/,/g, '')) || 0;
        const methodLower = (item.paymentMethod || '').toLowerCase();

        if (methodLower.includes('aba') || methodLower.includes('qr')) abaTotal += amt;
        else if (methodLower.includes('card') || methodLower.includes('online')) cardTotal += amt;
        else if (methodLower.includes('cash')) cashTotal += amt;
        else if (methodLower.includes('bank') || methodLower.includes('transfer')) bankTotal += amt;
        else cardTotal += amt;

        totalSpent += amt;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          data: items,
          metrics: {
            abaTotal: `$${abaTotal.toFixed(2)}`,
            cardTotal: `$${cardTotal.toFixed(2)}`,
            cashTotal: `$${cashTotal.toFixed(2)}`,
            bankTotal: `$${bankTotal.toFixed(2)}`,
            totalSpent: `$${totalSpent.toFixed(2)}`
          }
        })
      };
    }

    // 2. POST ADD / EDIT / DELETE PETTY CASH TRANSACTION
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const postAction = body.action || action;

      if (postAction === 'deletePettyCash') {
        const itemId = body.itemId || body.id;
        const monthTag = body.monthTag || 'PETTY_CASH_AUG';

        const command = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `PETTYCASH#${monthTag}`,
            SK: `ITEM#${itemId}`
          }
        });
        await docClient.send(command);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ status: 'success', message: 'Transaction deleted via AWS Lambda & DynamoDB' })
        };
      }

      // Add or Edit Transaction
      const item = body.item || body;
      const monthTag = item.monthTag || 'PETTY_CASH_AUG';
      const invoiceNo = item.voucherNo || item.invoiceNumber || `INV-${Date.now()}`;

      const dbRecord = {
        PK: `PETTYCASH#${monthTag}`,
        SK: `ITEM#${item.id || invoiceNo}`,
        id: item.id || invoiceNo,
        monthTag: monthTag,
        date: item.date || new Date().toISOString().split('T')[0],
        description: item.description || 'General Expense',
        invoiceNumber: invoiceNo,
        voucherNo: invoiceNo,
        category: item.category || 'Supplies',
        paymentMethod: item.paymentMethod || 'Card/Online',
        paidBy: item.paidBy || 'Admin Manager',
        cashIn: item.cashIn || '$0.00',
        cashOut: item.cashOut || '$0.00',
        cardSpent: item.cardSpent || '$0.00',
        isDeleted: false,
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
        body: JSON.stringify({ status: 'success', message: 'Petty cash saved to Amazon DynamoDB', item: dbRecord })
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
