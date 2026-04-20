# Focus OS CLI Manual (Cloud Edition)

Manage your Focus OS productivity system directly from the terminal. 

## 🚀 Getting Started

The CLI interacts directly with your Supabase cloud database. 
To run any command:
```bash
node focus.js <command>
```

---

## 📋 Task Management

### List Active Tasks
View all tasks that are currently "To-Do" or "Doing".
```bash
node focus.js task ls
```
**Options:**
- `-j, --json`: Get the output in machine-readable JSON format.

### Add a New Task
Create a task in the cloud instantly.
```bash
node focus.js task add "Your Task Title" --topic "work" --project "twitter"
```
**Options:**
- `-t, --topic`: Specify the topic ID.
- `-p, --project`: Specify the project ID.

### Complete a Task
Mark a task as done using its ID (or just the first 4 characters).
```bash
node focus.js task done <id>
```

---

## 🤖 Agent Oversight

### List All Agents
Check your team of AI agents and their salaries.
```bash
node focus.js agent ls
```

---

## 📊 Analytics

### View System Stats
Get a snapshot of your completion rate and net earnings (minus penalties).
```bash
node focus.js stats
```

---

## 🧠 Tips for Open Claw (AI Agents)

The CLI is designed to be the "nerves" for your AI assistant. 
**Tell Open Claw to:**
1. Use the `--json` flag to read the state of your OS.
2. Example for Open Claw: `"Ejecuta 'node focus.js task ls --json' para ver qué misiones tengo pendientes y luego elige una para trabajar."`
3. The AI can then use the `id` from the JSON to mark it as done or add new sub-tasks.

---

## 🛠️ Requirements
- **Node.js**: Installed on your machine.
- **Dependencies**: `@supabase/supabase-js`, `commander` (Must run `npm install`).
