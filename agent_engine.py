import time
import json
import subprocess
import urllib.request
import random
import os
from focus_bridge import call_supabase, claim_task, update_task, send_message, get_pm

# Native .env parser for background daemon
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip("'").strip('"')
from focus_bridge import call_supabase, claim_task, update_task, send_message, get_pm

# CONFIG
POLL_INTERVAL = 30  # seconds
OPENCLAW_AGENTS_ROOT = "/Users/pipi/.openclaw/agents"
PROJECTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "projects")
IDENTITIES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".identities")

def get_pending_tasks():
    # Fetch tasks that require an agent and are still in 'todo' status
    return call_supabase("tasks?requires_agent=eq.true&status=eq.todo&select=*")

def load_agent_context(agent_name):
    """Loads SOUL.md and IDENTITY.md for the given agent."""
    agent_slug = agent_name.lower().replace(" ", "-")
    agent_path = os.path.join(OPENCLAW_AGENTS_ROOT, agent_slug)

    context = ""
    try:
        soul_path = os.path.join(agent_path, "SOUL.md")
        identity_path = os.path.join(agent_path, "IDENTITY.md")

        if os.path.exists(soul_path):
            with open(soul_path, "r") as f:
                context += f"\n--- SOUL ---\n{f.read()}\n"

        if os.path.exists(identity_path):
            with open(identity_path, "r") as f:
                context += f"\n--- IDENTITY ---\n{f.read()}\n"

    except Exception as e:
        print(f"Error loading context for {agent_name}: {e}")

    return context

def load_pm_identity(pm_name):
    """Loads the PM's identity from .identities/{slug}.md"""
    slug = pm_name.lower().replace(" ", "")
    identity_file = os.path.join(IDENTITIES_DIR, f"{slug}.md")
    if os.path.exists(identity_file):
        try:
            with open(identity_file, "r") as f:
                print(f"Loaded PM identity: {pm_name}")
                return f"\n--- PM IDENTITY ({pm_name}) ---\n{f.read()}\n"
        except Exception as e:
            print(f"Error loading PM identity for {pm_name}: {e}")
    return ""

def load_project_context(project_id):
    """Loads project-specific instructions from projects/{project_id}.md"""
    if not project_id:
        return ""
    project_file = os.path.join(PROJECTS_DIR, f"{project_id}.md")
    if os.path.exists(project_file):
        try:
            with open(project_file, "r") as f:
                print(f"Loaded project instructions: {project_id}")
                return f"\n--- PROJECT INSTRUCTIONS ---\n{f.read()}\n"
        except Exception as e:
            print(f"Error loading project context for {project_id}: {e}")
    return ""

def execute_task(task, agent_context):
    """Executes task using LLM reasoning based on agent context, with Tool Calling."""
    print(f"Executing task: {task['title']}")
    if agent_context:
        print(f"Loaded context for agent: {len(agent_context)} bytes")
    else:
        print("Warning: No personality context found for this agent.")
    
    # LLM API Keys
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not openai_key and not anthropic_key:
        print("Warning: No LLM API keys found. Running in DRY-RUN/MOCK mode.")
        time.sleep(2)
        return f"Autonomous Agent Execution Results (MOCK):\n- Task: {task['title']}\n- Status: Success\n- Reasoning: Based on my directives, I processed this request."

    system_prompt = f"You are an autonomous agent in Focus OS. Your job is to completely resolve tasks assigned to you using tools. Be concise.\n{agent_context or ''}\nProvide a final completion report when the task is resolved."
    user_prompt = f"Task: {task['title']}\nDescription/Notes: {task.get('notes', 'No notes provided.')}\nContext: {task.get('metadata', {})}"

    try:
        if anthropic_key:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            tools = [
                {
                    "name": "run_bash_command",
                    "description": "Execute a bash command on the local macOS system. You can use this to manipulate the filesystem, run scripts, or open applications.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string"}
                        },
                        "required": ["command"]
                    }
                },
                {
                    "name": "read_file",
                    "description": "Read the contents of a file on the local filesystem.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string"}
                        },
                        "required": ["path"]
                    }
                },
                {
                    "name": "write_file",
                    "description": "Write contents to a file on the local filesystem. Will overwrite existing files or create parent directories if it does not exist.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string"},
                            "content": {"type": "string"}
                        },
                        "required": ["path", "content"]
                    }
                }
            ]
            
            messages = [{"role": "user", "content": f"{system_prompt}\n\nPlease take appropriate action to complete the following task:\n\n{user_prompt}\n\nWhen you are finished using tools and the task is fully resolved, output your final text execution report."}]
            
            turn = 0
            while turn < 15:
                turn += 1
                data = {
                    "model": "claude-3-5-sonnet-latest",
                    "max_tokens": 1500,
                    "messages": messages,
                    "tools": tools
                }
                req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
                with urllib.request.urlopen(req) as res:
                    response = json.loads(res.read().decode())
                
                content = response.get('content', [])
                stop_reason = response.get('stop_reason')
                
                messages.append({"role": "assistant", "content": content})
                
                if stop_reason == "tool_use":
                    tool_results = []
                    for block in content:
                        if block.get('type') == 'tool_use':
                            t_name = block['name']
                            t_input = block['input']
                            t_id = block['id']
                            print(f"[Tool Calling] {t_name}")
                            tool_out = ""
                            try:
                                if t_name == "run_bash_command":
                                    result = subprocess.run(t_input['command'], shell=True, capture_output=True, text=True, timeout=120)
                                    tool_out = f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
                                    if not tool_out.strip():
                                        tool_out = "Command executed successfully with no output."
                                elif t_name == "read_file":
                                    with open(t_input['path'], 'r', encoding='utf-8') as f:
                                        tool_out = f.read()
                                elif t_name == "write_file":
                                    os.makedirs(os.path.dirname(os.path.abspath(t_input['path'])), exist_ok=True)
                                    with open(t_input['path'], 'w', encoding='utf-8') as f:
                                        f.write(t_input['content'])
                                    tool_out = f"Successfully wrote to {t_input['path']}"
                                else:
                                    tool_out = f"Unknown tool: {t_name}"
                            except Exception as e:
                                tool_out = f"Error executing {t_name}: {str(e)}"
                            
                            if len(tool_out) > 5000:
                                tool_out = tool_out[:5000] + "\n...[TRUNCATED]"
                                
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": t_id,
                                "content": tool_out
                            })
                    messages.append({"role": "user", "content": tool_results})
                else:
                    return "\n".join([c.get('text', '') for c in content if c.get('type') == 'text'])

            return "Agent reached maximum turns before completing the task."
                
                
        elif openai_key:
            # Simple OpenAI call via urllib
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
            with urllib.request.urlopen(req) as res:
                response = json.loads(res.read().decode())
                return response['choices'][0]['message']['content']
                
    except Exception as e:
        return f"Error during LLM execution: {str(e)}"

def main():
    print("Starting Focus OS Agent Engine...")
    print(f"Polling Supabase every {POLL_INTERVAL}s")
    
    while True:
        tasks = get_pending_tasks()
        
        if isinstance(tasks, list) and len(tasks) > 0:
            print(f"Found {len(tasks)} tasks requiring agent intervention.")
            
            for task in tasks:
                task_id = task['id']
                project = task.get('project', 'General')
                
                # 1. PM Picks up the task and announces delegation
                pm_data = get_pm(project)
                if isinstance(pm_data, list) and len(pm_data) > 0:
                    pm = pm_data[0]
                    pm_name = pm.get('name', 'FocusPM')
                    pm_emoji = pm.get('emoji', '🤵')
                else:
                    pm_name = "FocusPM"
                    pm_emoji = "🤵"
                
                # Generate a unique bot name inspired by the PM
                bot_id = hex(random.getrandbits(16))[2:].upper()
                minion_name = f"ClawdBot-{pm_name.split()[0]}-{bot_id}"
                
                print(f"PM {pm_name} delegating task {task_id} to {minion_name}...")
                
                # Send PM announcement
                send_message(
                    pm_name, 
                    f"He detectado la tarea '{task['title']}' en el proyecto '{project}'. Procedo a desplegar a **{minion_name}** para su ejecución inmediata. 🚀",
                    task_id=task_id,
                    emoji=pm_emoji
                )
                
                # Claim for the minion
                claim_task(task_id, minion_name)
                
                # 2. Load context: agent + PM identity + project instructions
                context = load_agent_context(minion_name) or load_agent_context("ClawdBot-Generic")
                context += load_pm_identity(pm_name)
                context += load_project_context(task.get('project'))
                
                # 3. Minion Executes and reports
                execution_notes = execute_task(task, context)
                
                # Send Minion report
                send_message(
                    minion_name,
                    f"¡Tarea completada! He terminado '{task['title']}'. He adjuntado el informe detallado a las notas de la tarea. ✅",
                    task_id=task_id,
                    emoji="🤖"
                )
                
                # Update task to 'done'
                update_task(task_id, {
                    "status": "done",
                    "notes": (task.get('notes') or "") + "\n\n--- AGENT REPORT ---\n" + execution_notes,
                    "completed_date": time.strftime("%Y-%m-%d")
                })
                print(f"Task {task_id} marked as DONE by {minion_name}.")
                
        elif isinstance(tasks, dict) and "error" in tasks:
            print(f"Supabase Error: {tasks['error']}")
            
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
