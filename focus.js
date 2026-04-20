#!/usr/bin/env node

const { Command } = require('commander');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jovxtuzmwftotzivwmfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvdnh0dXptd2Z0b3R6aXZ3bWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjQyNzEsImV4cCI6MjA5MDcwMDI3MX0.eU7c8-BiISooDTHWYTM4n_e9e4GtEBzLUSCcz8ps1WE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const program = new Command();

program
  .name('focus')
  .description('Focus OS CLI - Cloud Powered')
  .version('2.0.0');

// ── TASK COMMANDS ──
const task = program.command('task').description('Manage tasks');

task.command('ls')
  .description('List active tasks from cloud')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')
      .neq('status', 'failed');

    if (error) return console.error("Error fetching tasks:", error);

    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`\nFOCUS OS CLOUD - ACTIVE TASKS\n`);
      data.forEach(t => {
        console.log(`[${t.id.slice(0,4)}] ${t.title.padEnd(40)} | ${t.status.toUpperCase().padEnd(10)} | ${t.priority.toUpperCase()}`);
      });
      console.log();
    }
  });

task.command('add <title>')
  .description('Add a new task to cloud')
  .option('-t, --topic <topic>', 'Topic ID')
  .option('-p, --project <project>', 'Project ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (title, options) => {
    const newTask = {
      title,
      topic: options.topic || null,
      project: options.project || null,
      status: 'todo',
      priority: 'medium',
      difficulty: 'medium-easy'
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select();

    if (error) return console.error("Error adding task:", error);

    if (options.json) {
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log(`Task added to Cloud: "${title}" [${data[0].id}]`);
    }
  });

task.command('done <id>')
  .description('Mark task as completed in cloud')
  .action(async (id) => {
    // Attempt match by full ID or prefix
    const { data: matches, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, title')
      .or(`id.eq.${id},id.ilike.${id}%`);

    if (fetchErr || !matches || matches.length === 0) return console.error("Task not found");
    
    const target = matches[0];
    const { error: updateErr } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_date: new Date().toISOString().split('T')[0] })
      .eq('id', target.id);

    if (updateErr) return console.error("Error updating task:", updateErr);
    console.log(`Task "${target.title}" marked as DONE in Cloud.`);
  });

// ── AGENT COMMANDS ──
const agent = program.command('agent').description('Manage cloud agents');

agent.command('ls')
  .description('List all agents from cloud')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const { data, error } = await supabase.from('agents').select('*');
    if (error) return console.error("Error fetching agents:", error);

    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`\nFOCUS OS CLOUD - AGENTS\n`);
      data.forEach(a => {
        console.log(`${a.emoji || '🤖'} ${a.name.padEnd(20)} | $${a.daily_salary}/day`);
      });
      console.log();
    }
  });

// ── STATS COMMAND ──
program.command('stats')
  .description('View cloud system stats')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const { data: tasks, error: tErr } = await supabase.from('tasks').select('status');
    const { data: penalties, error: pErr } = await supabase.from('penalties').select('amount');
    
    if (tErr || pErr) return console.error("Error fetching stats");

    const doneCount = tasks.filter(t => t.status === 'done').length;
    const lost = penalties.reduce((s, p) => s + parseFloat(p.amount), 0);
    const earned = doneCount * 10;

    const stats = {
      totalTasks: tasks.length,
      completed: doneCount,
      netEarned: earned - lost,
      totalPenalties: lost
    };

    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log(`\nFOCUS OS CLOUD - STATS\n`);
      console.log(`Completed Tasks: ${stats.completed}/${stats.totalTasks}`);
      console.log(`Net Position:   $${stats.netEarned}`);
      console.log(`Total Lost:     $${stats.totalPenalties}`);
      console.log();
    }
  });

program.parseAsync(process.argv);
