# TOOLS.md - Local Cheat Sheet

## Primary Tools

### Focus OS Bridge (The Source of Truth)
- **Path**: `/Users/pipi/Desktop/focus os/focus_bridge.py`
- **Commands**:
    - `python3 focus_bridge.py stats` (Check cloud connection/summary)
    - `python3 focus_bridge.py add "Title" "Project" "Priority"` (Add task)
    - `python3 focus_bridge.py agent-tasks` (List tasks for AI execution)
    - `python3 focus_bridge.py claim <task_id> <agent_name>` (Start execution)
    - `python3 focus_bridge.py get-pm "Project"` (Resolve Project Manager)
- **Rules**: Use quotes for arguments. Project and Priority are optional. Priority defaults to "medium".

## Environment Notes
- **Workspace**: `/Users/pipi/Desktop/focus os`
- **Database**: Supabase Cloud (PostgreSQL)
- **Shell**: macOS Zsh with `openshell` plugin.

## AI Preferences
- **Model**: `google/gemini-2.5-flash`
- **Tooling**: Always use the `read` tool to check for existing tasks or docs before making assumptions.
