#!/bin/bash

# Tunnel script for turbo-invoice
# Exposes your local dev server to the internet via localtunnel

set -e

PORT=3000
TUNNEL_PID_FILE="/tmp/turbo-invoice-tunnel.pid"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up tunnel...${NC}"
    if [ -f "$TUNNEL_PID_FILE" ]; then
        PID=$(cat "$TUNNEL_PID_FILE")
        kill "$PID" 2>/dev/null || true
        rm -f "$TUNNEL_PID_FILE"
    fi
    pkill -f "localtunnel.*$PORT" 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete.${NC}"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Check if dev server is running
check_dev_server() {
    if ! lsof -ti:$PORT > /dev/null 2>&1; then
        echo -e "${RED}Error: No server running on port $PORT${NC}"
        echo -e "${YELLOW}Please start your dev server first:${NC}"
        echo "  npm run dev"
        exit 1
    fi
    echo -e "${GREEN}✓ Dev server detected on port $PORT${NC}"
}

# Kill existing tunnel if running
kill_existing_tunnel() {
    if [ -f "$TUNNEL_PID_FILE" ]; then
        OLD_PID=$(cat "$TUNNEL_PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo -e "${YELLOW}Killing existing tunnel (PID: $OLD_PID)...${NC}"
            kill "$OLD_PID" 2>/dev/null || true
        fi
        rm -f "$TUNNEL_PID_FILE"
    fi
    pkill -f "localtunnel.*$PORT" 2>/dev/null || true
}

# Start tunnel
start_tunnel() {
    echo -e "${GREEN}Starting localtunnel on port $PORT...${NC}"
    echo -e "${YELLOW}This may take a few seconds...${NC}"
    echo ""
    
    # Use npx to run localtunnel (no global install needed)
    npx -y localtunnel --port $PORT > /tmp/localtunnel-output.log 2>&1 &
    TUNNEL_PID=$!
    echo $TUNNEL_PID > "$TUNNEL_PID_FILE"
    
    # Wait for tunnel URL
    echo -e "${YELLOW}Waiting for tunnel URL...${NC}"
    sleep 5
    
    # Extract URL from output
    TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.loca\.lt' /tmp/localtunnel-output.log 2>/dev/null | head -1)
    
    if [ -z "$TUNNEL_URL" ]; then
        echo -e "${RED}Failed to get tunnel URL. Check the output:${NC}"
        cat /tmp/localtunnel-output.log
        cleanup
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Tunnel is active!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Your app is available at:${NC}"
    echo -e "${YELLOW}  $TUNNEL_URL${NC}"
    echo ""
    echo -e "${GREEN}Open this URL on your phone to access the app!${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
    echo ""
    
    # Keep script running and show tunnel output
    tail -f /tmp/localtunnel-output.log 2>/dev/null || wait $TUNNEL_PID
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Turbo Invoice Tunnel Setup${NC}"
    echo ""
    
    check_dev_server
    kill_existing_tunnel
    start_tunnel
}

main

