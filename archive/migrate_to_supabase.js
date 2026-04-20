const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jovxtuzmwftotzivwmfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvdnh0dXptd2Z0b3R6aXZ3bWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjQyNzEsImV4cCI6MjA5MDcwMDI3MX0.eU7c8-BiISooDTHWYTM4n_e9e4GtEBzLUSCcz8ps1WE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_FILE = path.join(__dirname, 'focus-data.json');

async function migrate() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("No focus-data.json found.");
    return;
  }

  const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  console.log("Migrating Agents...");
  const agents = db.agents.map(a => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    photo_url: a.photo,
    daily_salary: a.dailySalary
  }));
  if (agents.length > 0) {
    const { error: err1 } = await supabase.from('agents').upsert(agents);
    if (err1) console.error("Error migrating agents:", err1);
  }

  console.log("Migrating Tasks...");
  const tasks = db.tasks.map(t => ({
    id: t.id,
    title: t.title,
    topic: t.topic,
    project: t.project,
    status: t.status,
    priority: t.priority,
    difficulty: t.difficulty,
    due_date: t.dueDate || null,
    scheduled_date: t.scheduledDate || null,
    scheduled_week: t.scheduledWeek || null,
    assigned_agent: t.assignedAgent || null,
    completed_date: t.completedDate || null,
    notes: t.notes,
    penalized: !!t.penalized,
    salary_credited: !!t.salaryCredited
  }));
  if (tasks.length > 0) {
    const { error: err2 } = await supabase.from('tasks').upsert(tasks);
    if (err2) console.error("Error migrating tasks:", err2);
  }

  console.log("Migrating Templates...");
  const templates = db.templates.map(t => ({
    id: t.id,
    title: t.title,
    topic: t.topic,
    project: t.project,
    priority: t.priority,
    assigned_agent: t.assignedAgent || null,
    notes: t.notes,
    days: t.days || []
  }));
  if (templates.length > 0) {
    const { error: err3 } = await supabase.from('templates').upsert(templates);
    if (err3) console.error("Error migrating templates:", err3);
  }

  console.log("Migrating Penalties...");
  const penalties = db.penalties.map(p => ({
    id: p.id,
    task_id: p.taskId || null,
    agent_id: p.agentId || null,
    amount: p.amount,
    date: p.date,
    topic: p.topic,
    project: p.project
  }));
  if (penalties.length > 0) {
    const { error: err4 } = await supabase.from('penalties').upsert(penalties);
    if (err4) console.error("Error migrating penalties:", err4);
  }

  console.log("Migrating Settings...");
  const settings = {
    id: 'global',
    topics: db.settings.topics,
    topic_meta: db.settings.topicMeta,
    projects: db.settings.projects,
    proj_meta: db.settings.projMeta,
    last_recurring_check: db.lastRecurringCheck
  };
  const { error: err5 } = await supabase.from('settings').upsert(settings);
  if (err5) console.error("Error migrating settings:", err5);

  console.log("Migration complete!");
}

migrate();
