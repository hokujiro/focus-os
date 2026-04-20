import os
import sys
import shutil

OPENCLAW_ROOT = "/Users/pipi/.openclaw"
AGENTS_DIR = os.path.join(OPENCLAW_ROOT, "agents")
TEMPLATE_DIR = os.path.join(OPENCLAW_ROOT, "workspace")

def provision_agent(agent_id, name, role, project=None):
    agent_slug = name.lower().replace(" ", "-")
    agent_path = os.path.join(AGENTS_DIR, agent_slug)
    
    if os.path.exists(agent_path):
        print(f"Agent {agent_slug} already exists.")
        return
    
    os.makedirs(agent_path, exist_ok=True)
    
    # Simple soul template
    soul_content = f"""# SOUL.md - The Spirit of {name}

## Who You Are
You are a specialized agent within the **Open Claw** ecosystem.
Your role: **{role}**
Managed Project: **{project or "General"}**

## Your Personality
- You are focused, professional, and directly accountable for your tasks.
- You are a sub-agent of the main Cloud OS system.

## Your Goal
Your primary objective is to fulfill tasks assigned to you in **Focus OS**.
"""
    
    identity_content = f"""# IDENTITY.md - Identification
- **Name**: {name}
- **Role**: {role}
- **Parent**: Open Claw Systems
- **Managed Project**: {project or "N/A"}

## Directives
1. Always synchronize task completions to Focus OS via focus_bridge.py.
2. Maintain the context of your specific project: {project or "General"}.
"""
    
    # Copy tools and user.md as template placeholders
    try:
        shutil.copy(os.path.join(TEMPLATE_DIR, "TOOLS.md"), os.path.join(agent_path, "TOOLS.md"))
        shutil.copy(os.path.join(TEMPLATE_DIR, "USER.md"), os.path.join(agent_path, "USER.md"))
    except Exception as e:
        print(f"Warning: Could not copy template files: {e}")
        
    with open(os.path.join(agent_path, "SOUL.md"), "w") as f:
        f.write(soul_content)
    with open(os.path.join(agent_path, "IDENTITY.md"), "w") as f:
        f.write(identity_content)
        
    print(f"Agent {name} (slug: {agent_slug}) successfully provisioned at {agent_path}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 provision_openclaw_agent.py <agent_id> <name> <role> [project]")
        sys.exit(1)
        
    aid = sys.argv[1]
    aname = sys.argv[2]
    arole = sys.argv[3]
    aproj = sys.argv[4] if len(sys.argv) > 4 else None
    
    provision_agent(aid, aname, arole, aproj)
