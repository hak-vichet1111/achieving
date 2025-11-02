#!/bin/bash

set -euo pipefail

# =========================================
# Jenkins Installer for Debian
# Features: Check before install, Logs, Colors
# =========================================

LOG_FILE="/var/log/jenkins-install.log"
JENKINS_RELEASE="${JENKINS_RELEASE:-debian-stable}"
JENKINS_KEY_URL="https://pkg.jenkins.io/${JENKINS_RELEASE}/jenkins.io-2023.key"
JENKINS_KEYRING_PATH="/etc/apt/keyrings/jenkins-keyring.asc"

# Colors
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
CYAN="\e[36m"
RESET="\e[0m"

# Logging
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log "${RED}[ERROR]${RESET} This script must be run as root."
        exit 1
    fi
}

check_command() {
    command -v "$1" &>/dev/null
}

# Attempt to ensure DNS resolution for a given host by resolving IPv4 and
# optionally adding a temporary /etc/hosts mapping if resolution fails
ensure_host_dns() {
    local host="$1"
    if getent ahostsv4 "$host" >/dev/null 2>&1; then
        log "${GREEN}[OK]${RESET} DNS resolution for $host is working."
        return 0
    fi
    log "${YELLOW}[WARN]${RESET} DNS resolution for $host failed. Attempting fallback via public resolvers..."
    local ip=""
    if check_command dig; then
        ip=$(dig +short A "$host" @1.1.1.1 | head -n1)
        [[ -z "$ip" ]] && ip=$(dig +short A "$host" @8.8.8.8 | head -n1)
    fi
    if [[ -z "$ip" ]] && check_command nslookup; then
        ip=$(nslookup "$host" 1.1.1.1 | awk '/^Address: /{print $2; exit}')
        [[ -z "$ip" ]] && ip=$(nslookup "$host" 8.8.8.8 | awk '/^Address: /{print $2; exit}')
    fi
    if [[ -z "$ip" ]]; then
        # Last attempt via getent without ahostsv4
        ip=$(getent hosts "$host" | awk '{print $1; exit}')
    fi
    if [[ -n "$ip" ]]; then
        if ! grep -q "\s$host$" /etc/hosts; then
            echo "$ip $host" >> /etc/hosts
            log "${GREEN}[OK]${RESET} Added temporary hosts entry: $ip $host"
        else
            log "${CYAN}[INFO]${RESET} Hosts already contains $host entry."
        fi
        return 0
    fi
    log "${RED}[ERROR]${RESET} Unable to resolve $host via public DNS. Please check your network DNS settings."
    return 1
}

install_java() {
    if check_command java; then
        log "${GREEN}[OK]${RESET} Java is already installed."
    else
        log "${CYAN}[INFO]${RESET} Installing Java..."
        # Update package indexes using IPv4 to avoid IPv6-only repo issues
        apt-get update -o Acquire::ForceIPv4=true -y >>"$LOG_FILE" 2>&1 || true
        # Select supported Java based on distro version (Debian 13+: Java 21, Debian 12 or earlier: Java 17)
        JAVA_PKG="openjdk-17-jre"
        if [[ -r /etc/os-release ]]; then
            . /etc/os-release
            if [[ "${ID:-}" == "debian" ]] && dpkg --compare-versions "${VERSION_ID:-0}" ge "13"; then
                JAVA_PKG="openjdk-21-jre"
            fi
        fi
        apt-get install -y fontconfig "$JAVA_PKG" >>"$LOG_FILE" 2>&1
        if check_command java; then
            log "${GREEN}[OK]${RESET} Java installed successfully."
        else
            log "${RED}[ERROR]${RESET} Failed to install Java."
            exit 1
        fi
    fi
}

setup_repo() {
    log "${CYAN}[INFO]${RESET} Configuring Jenkins apt repository and keyring..."
    install -d -m 0755 /etc/apt/keyrings >>"$LOG_FILE" 2>&1 || true
    curl -fsSL "$JENKINS_KEY_URL" -o "$JENKINS_KEYRING_PATH"
    chmod a+r "$JENKINS_KEYRING_PATH"
    echo "deb [signed-by=$JENKINS_KEYRING_PATH] https://pkg.jenkins.io/$JENKINS_RELEASE binary/" | tee /etc/apt/sources.list.d/jenkins.list >/dev/null
    # Update only Jenkins repo indexes to avoid third-party repo failures
    apt-get update -o Acquire::ForceIPv4=true \
                   -o Dir::Etc::sourcelist=/etc/apt/sources.list.d/jenkins.list \
                   -o Dir::Etc::sourceparts=/dev/null -y >>"$LOG_FILE" 2>&1 || true
    if curl -fsSL "https://pkg.jenkins.io/$JENKINS_RELEASE/binary/Packages" | grep -q '^Package: jenkins$'; then
        log "${GREEN}[OK]${RESET} Jenkins repo configured and remote index lists package."
    else
        log "${YELLOW}[WARN]${RESET} Jenkins package not visible in remote index; proceeding with install regardless."
    fi
}

configure_update_center() {
    # Decide update center URL based on release track (stable vs current)
    local site_url="https://updates.jenkins.io/current/update-center.json"
    if [[ "$JENKINS_RELEASE" == *stable* ]]; then
        site_url="https://updates.jenkins.io/stable/update-center.json"
    fi
    local jhome="/var/lib/jenkins"
    local init_dir="$jhome/init.groovy.d"
    install -d -m 0755 "$init_dir" >>"$LOG_FILE" 2>&1 || true
    cat > "$init_dir/10-update-center.groovy" <<EOF
import jenkins.model.Jenkins
import hudson.model.UpdateSite

def j = Jenkins.getInstanceOrNull()
if (j != null) {
  def uc = j.getUpdateCenter()
  def list = uc.getSites()
  list.clear()
  list.add(new UpdateSite("default", "$site_url"))
  uc.updateAllSites()
  println("Configured Jenkins update site: $site_url")
}
EOF
    log "${GREEN}[OK]${RESET} Prepared update center init script for: $site_url"
}

install_jenkins() {
    if dpkg-query -W -f='${Status}\n' jenkins 2>/dev/null | grep -q "install ok installed"; then
        log "${GREEN}[OK]${RESET} Jenkins is already installed."
    else
        log "${CYAN}[INFO]${RESET} Installing Jenkins..."
        # General update; tolerate failures from unrelated repos, prefer IPv4
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -o Acquire::ForceIPv4=true -y >>"$LOG_FILE" 2>&1 || true
        if apt-get install -o Acquire::ForceIPv4=true -y --no-install-recommends jenkins >>"$LOG_FILE" 2>&1; then
            if dpkg-query -W -f='${Status}\n' jenkins 2>/dev/null | grep -q "install ok installed"; then
                log "${GREEN}[OK]${RESET} Jenkins installed successfully."
            else
                log "${YELLOW}[WARN]${RESET} apt reported success, but dpkg status is not 'install ok installed'. Proceeding to start service."
            fi
        else
            log "${RED}[ERROR]${RESET} apt-get install jenkins failed. Check $LOG_FILE for details."
            exit 1
        fi
    fi
}

enable_start_service() {
    if systemctl is-active --quiet jenkins; then
        log "${CYAN}[INFO]${RESET} Restarting Jenkins service to apply configuration..."
        systemctl restart jenkins >>"$LOG_FILE" 2>&1
        if systemctl is-active --quiet jenkins; then
            log "${GREEN}[OK]${RESET} Jenkins service restarted."
        else
            log "${RED}[ERROR]${RESET} Failed to restart Jenkins service."
            exit 1
        fi
    else
        log "${CYAN}[INFO]${RESET} Enabling and starting Jenkins service..."
        systemctl enable jenkins >>"$LOG_FILE" 2>&1
        systemctl start jenkins >>"$LOG_FILE" 2>&1
        if systemctl is-active --quiet jenkins; then
            log "${GREEN}[OK]${RESET} Jenkins service started."
        else
            log "${RED}[ERROR]${RESET} Failed to start Jenkins service."
            exit 1
        fi
    fi
}

show_initial_password() {
    if [[ -f /var/lib/jenkins/secrets/initialAdminPassword ]]; then
        log "${YELLOW}[INFO]${RESET} Jenkins initial admin password:"
        cat /var/lib/jenkins/secrets/initialAdminPassword | tee -a "$LOG_FILE"
    else
        log "${RED}[ERROR]${RESET} Initial password not found. Check Jenkins logs."
    fi
}

# =========================
# Main
# =========================
check_root
log "${CYAN}========= Jenkins Installer =========${RESET}"

install_java
ensure_host_dns "pkg.jenkins.io" || true
setup_repo
install_jenkins
configure_update_center
ensure_host_dns "updates.jenkins.io" || true
enable_start_service
show_initial_password

log "${CYAN}========= Installation Complete =========${RESET}"