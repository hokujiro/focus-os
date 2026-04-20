const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const { exec, spawn } = require('child_process');

// Find the active Telegram session key for an OpenClaw agent
function getTelegramSession(ocAgentId) {
  try {
    const sessFile = path.join(os.homedir(), '.openclaw', 'agents', ocAgentId, 'sessions', 'sessions.json');
    const sessions = JSON.parse(fs.readFileSync(sessFile, 'utf8'));
    const tgKey = Object.keys(sessions).find(k => k.includes(':telegram:direct:'));
    return tgKey || null;
  } catch { return null; }
}
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Serve Focus OS
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'focus-os.html'));
});

// Bridge to local agent provisioning
app.post('/api/provision', (req, res) => {
  const { id, name, role, project } = req.body;
  const cmd = `python3 "provision_openclaw_agent.py" "${id}" "${name}" "${role}" "${project || ''}"`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error}`);
      return res.status(500).json({ status: 'error', message: stderr });
    }
    res.json({ status: 'success', output: stdout });
  });
});

// ── Telegram multi-agent ──────────────────────────────────
// telegram-links.json: { [focusAgentId]: { ocAgentId, accountId, botUsername } }
const TELEGRAM_LINKS_FILE = path.join(__dirname, 'telegram-links.json');
const WORKSPACE = __dirname;
const WORKER_ENV = path.join(os.homedir(), '.openclaw', 'worker-env');

function readLinks() {
  try {
    if (fs.existsSync(TELEGRAM_LINKS_FILE))
      return JSON.parse(fs.readFileSync(TELEGRAM_LINKS_FILE, 'utf8'));
  } catch(e) {}
  return {};
}

function writeLinks(links) {
  fs.writeFileSync(TELEGRAM_LINKS_FILE, JSON.stringify(links, null, 2));
}

function getOpenclawConfig() {
  return JSON.parse(fs.readFileSync(
    path.join(process.env.HOME, '.openclaw/openclaw.json'), 'utf8'));
}

function getTokenForAccount(tgCfg, accountId) {
  if (accountId === 'default' || !accountId)
    return tgCfg.accounts?.default?.botToken || tgCfg.botToken || null;
  return tgCfg.accounts?.[accountId]?.botToken
      || tgCfg.accounts?.[accountId]?.token
      || null;
}

function fetchBotUsername(token, cb) {
  const req = https.get(`https://api.telegram.org/bot${token}/getMe`, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try { cb(null, JSON.parse(data).result?.username || null); }
      catch(e) { cb(e, null); }
    });
  });
  req.on('error', cb);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// List all configured Telegram bots with their @username
app.get('/api/telegram-bots', (req, res) => {
  exec('openclaw channels list --json', (err, stdout) => {
    if (err) return res.json([]);
    try {
      const data = JSON.parse(stdout);
      const accountIds = data.chat?.telegram || [];
      const cfg = getOpenclawConfig();
      const tgCfg = cfg.channels?.telegram || {};

      let pending = accountIds.length;
      if (!pending) return res.json([]);
      const bots = [];

      accountIds.forEach(accountId => {
        const token = getTokenForAccount(tgCfg, accountId);
        if (!token) {
          bots.push({ accountId, botUsername: null });
          if (--pending === 0) res.json(bots);
          return;
        }
        fetchBotUsername(token, (e, botUsername) => {
          bots.push({ accountId, botUsername: e ? null : botUsername });
          if (--pending === 0) res.json(bots);
        });
      });
    } catch(e) { res.json([]); }
  });
});

// Register a new Telegram bot account in OpenClaw
app.post('/api/add-telegram-bot', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ status: 'error', message: 'Token required' });

  fetchBotUsername(token, (err, botUsername) => {
    if (err || !botUsername)
      return res.status(400).json({ status: 'error', message: 'Invalid token or Telegram unreachable' });

    const accountId = botUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cmd = `openclaw channels add --channel telegram --token "${token}" --account "${accountId}" --name "@${botUsername}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) return res.status(500).json({ status: 'error', message: stderr || error.message });
      res.json({ status: 'success', accountId, botUsername });
    });
  });
});

// Get all agent→bot links
app.get('/api/telegram-links', (req, res) => {
  res.json(readLinks());
});

// Link a Focus OS agent to a Telegram bot:
// 1. Create (or reuse) an OpenClaw agent for this Focus OS agent
// 2. Bind it to the selected Telegram account
// 3. Save the mapping
app.post('/api/link-telegram', (req, res) => {
  const { agentId, agentName, accountId, botUsername } = req.body;
  const ocAgentId = slugify(agentName);
  const workspace = WORKSPACE;

  // Check if OpenClaw agent already exists
  exec('openclaw agents list --json 2>/dev/null', (err, stdout) => {
    let existingAgents = [];
    try { existingAgents = JSON.parse(stdout || '[]'); } catch(e) {}

    const exists = Array.isArray(existingAgents)
      ? existingAgents.some(a => a.id === ocAgentId)
      : Object.keys(existingAgents).includes(ocAgentId);

    const bindFlag = `--bind telegram:${accountId}`;

    if (exists) {
      // Agent exists — just update the binding
      exec(`openclaw agents bind --agent "${ocAgentId}" ${bindFlag}`, (e2, o2, e2err) => {
        if (e2) console.warn('bind warn:', e2err);
        const links = readLinks();
        links[agentId] = { ocAgentId, accountId, botUsername };
        writeLinks(links);
        res.json({ status: 'success', ocAgentId });
      });
    } else {
      // Create new OpenClaw agent and bind in one step
      const cmd = `openclaw agents add "${ocAgentId}" ${bindFlag} --workspace "${workspace}" --non-interactive`;
      exec(cmd, (e2, o2, e2err) => {
        if (e2) {
          console.error('agents add error:', e2err);
          return res.status(500).json({ status: 'error', message: e2err || e2.message });
        }
        const links = readLinks();
        links[agentId] = { ocAgentId, accountId, botUsername };
        writeLinks(links);
        res.json({ status: 'success', ocAgentId });
      });
    }
  });
});

// Unlink: remove binding and mapping (keeps the OpenClaw agent intact)
app.post('/api/unlink-telegram', (req, res) => {
  const { agentId } = req.body;
  const links = readLinks();
  delete links[agentId];
  writeLinks(links);
  res.json({ status: 'success' });
});

// Write IDENTITY.md for an OpenClaw agent and apply it via set-identity
app.post('/api/set-agent-identity', (req, res) => {
  const { ocAgentId, name, emoji, persona, lockedProjectId, lockedProjectName } = req.body;
  if (!ocAgentId || !name) return res.status(400).json({ status: 'error', message: 'ocAgentId and name required' });

  // Store identities under .identities/ inside the workspace
  const identityDir = path.join(WORKSPACE, '.identities');
  if (!fs.existsSync(identityDir)) fs.mkdirSync(identityDir, { recursive: true });
  const identityFile = path.join(identityDir, `${ocAgentId}.md`);

  const safeName = name.replace(/["`$\\]/g, '');
  const safeEmoji = (emoji || '🤖').replace(/["`$\\]/g, '');
  const personaText = (persona || '').trim();
  const projectLabel = lockedProjectName ? lockedProjectName.replace(/["`$\\]/g, '') : null;
  const projectId = lockedProjectId ? lockedProjectId.replace(/["`$\\]/g, '') : null;

  const projectRules = projectId ? [
    `3. **Project Lock — CRITICAL**: You are restricted to the project **"${projectLabel}"** (id: \`${projectId}\`). You MUST NEVER create, edit, or interact with tasks belonging to any other project. If asked to work on a different project, refuse politely and explain your restriction.`,
    `4. **Enforce on task creation**: When calling \`python3 focus_bridge.py add\`, ALWAYS pass \`"${projectId}"\` as the project argument. Example: \`python3 focus_bridge.py add "Task title" "${projectId}"\``,
  ] : [];

  const reviewRules = [
    ``,
    `## Task Execution Workflow`,
    `When you receive a task to execute, you handle it directly — no workers, no delegation.`,
    ``,
    `**When assigned a task:**`,
    `1. Claim it: \`python3 focus_bridge.py claim <taskId> "${safeName}"\``,
    `2. Execute it directly using your available tools. Be thorough.`,
    `3. When done, move to REVIEW: \`python3 focus_bridge.py update <taskId> '{"status":"review"}'\``,
    `4. Send the user a Telegram message with a clear summary and these reply options:`,
    `   ✅ APPROVE <taskId>  — marks as done`,
    `   ❌ REJECT <taskId>   — sends back to to-do`,
    ``,
    `**When the user replies APPROVE <taskId>:**`,
    `1. Run: \`python3 focus_bridge.py update <taskId> '{"status":"done","completed_date":"YYYY-MM-DD"}'\``,
    `   (replace YYYY-MM-DD with today's date)`,
    `2. Confirm: "✅ Task approved and marked as done!"`,
    ``,
    `**When the user replies REJECT <taskId>:**`,
    `1. Run: \`python3 focus_bridge.py update <taskId> '{"status":"todo","executing_agent_name":null}'\``,
    `2. Ask if they want to add notes before you retry.`,
    ``,
    `**IMPORTANT**: Never mark a task as done yourself. Only do it in response to an explicit APPROVE from the user.`,
  ];

  const md = [
    `# IDENTITY.md — ${safeName}`,
    ``,
    `- **Name**: ${safeName}`,
    `- **Emoji**: ${safeEmoji}`,
    ...(projectId ? [`- **Bound Project**: ${projectLabel} (\`${projectId}\`)`] : []),
    ``,
    `## Your Purpose`,
    personaText || `You are ${safeName}, an autonomous Focus OS agent.`,
    ``,
    `## Ground Rules`,
    `1. **Always use Focus Bridge**: All task management (add, edit, list, delete) MUST be done via \`python3 focus_bridge.py\`.`,
    `2. **Report Status**: When you complete or update a task, confirm it was synced to the cloud.`,
    ...projectRules,
    ...reviewRules,
  ].join('\n');

  // Write the lock config so focus_bridge.py can enforce the restriction server-side
  const lockConfig = { ocAgentId, lockedProjectId: projectId || null, lockedProjectName: projectLabel || null };
  const lockFile = path.join(identityDir, `${ocAgentId}.lock.json`);

  fs.writeFile(lockFile, JSON.stringify(lockConfig, null, 2), 'utf8', () => {}); // best-effort

  fs.writeFile(identityFile, md, 'utf8', (writeErr) => {
    if (writeErr) return res.status(500).json({ status: 'error', message: writeErr.message });
    const cmd = `openclaw agents set-identity --agent "${ocAgentId}" --identity-file "${identityFile}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) return res.status(500).json({ status: 'error', message: stderr || error.message });
      res.json({ status: 'success', identityFile, lockedProjectId: projectId, output: stdout.trim() });
    });
  });
});

// ─── ASSIGN TASK DIRECTLY TO PM AGENT ───────────────────────────────────────
// Sends the task execution prompt directly to the PM agent — no disposable workers.
// Body: { taskId, taskTitle, taskNotes, projectId, projectName, pmOcAgentId }
app.post('/api/send-task-to-pm', (req, res) => {
  const { taskId, taskTitle, taskNotes, projectId, projectName, pmOcAgentId } = req.body;
  if (!taskId || !taskTitle) return res.status(400).json({ status: 'error', message: 'taskId and taskTitle required' });
  if (!pmOcAgentId) return res.status(400).json({ status: 'error', message: 'pmOcAgentId required' });

  const prompt = [
    `You have been assigned a task to execute directly. Follow the steps below.`,
    ``,
    `⛔ HARD RULES:`,
    `- NEVER delete or move files (no rm, rmdir, trash, unlink, shred, find -delete, mv to Trash)`,
    `- NEVER touch files outside your task scope`,
    ``,
    `Task ID: ${taskId}`,
    `Task: ${taskTitle}`,
    taskNotes ? `Notes: ${taskNotes}` : '',
    projectId ? `Project: ${projectName || projectId} (id: ${projectId})` : '',
    ``,
    `Steps (follow in order):`,
    `1. Claim the task: \`python3 focus_bridge.py claim ${taskId} "${pmOcAgentId}"\``,
    `2. Execute the task using the tools available. Be thorough.`,
    `3. When done, move to REVIEW: \`python3 focus_bridge.py update ${taskId} '{"status":"review"}'\``,
    `4. Send the user a Telegram summary and ask for approval:`,
    `   ✅ APPROVE ${taskId}  — to mark as done`,
    `   ❌ REJECT ${taskId}   — to send back to to-do`,
  ].filter(Boolean).join('\n');

  // Respond immediately — agent runs async
  res.json({ status: 'assigned', taskId, pmOcAgentId });

  // Run the PM agent with the task prompt (autonomous execution, not --deliver)
  const runCmd = `openclaw agent --agent "${pmOcAgentId}" --message ${JSON.stringify(prompt)}`;
  exec(runCmd, { timeout: 300000 }, (err, stdout, stderr) => {
    if (err) console.error(`[pm-task] PM agent error for task ${taskId}:`, stderr || err.message);
    else console.log(`[pm-task] PM agent finished task ${taskId}`);
  });
});

// Read the raw IDENTITY.md for an OpenClaw agent
app.get('/api/identity-file/:ocAgentId', (req, res) => {
  const { ocAgentId } = req.params;
  if (!ocAgentId || ocAgentId.includes('..') || ocAgentId.includes('/'))
    return res.status(400).json({ status: 'error', message: 'Invalid agent id' });
  const identityFile = path.join(WORKSPACE, '.identities', `${ocAgentId}.md`);
  if (!fs.existsSync(identityFile))
    return res.json({ status: 'not_found', content: '' });
  const content = fs.readFileSync(identityFile, 'utf8');
  res.json({ status: 'ok', content });
});

// Write raw IDENTITY.md and re-apply to OpenClaw agent
app.post('/api/identity-file/:ocAgentId', (req, res) => {
  const { ocAgentId } = req.params;
  const { content } = req.body;
  if (!ocAgentId || ocAgentId.includes('..') || ocAgentId.includes('/'))
    return res.status(400).json({ status: 'error', message: 'Invalid agent id' });
  if (content === undefined)
    return res.status(400).json({ status: 'error', message: 'content required' });
  const identityDir = path.join(WORKSPACE, '.identities');
  if (!fs.existsSync(identityDir)) fs.mkdirSync(identityDir, { recursive: true });
  const identityFile = path.join(identityDir, `${ocAgentId}.md`);
  fs.writeFile(identityFile, content, 'utf8', (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    exec(`openclaw agents set-identity --agent "${ocAgentId}" --identity-file "${identityFile}"`, (err2, stdout, stderr) => {
      if (err2) return res.status(500).json({ status: 'error', message: stderr || err2.message });
      res.json({ status: 'success', output: stdout.trim() });
    });
  });
});

// Read project instructions file (projects/{projectId}.md)
app.get('/api/project-instructions/:projectId', (req, res) => {
  const { projectId } = req.params;
  if (!projectId || projectId.includes('..') || projectId.includes('/'))
    return res.status(400).json({ status: 'error', message: 'Invalid project id' });
  const file = path.join(WORKSPACE, 'projects', `${projectId}.md`);
  if (!fs.existsSync(file))
    return res.json({ status: 'not_found', content: '' });
  res.json({ status: 'ok', content: fs.readFileSync(file, 'utf8') });
});

// Write project instructions file
app.post('/api/project-instructions/:projectId', (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  if (!projectId || projectId.includes('..') || projectId.includes('/'))
    return res.status(400).json({ status: 'error', message: 'Invalid project id' });
  if (content === undefined)
    return res.status(400).json({ status: 'error', message: 'content required' });
  const dir = path.join(WORKSPACE, 'projects');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${projectId}.md`);
  fs.writeFile(file, content, 'utf8', (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success' });
  });
});

// Approve a Telegram pairing code
// Runs: openclaw pairing approve telegram <code>
app.post('/api/pairing-approve', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ status: 'error', message: 'Code required' });
  const safeCode = code.trim().replace(/[^A-Z0-9]/gi, '');
  if (!safeCode) return res.status(400).json({ status: 'error', message: 'Invalid code' });
  exec(`openclaw pairing approve telegram ${safeCode}`, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ status: 'error', message: stderr || error.message });
    res.json({ status: 'success', output: stdout.trim() });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Focus OS Online: http://localhost:${PORT}`);
  console.log(`🤖 Agent Engine is running as a macOS background service.`);
});
