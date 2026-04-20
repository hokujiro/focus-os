#!/bin/bash

# Configuration
PLIST_NAME="com.focusos.agentengine.plist"
PLIST_SRC="/Users/pipi/Desktop/focus os/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

# 1. Clean up existing service if any
echo "⏹️ Unloading existing Focus OS services..."
launchctl unload "$PLIST_DEST" 2>/dev/null

# 2. Copy the configuration
echo "📁 Installing new LaunchAgent..."
cp "$PLIST_SRC" "$PLIST_DEST"

# 3. Load the service
echo "🚀 Loading autonomous Focus OS Agent Engine..."
launchctl load "$PLIST_DEST"

# 4. Check status
echo "✅ Done. Service registered."
launchctl list | grep focusos || echo "⚠️ Warning: Service did not register correctly."
echo "📜 Logs can be found at: $HOME/Library/Logs/focus-os-agent.log"
