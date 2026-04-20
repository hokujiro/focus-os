import os
import json
import subprocess

# Paths
FOCUS_BRIDGE = "/Users/pipi/Desktop/focus os/focus_bridge.py"
PROVISION_SCRIPT = "/Users/pipi/Desktop/focus os/provision_openclaw_agent.py"
OPENCLAW_AGENTS = "/Users/pipi/.openclaw/agents"

def get_supabase_agents():
    res = subprocess.run(["python3", FOCUS_BRIDGE, "agent-list"], capture_output=True, text=True)
    try:
        return json.loads(res.stdout)
    except:
        return []

def sync():
    # Note: Focus bridge needs an 'agent-list' command to be added
    # For now, I'll assume I've added it
    agents = get_supabase_agents()
    if not agents: return
    
    existing = os.listdir(OPENCLAW_AGENTS)
    
    for ag in agents:
        slug = ag['name'].lower().replace(" ", "-")
        if slug not in existing:
            role = "Project Manager" if ag.get("is_pm") else "Disposable Agent"
            proj = ag.get("managed_project")
            print(f"Syncing new agent: {ag['name']} ({role})")
            subprocess.run(["python3", PROVISION_SCRIPT, ag['id'], ag['name'], role, proj or ""])

if __name__ == "__main__":
    sync()
