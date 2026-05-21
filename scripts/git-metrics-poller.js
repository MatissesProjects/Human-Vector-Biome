#!/usr/bin/env node

/**
 * git-metrics-poller.js
 * 
 * Aggregates git activity metrics since midnight for the local repository
 * and POSTs them to the Human-Vector-Biome Hub.
 */

import { execSync } from 'child_process';
import http from 'http';

// Configuration
const HUB_URL = process.env.BIOME_HUB_URL || 'http://localhost:3000';
const ENDPOINT = '/api/events/git';

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    return '';
  }
}

function getGitMetrics() {
  // Verify we are inside a git repo
  const isRepo = runCmd('git rev-parse --is-inside-work-tree');
  if (isRepo !== 'true') {
    throw new Error('Not inside a valid git repository.');
  }

  // Get author name
  const author = runCmd('git config user.name');
  if (!author) {
    throw new Error('Git user.name configuration is missing.');
  }

  // 1. Commits today
  const commitsTodayStr = runCmd(`git log --since="midnight" --author="${author}" --oneline | wc -l`);
  const commitsToday = parseInt(commitsTodayStr, 10) || 0;

  // 2. Last commit hash and message
  const lastCommitInfo = runCmd(`git log -1 --pretty=format:"%h|%s"`);
  let lastHash = '';
  let lastMessage = '';
  if (lastCommitInfo && lastCommitInfo.includes('|')) {
    const parts = lastCommitInfo.split('|');
    lastHash = parts[0];
    lastMessage = parts[1];
  }

  // 3. Lines added/deleted today
  // git log numstat format: <added> <deleted> <filename>
  const numStatOutput = runCmd(`git log --since="midnight" --author="${author}" --numstat --pretty="%x00"`);
  let linesAdded = 0;
  let linesDeleted = 0;

  if (numStatOutput) {
    const lines = numStatOutput.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const added = parseInt(parts[0], 10);
        const deleted = parseInt(parts[1], 10);
        if (!isNaN(added)) linesAdded += added;
        if (!isNaN(deleted)) linesDeleted += deleted;
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    commits_today: commitsToday,
    lines_added_today: linesAdded,
    lines_deleted_today: linesDeleted,
    last_commit_message: lastMessage || undefined,
    last_commit_hash: lastHash || undefined
  };
}

function postToHub(payload) {
  const urlObj = new URL(HUB_URL + ENDPOINT);
  const data = JSON.stringify(payload);

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 80,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  console.log(`[Poller] Posting telemetry payload to ${HUB_URL + ENDPOINT}...`);
  console.log(JSON.stringify(payload, null, 2));

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[Poller] Successfully sent Git metrics. Server response: ${body}`);
      } else {
        console.error(`[Poller] Server returned error status ${res.statusCode}: ${body}`);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[Poller] Connection to hub failed: ${err.message}`);
  });

  req.write(data);
  req.end();
}

try {
  const metrics = getGitMetrics();
  postToHub(metrics);
} catch (error) {
  console.error(`[Poller ERROR] ${error.message}`);
  process.exit(1);
}
