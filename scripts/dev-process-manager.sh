#!/bin/bash

# dev-process-manager.sh
# A bash script to check for and manage running development processes
# Cross-platform compatible (macOS/Linux)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to find development processes
find_dev_processes() {
    # Use pgrep to find npm/node processes, then filter for dev-related ones
    pgrep -f "npm\|node" 2>/dev/null | while read -r pid; do
        # Get full command line
        if command -v ps >/dev/null 2>&1; then
            cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -1)
        else
            # Fallback for systems without ps
            cmd=$(cat /proc/"$pid"/cmdline 2>/dev/null | tr '\0' ' ')
        fi

        # Check if it's a development server (Next.js, Vite, etc.)
        if [[ "$cmd" =~ (next|vite|webpack|dev|serve|start) ]] && [[ ! "$cmd" =~ (grep|pgrep|ps) ]]; then
            echo "$pid|$cmd"
        fi
    done
}

# Function to display running processes
display_processes() {
    echo -e "${BLUE}Running development processes:${NC}"
    echo "PID | Command"
    echo "----|--------"

    local found=false
    find_dev_processes | while IFS='|' read -r pid cmd; do
        found=true
        printf "%-4s | %s\n" "$pid" "$cmd"
    done

    if [[ "$found" != true ]]; then
        echo -e "${YELLOW}No development processes found.${NC}"
    fi
}

# Function to kill a process with confirmation and graceful shutdown
kill_process() {
    local pid=$1
    local cmd=$2

    if [[ -z "$pid" ]]; then
        echo -e "${RED}Error: No PID provided${NC}"
        return 1
    fi

    # Check if process exists
    if ! kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Process $pid not found or already terminated.${NC}"
        return 0
    fi

    echo -e "${YELLOW}Process details:${NC}"
    echo "PID: $pid"
    echo "Command: $cmd"
    echo

    # Confirm before killing
    read -p "Are you sure you want to terminate this process? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Operation cancelled.${NC}"
        return 0
    fi

    echo -e "${BLUE}Attempting graceful shutdown...${NC}"
    kill -TERM "$pid" 2>/dev/null || true

    # Wait up to 10 seconds for graceful shutdown
    local count=0
    while [[ $count -lt 10 ]] && kill -0 "$pid" 2>/dev/null; do
        sleep 1
        ((count++))
    done

    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Process still running, force killing...${NC}"
        kill -KILL "$pid" 2>/dev/null || true

        # Final check
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}Failed to terminate process $pid${NC}"
            return 1
        fi
    fi

    echo -e "${GREEN}Process $pid terminated successfully.${NC}"
}

# Function to kill all dev processes
kill_all_processes() {
    local processes=()
    while IFS='|' read -r pid cmd; do
        processes+=("$pid|$cmd")
    done < <(find_dev_processes)

    if [[ ${#processes[@]} -eq 0 ]]; then
        echo -e "${YELLOW}No development processes found.${NC}"
        return 0
    fi

    echo -e "${YELLOW}Found ${#processes[@]} development process(es):${NC}"
    for proc in "${processes[@]}"; do
        IFS='|' read -r pid cmd <<< "$proc"
        echo "PID: $pid | Command: $cmd"
    done
    echo

    read -p "Are you sure you want to terminate ALL development processes? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Operation cancelled.${NC}"
        return 0
    fi

    local failed=0
    for proc in "${processes[@]}"; do
        IFS='|' read -r pid cmd <<< "$proc"
        if ! kill_process "$pid" "$cmd"; then
            ((failed++))
        fi
    done

    if [[ $failed -eq 0 ]]; then
        echo -e "${GREEN}All processes terminated successfully.${NC}"
    else
        echo -e "${RED}$failed process(es) failed to terminate.${NC}"
    fi
}

# Interactive mode
interactive_mode() {
    while true; do
        echo
        echo -e "${BLUE}Development Process Manager - Interactive Mode${NC}"
        echo "1. List running processes"
        echo "2. Kill specific process"
        echo "3. Kill all processes"
        echo "4. Exit"
        echo

        read -p "Choose an option (1-4): " choice
        echo

        case $choice in
            1)
                display_processes
                ;;
            2)
                display_processes
                echo
                read -p "Enter PID to kill: " pid
                if [[ -n "$pid" ]]; then
                    cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -1)
                    kill_process "$pid" "$cmd"
                fi
                ;;
            3)
                kill_all_processes
                ;;
            4)
                echo -e "${GREEN}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please try again.${NC}"
                ;;
        esac
    done
}

# Main script logic
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -l, --list          List running development processes"
    echo "  -k, --kill PID      Kill specific process by PID"
    echo "  -a, --kill-all      Kill all development processes"
    echo "  -i, --interactive   Interactive mode"
    echo "  -h, --help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0 -l"
    echo "  $0 -k 12345"
    echo "  $0 -a"
    echo "  $0 -i"
}

# Parse command line options
if [[ $# -eq 0 ]]; then
    usage
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--list)
            display_processes
            shift
            ;;
        -k|--kill)
            if [[ -z "$2" || "$2" =~ ^- ]]; then
                echo -e "${RED}Error: --kill requires a PID argument${NC}"
                exit 1
            fi
            cmd=$(ps -p "$2" -o command= 2>/dev/null | head -1)
            kill_process "$2" "$cmd"
            shift 2
            ;;
        -a|--kill-all)
            kill_all_processes
            shift
            ;;
        -i|--interactive)
            interactive_mode
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done