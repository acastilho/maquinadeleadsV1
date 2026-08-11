const axios = require('axios');
const { randomUUID } = require('crypto');
require('dotenv').config();

const workflowId = 'GnD2utIgZPipiNym';

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL,
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY,
    'Content-Type': 'application/json',
  },
});

(async () => {
  const { data: workflow } = await client.get(
    `/api/v1/workflows/${workflowId}`
  );

  if (workflow.active) {
    await client.post(`/api/v1/workflows/${workflowId}/deactivate`);
  }

  workflow.nodes = workflow.nodes.map((node) => {
    if (node.type !== 'n8n-nodes-base.webhook') return node;

    return {
      ...node,
      webhookId: node.webhookId || randomUUID(),
    };
  });

  const payload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections || {},
    settings: workflow.settings || {},
  };

  await client.put(`/api/v1/workflows/${workflowId}`, payload);

  const { data: activated } = await client.post(
    `/api/v1/workflows/${workflowId}/activate`
  );

  const webhook = activated.nodes.find(
    (node) => node.type === 'n8n-nodes-base.webhook'
  );

  console.log({
    active: activated.active,
    webhookId: webhook?.webhookId,
    path: webhook?.parameters?.path,
  });
})().catch((err) => {
  console.error({
    status: err.response?.status,
    details: err.response?.data || err.message,
  });
  process.exit(1);
});
