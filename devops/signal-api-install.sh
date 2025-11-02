#!/bin/bash
set -e

# ====== Config ======
APP_NAME="signal-api"
IMAGE_NAME="bbernhard/signal-cli-rest-api"
IMAGE_TAG=${IMAGE_TAG:-latest}
CONTAINER_NAME="signal-api"
APP_PORT=8080
HOST_PORT=${SIGNAL_HOST_PORT:-8081}
SIGNAL_DATA_DIR="$HOME/.local/share/signal-cli"
LOG_FILE="deploy-signal-api.log"

# ====== Colors ======
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

status() {
    if $1; then
        echo -e "${GREEN}✔ Installed${NC}"
    else
        echo -e "${RED}✖ Not Installed${NC}"
    fi
}

check_install() {
    command -v "$1" &>/dev/null
}

# Ensure DNS resolution for a host; if it fails, try public resolvers and
# optionally add a temporary /etc/hosts mapping to unblock connections.
ensure_host_dns() {
    local host="$1"
    if getent ahostsv4 "$host" >/dev/null 2>&1; then
        return 0
    fi
    local ip=""
    if command -v dig >/dev/null 2>&1; then
        ip=$(dig +short A "$host" @1.1.1.1 | head -n1)
        [ -z "$ip" ] && ip=$(dig +short A "$host" @8.8.8.8 | head -n1)
    fi
    if [ -z "$ip" ] && command -v nslookup >/dev/null 2>&1; then
        ip=$(nslookup "$host" 1.1.1.1 2>/dev/null | awk '/^Address: /{print $2; exit}')
        [ -z "$ip" ] && ip=$(nslookup "$host" 8.8.8.8 2>/dev/null | awk '/^Address: /{print $2; exit}')
    fi
    [ -z "$ip" ] && ip=$(getent hosts "$host" | awk '{print $1; exit}')
    if [ -n "$ip" ]; then
        if ! grep -q "\s$host$" /etc/hosts 2>/dev/null; then
            echo "$ip $host" | sudo tee -a /etc/hosts >/dev/null
        fi
        return 0
    fi
    return 1
}

# Configure Docker daemon DNS to use public resolvers to avoid registry lookup issues
configure_docker_dns() {
    local daemon_json="/etc/docker/daemon.json"
    local tmp_json
    tmp_json=$(mktemp)
    if [ -f "$daemon_json" ]; then
        # Merge DNS settings if not present; fallback to overwrite if tools missing
        if command -v jq >/dev/null 2>&1; then
            jq '.dns = ["1.1.1.1","8.8.8.8"] | .registry-mirrors = (["https://mirror.gcr.io"] + (.registry-mirrors // []))' \
               "$daemon_json" > "$tmp_json" 2>/dev/null || echo '{"dns":["1.1.1.1","8.8.8.8"],"registry-mirrors":["https://mirror.gcr.io"]}' > "$tmp_json"
        else
            echo '{"dns":["1.1.1.1","8.8.8.8"],"registry-mirrors":["https://mirror.gcr.io"]}' > "$tmp_json"
        fi
    else
        echo '{"dns":["1.1.1.1","8.8.8.8"],"registry-mirrors":["https://mirror.gcr.io"]}' > "$tmp_json"
    fi
    sudo mkdir -p /etc/docker
    sudo cp "$tmp_json" "$daemon_json"
    rm -f "$tmp_json"
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl restart docker || true
    fi
}

# Check if a TCP port is in use (listening) on localhost
port_in_use() {
    local port="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -ltn | awk '{print $4}' | grep -E ":$port$" >/dev/null 2>&1
        return $?
    elif command -v lsof >/dev/null 2>&1; then
        lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
        return $?
    elif command -v netstat >/dev/null 2>&1; then
        netstat -ltn | awk '{print $4}' | grep -E ":$port$" >/dev/null 2>&1
        return $?
    else
        # If we cannot check, assume not in use
        return 1
    fi
}

# Pick a free host port starting from HOST_PORT, avoiding conflicts
pick_host_port() {
    local start_port="$1"
    local port="$start_port"
    local max_port=65535
    while port_in_use "$port"; do
        port=$((port + 1))
        if [ "$port" -gt "$max_port" ]; then
            log "${RED}No free ports available after $start_port.${NC}"
            exit 1
        fi
    done
    echo "$port"
}

install_docker() {
    if ! check_install docker; then
        log "${YELLOW}Installing Docker...${NC}"
        apt update
        apt install -y docker.io
        systemctl enable --now docker
        log "${GREEN}Docker installed successfully.${NC}"
    fi
    # Harden Docker DNS to avoid registry resolution issues
    configure_docker_dns || true
}

deploy_container() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log "${BLUE}Stopping and removing existing container...${NC}"
        docker stop "$CONTAINER_NAME" && docker rm "$CONTAINER_NAME"
    fi

    log "${YELLOW}Creating local data directory: $SIGNAL_DATA_DIR...${NC}"
    mkdir -p "$SIGNAL_DATA_DIR"

    # Ensure we avoid Jenkins default port (8080). If user explicitly set SIGNAL_HOST_PORT,
    # we still check and pick the next free port if occupied.
    desired_port="$HOST_PORT"
    chosen_port=$(pick_host_port "$desired_port")
    if [ "$chosen_port" != "$desired_port" ]; then
        log "${YELLOW}Port $desired_port in use; selecting free port $chosen_port.${NC}"
    fi
    HOST_PORT="$chosen_port"

    # Ensure Docker Hub registry is resolvable and pre-pull the image
    ensure_host_dns "registry-1.docker.io" || true
    log "${YELLOW}Pulling image ${IMAGE_NAME}:${IMAGE_TAG}...${NC}"
    if ! docker pull "${IMAGE_NAME}:${IMAGE_TAG}"; then
        log "${YELLOW}First pull attempt failed. Adjusting Docker DNS and retrying...${NC}"
        configure_docker_dns || true
        ensure_host_dns "registry-1.docker.io" || true
        if ! docker pull "${IMAGE_NAME}:${IMAGE_TAG}"; then
            log "${RED}Failed to pull image ${IMAGE_NAME}:${IMAGE_TAG}. Check network/DNS and try again.${NC}"
            exit 1
        fi
    fi

    log "${YELLOW}Deploying ${APP_NAME} container using image: ${IMAGE_NAME}:${IMAGE_TAG}...${NC}"
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart=always \
        -p "$HOST_PORT:$APP_PORT" \
        -v "$SIGNAL_DATA_DIR:/home/.local/share/signal-cli" \
        -e MODE=native \
        "$IMAGE_NAME:$IMAGE_TAG"

    log "${GREEN}${APP_NAME} container deployed and running on port $HOST_PORT.${NC}"
}

print_summary() {
    echo -e "\n${BLUE}===== Deployment Summary =====${NC}"
    echo -e "Docker:         $(status check_install docker)"
    echo -e "Container:      $(docker ps | grep -q "$CONTAINER_NAME" && echo -e "${GREEN}✔ Running${NC}" || echo -e "${RED}✖ Not Running${NC}")"
    echo -e "API Access:     http://localhost:${HOST_PORT}"
    echo -e "Data Volume:    $SIGNAL_DATA_DIR"
    echo -e "${BLUE}==============================${NC}"
}

# ====== Main ======
log "${BLUE}🚀 Starting deployment of $APP_NAME on Debian...${NC}"

install_docker
deploy_container
print_summary

log "${BLUE}✅ Deployment complete. View logs in ${LOG_FILE}.${NC}"