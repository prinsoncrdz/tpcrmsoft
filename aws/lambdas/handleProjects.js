// ============================================================================
// TURNING POINT RETAIL SOLUTIONS - AWS LAMBDA PROJECTS HANDLER (NODE.JS 20.X)
// File: aws/lambdas/handleProjects.js
// ============================================================================

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'TurningPoint_Projects';

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
    // 1. GET ALL PROJECTS
    if (method === 'GET') {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
        ExpressionAttributeValues: { ':false': false }
      });

      const response = await docClient.send(command);
      const items = response.Items || [];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', data: items })
      };
    }

    // 2. POST ADD / UPDATE / DELETE PROJECT
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const postAction = body.action || action;

      if (postAction === 'deleteProject') {
        const projectId = body.projectId || body.id;
        const command = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `PROJECT#${projectId}`, SK: 'METADATA' },
          UpdateExpression: 'SET isDeleted = :true, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':true': true,
            ':updatedAt': new Date().toISOString()
          }
        });
        await docClient.send(command);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ status: 'success', message: 'Project marked deleted' })
        };
      }

      // Save / Upsert Project
      const project = body.project || body;
      const projectId = project.projectId || project.id || `TP-${Date.now()}`;

      const dbRecord = {
        PK: `PROJECT#${projectId}`,
        SK: 'METADATA',
        id: projectId,
        projectId: projectId,
        companyName: project.companyName || project.projectName || 'New Project',
        projectName: project.projectName || project.companyName || 'New Project',
        client: project.client || project.clientName || 'Turning Point Retail',
        sector: project.sector || 'RETAIL & FRANCHISE',
        value: project.value || '$0.00',
        contractValueUsd: parseFloat((project.value || '0').toString().replace('$', '').replace(/,/g, '')) || 0,
        depositPaid: project.depositPaid || '$0.00',
        advanceAmountUsd: parseFloat((project.depositPaid || '0').toString().replace('$', '').replace(/,/g, '')) || 0,
        owner: project.owner || project.projectOwner || 'Walter Dantis (CEO)',
        assignee: project.assignee || project.assignedTo || 'Sreylang Thim',
        startDate: project.startDate || new Date().toISOString().split('T')[0],
        targetEndDate: project.targetEndDate || '-',
        completion: project.completion || '0%',
        status: project.status || 'Pending CEO Approval',
        priority: project.priority || 'High',
        statusUpdate: project.statusUpdate || '',
        driveLink: project.driveLink || '',
        nextAction: project.nextAction || '',
        nextActionDueDate: project.nextActionDueDate || '-',
        financials: project.financials || {},
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
        body: JSON.stringify({ status: 'success', message: 'Project saved to AWS DynamoDB', project: dbRecord })
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
