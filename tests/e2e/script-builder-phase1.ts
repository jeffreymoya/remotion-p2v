
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const BASE_URL = 'http://localhost:3000';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchJson(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API Error ${res.status} ${path}: ${JSON.stringify(data)}`);
  }
  return data;
}

describe('Script Builder Phase 1 E2E', { timeout: 600000 }, () => {
  let projectId: string;
  let blueprintId: string;
  let draftId: string;

  before(async () => {
    console.log('🚀 Starting Script Builder Phase 1 E2E Test');
    // Step 1: Create Project
    console.log('1. Creating Project...');
    const projectRes = await fetchJson('POST', '/api/projects', {
      name: `E2E Test ${Date.now()}`,
      topic: 'The Future of AI Agents',
      aspectRatio: '16:9'
    });
    projectId = projectRes.project.id;
    console.log(`   ✅ Project created: ${projectId}`);
  });

  it('should generate blueprint', async () => {
    console.log('2. Generating Blueprint (may take 30s)...');
    const res = await fetchJson('POST', '/api/script-builder/blueprint', {
      projectId,
      topic: 'The Future of AI Agents',
      targetDurationMs: 300000 // 5 mins
    });
    blueprintId = res.blueprint.id;
    assert.ok(blueprintId, 'Blueprint ID missing');
    assert.equal(res.blueprint.status, 'GENERATING', 'Status should be GENERATING initially');
    
    // Poll for blueprint completion (if it's async, but currently it seems sync-ish or fast enough in mock?)
    // Actually the PRD says it returns the blueprint with beats.
    // Let's check the beats.
    if (res.blueprint.beats) {
       console.log(`   ✅ Blueprint generated with ${res.blueprint.beats.length} beats`);
       assert.ok(res.blueprint.beats.length > 0, 'No beats generated');
    } else {
        // If it's async, we might need to poll GET /api/script-builder/blueprint/[id]
        // But the current implementation seems to return it.
        console.log('   ⚠️ No beats in immediate response, checking status...');
    }
  });

  it('should approve blueprint', async () => {
    console.log('3. Approving Blueprint...');
    const res = await fetchJson('PUT', `/api/script-builder/blueprint/${blueprintId}/approve`);
    assert.equal(res.blueprint.status, 'APPROVED');
    console.log('   ✅ Blueprint approved');
  });

  it('should execute script generation', async () => {
    console.log('4. Starting Script Execution...');
    const res = await fetchJson('POST', '/api/script-builder/execute', {
      blueprintId
    });
    draftId = res.scriptDraftId;
    assert.ok(draftId, 'Script Draft ID missing');
    console.log(`   ✅ Execution started: ${draftId}`);
  });

  it('should poll for execution completion', async () => {
    console.log('5. Polling for completion...');
    let status = 'DRAFTING'; // or 'in_progress'
    let attempts = 0;
    const maxAttempts = 60; // 5 mins

    while (['DRAFTING', 'in_progress', 'GENERATING'].includes(status) && attempts < maxAttempts) {
      await sleep(5000);
      const res = await fetchJson('GET', `/api/script-builder/execute/${draftId}/status`);
      status = res.status;
      const progress = res.completedBeats || 0;
      const total = res.totalBeats || 0;
      console.log(`   ... Status: ${status} (${progress}/${total} beats)`);
      
      if (status === 'COMPLETED' || status === 'POLISHED') break;
      if (status === 'FAILED') throw new Error('Script execution failed');
      attempts++;
    }

    if (status !== 'COMPLETED' && status !== 'POLISHED') {
      throw new Error(`Timeout waiting for execution. Last status: ${status}`);
    }
    console.log('   ✅ Script execution completed');
  });

  it('should segment script', async () => {
    console.log('6. Segmenting Script...');
    const res = await fetchJson('POST', '/api/script-builder/segment', {
      draftId
    });
    // API returns { script: { segments: ... } }
    assert.ok(res.script, 'Script object missing');
    assert.ok(res.script.segments.length > 0, 'No segments generated');
    console.log(`   ✅ Segmentation complete: ${res.script.segments.length} segments`);
  });
});
