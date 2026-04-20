import json
import os
import sys
import urllib.request

# CONFIG
SUPABASE_URL = "https://jovxtuzmwftotzivwmfz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvdnh0dXptd2Z0b3R6aXZ3bWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjQyNzEsImV4cCI6MjA5MDcwMDI3MX0.eU7c8-BiISooDTHWYTM4n_e9e4GtEBzLUSCcz8ps1WE"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def call_supabase(path, method="GET", body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}

def list_tasks():
    return call_supabase("tasks?status=neq.done&status=neq.failed&select=*")

def list_agent_tasks():
    return call_supabase("tasks?requires_agent=eq.true&status=neq.done&status=neq.failed&select=*")

def claim_task(task_id, agent_name):
    body = {
        "status": "in-progress",
        "executing_agent_name": agent_name
    }
    return call_supabase(f"tasks?id=eq.{task_id}", method="PATCH", body=body)

def update_task(task_id, updates):
    """Generic task update helper."""
    return call_supabase(f"tasks?id=eq.{task_id}", method="PATCH", body=updates)

def send_message(agent_name, content, task_id=None, emoji="🤖"):
    """Insert a message into the agent_messages table."""
    body = {
        "agent_name": agent_name,
        "agent_emoji": emoji,
        "content": content,
        "task_id": task_id
    }
    return call_supabase("agent_messages", method="POST", body=body)

def get_pm(project_name):
    # Find agent who is PM for this project
    return call_supabase(f"agents?is_pm=eq.true&managed_project=eq.{project_name}&select=*")

def get_stats():
    tasks = call_supabase("tasks?select=status")
    penalties = call_supabase("penalties?select=amount")
    
    done_count = len([t for t in tasks if t.get("status") == "done"])
    lost = sum([float(p.get("amount", 0)) for p in penalties])
    earned = done_count * 10
    
    return {
        "totalTasks": len(tasks),
        "completed": done_count,
        "netEarned": earned - lost,
        "totalPenalties": lost
    }

def get_project_lock(agent_id):
    """Read .identities/<agent_id>.lock.json and return the locked project id, or None."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    lock_path = os.path.join(script_dir, '.identities', f'{agent_id}.lock.json')
    try:
        with open(lock_path, 'r') as f:
            data = json.load(f)
            return data.get('lockedProjectId')
    except Exception:
        return None

def add_task(title, project=None, priority="medium", requires_agent=False, agent_id=None):
    # If an agent_id is provided and it has a project lock, enforce it
    if agent_id:
        locked = get_project_lock(agent_id)
        if locked:
            if project and project != locked:
                print(f"⛔ Project lock violation: agent '{agent_id}' is restricted to project '{locked}'. Ignoring requested project '{project}'.")
            project = locked
    body = {
        "title": title,
        "project": project,
        "status": "todo",
        "priority": priority,
        "difficulty": "medium-easy",
        "requires_agent": requires_agent
    }
    return call_supabase("tasks", method="POST", body=body)

def list_agents():
    return call_supabase("agents?select=*")

def provision_openclaw(agent_id, name, role, project=None):
    import subprocess
    cmd = ["python3", "provision_openclaw_agent.py", agent_id, name, role]
    if project:
        cmd.append(project)
    try:
        subprocess.run(cmd, check=True)
        return {"status": "success", "message": f"Agent {name} provisioned in Open Claw"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 focus_bridge.py [tasks|stats|add]")
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == "tasks":
        print(json.dumps(list_tasks(), indent=2))
    elif cmd == "stats":
        print(json.dumps(get_stats(), indent=2))
    elif cmd == "agent-tasks":
        print(json.dumps(list_agent_tasks(), indent=2))
    elif cmd == "claim":
        if len(sys.argv) < 4:
            print('Usage: python3 focus_bridge.py claim <task_id> <agent_name>')
        else:
            print(json.dumps(claim_task(sys.argv[2], sys.argv[3]), indent=2))
    elif cmd == "get-pm":
        if len(sys.argv) < 3:
            print('Usage: python3 focus_bridge.py get-pm <project_name>')
        else:
            print(json.dumps(get_pm(sys.argv[2]), indent=2))
    elif cmd == "spawn-agent":
        if len(sys.argv) < 3:
            print('Usage: python3 focus_bridge.py spawn-agent <task_id>')
        else:
            task_id = sys.argv[2]
            task = call_supabase(f"tasks?id=eq.{task_id}&select=*")
            if not task or "error" in task[0]:
                print(f"Task {task_id} not found.")
            else:
                t = task[0]
                project = t.get("project")
                if not project:
                    print(f"Task {task_id} has no project.")
                else:
                    pm = call_supabase(f"agents?is_pm=eq.true&managed_project=eq.{project}&select=*")
                    if not pm:
                        print(f"No PM found for project {project}.")
                    else:
                        import random
                        import string
                        bot_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                        bot_name = f"ClawdBot-{pm[0]['name'].split()[0]}-{bot_id}"
                        res = claim_task(task_id, bot_name)
                        print(f"Spawned {bot_name} for task {task_id}")
                        print(json.dumps(res, indent=2))
    elif cmd == "add":
        # Supports: add "Title" ["Project"] ["Priority"] [requires_agent:true|false] [--agent <id>]
        args = sys.argv[2:]
        # Extract optional --agent flag
        agent_id = None
        if '--agent' in args:
            idx = args.index('--agent')
            if idx + 1 < len(args):
                agent_id = args[idx + 1]
                args = args[:idx] + args[idx+2:]
        if not args:
            print('Usage: python3 focus_bridge.py add "Title" ["Project"] ["Priority"] [requires_agent:true|false] [--agent <agent_id>]')
        else:
            title = args[0]
            project = args[1] if len(args) > 1 else None
            priority = args[2] if len(args) > 2 else "medium"
            req_agent = args[3].lower() == "true" if len(args) > 3 else False
            print(json.dumps(add_task(title, project, priority, req_agent, agent_id=agent_id), indent=2))
    elif cmd == "agent-list":
        print(json.dumps(list_agents(), indent=2))
    elif cmd == "provision-agent":
        if len(sys.argv) < 5:
            print('Usage: python3 focus_bridge.py provision-agent <agent_id> <name> <role> [project]')
        else:
            print(json.dumps(provision_openclaw(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv)>5 else None), indent=2))
    elif cmd == "update":
        # python3 focus_bridge.py update <task_id> '<json_patch>'
        if len(sys.argv) < 4:
            print('Usage: python3 focus_bridge.py update <task_id> \'{"status":"done",...}\'')
        else:
            try:
                updates = json.loads(sys.argv[3])
                print(json.dumps(update_task(sys.argv[2], updates), indent=2))
            except json.JSONDecodeError as e:
                print(f"Invalid JSON: {e}")
    elif cmd == "message":
        # python3 focus_bridge.py message <agent_name> "<content>" [task_id] [emoji]
        if len(sys.argv) < 4:
            print('Usage: python3 focus_bridge.py message <agent_name> "<content>" [task_id] [emoji]')
        else:
            agent_name = sys.argv[2]
            content = sys.argv[3]
            task_id = sys.argv[4] if len(sys.argv) > 4 else None
            emoji = sys.argv[5] if len(sys.argv) > 5 else "⚡"
            print(json.dumps(send_message(agent_name, content, task_id, emoji), indent=2))
    else:
        print(f"Unknown command: {cmd}")
