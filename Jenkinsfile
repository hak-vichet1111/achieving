pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
  }
  environment {
    DEPLOY_HOST = "62.146.233.58"
    DEPLOY_USER = "jenkins"
    DEPLOY_USER_PASS = "43werHL@!erd"
    FRONTEND_PATH = "frontend"
    ANGIE_WEBROOT = "/var/www/achieving"
    ANGIE_SERVICE_NAME = "angie"
    ANGIE_TEST_URL = "http://62.146.233.58"
    BACKEND_SERVICE_NAME = "achieving-backend"
    DEPLOY_BACKEND = "false"
    TELEGRAM_BOT_TOKEN = "8033277462:AAGhQ_ROqmKObcFjKatjEvvr8x1eGkYueyg"
    TELEGRAM_CHAT_ID = "-4906597719"

  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git rev-parse --short HEAD > .gitsha'
      }
    }

    stage('Ensure Node.js (agent)') {
      steps {
        sh label: 'Verify Node on Jenkins agent', script: '''
          set -euo pipefail
          if ! command -v node >/dev/null 2>&1; then 
            echo "Node.js is not installed on Jenkins agent. Please install Node 18+." >&2
            exit 1
          fi
          # If the project uses pnpm, ensure pnpm is available; otherwise skip
          if [ -f "${FRONTEND_PATH}/pnpm-lock.yaml" ] && ! command -v pnpm >/dev/null 2>&1; then
            if command -v npm >/dev/null 2>&1; then
              echo "pnpm lockfile detected; installing pnpm globally"
              npm install -g pnpm || true
            else
              echo "pnpm required but npm not available to install it" >&2
            fi
          fi
          node --version
          npm --version || true
          pnpm --version || true
        '''
      }
    }

    stage('Build Frontend (agent)') {
      steps {
        sh label: 'Install deps and build locally', script: '''
          set -euo pipefail
          FRONTEND_PATH="${FRONTEND_PATH}"
          cd "$FRONTEND_PATH"
          if [ -f pnpm-lock.yaml ]; then
            if ! command -v pnpm >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then npm install -g pnpm || true; fi
            if command -v pnpm >/dev/null 2>&1; then
              pnpm install --frozen-lockfile
              pnpm build
            else
              echo "pnpm lockfile found but pnpm not available" >&2; exit 1
            fi
          elif [ -f package-lock.json ]; then
            if command -v npm >/dev/null 2>&1; then
              npm ci
              npm run build
            else
              echo "package-lock.json found but npm not available" >&2; exit 1
            fi
          else
            # Fallback when no lockfile: use npm if present
            if command -v npm >/dev/null 2>&1; then
              npm install
              npm run build
            else
              echo "No package manager found on Jenkins agent (npm/pnpm)." >&2
              exit 1
            fi
          fi
        '''
      }
    }

    stage('Backup Angie Webroot (SSH)') {
      steps {
        sshagent(credentials: ['prod-server-ssh']) {
          sh label: 'Create timestamped backup of current webroot', script: '''
            set -euo pipefail
            COMMIT=$(cat .gitsha || echo unknown)
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} bash -lc "\
              set -euo pipefail; \
              ANGIE_WEBROOT=\"${ANGIE_WEBROOT}\"; \
              BACKUP_DIR=\"/var/backups\"; \
              TS=\"$(date +%Y%m%d-%H%M%S)\"; \
              sudo mkdir -p \"$BACKUP_DIR\"; \
              sudo tar -czf \"$BACKUP_DIR/achieving-$TS-${COMMIT}.tgz\" -C \"$(dirname \"$ANGIE_WEBROOT\")\" \"$(basename \"$ANGIE_WEBROOT\")\"; \
              echo \"Backup created: $BACKUP_DIR/achieving-$TS-${COMMIT}.tgz\"; \
            "
          '''
        }
      }
    }

    stage('Upload Artifacts (SSH)') {
      steps {
        sshagent(credentials: ['prod-server-ssh']) {
          sh label: 'rsync dist/ to webroot via SSH', script: '''
            set -euo pipefail
            FRONTEND_PATH="${FRONTEND_PATH}"
            ANGIE_WEBROOT="${ANGIE_WEBROOT}"
            rsync -a --delete -e "ssh -o StrictHostKeyChecking=no" --rsync-path="sudo rsync" \
              "$FRONTEND_PATH/dist/" "${DEPLOY_USER}@${DEPLOY_HOST}:${ANGIE_WEBROOT}/"
          '''
        }
      }
    }

    stage('Restart Angie (SSH)') {
      steps {
        sshagent(credentials: ['prod-server-ssh']) {
          sh label: 'Restart service and check status', script: '''
            set -euo pipefail
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} bash -lc "\
              set -euo pipefail; \
              ANGIE_SERVICE_NAME=\"${ANGIE_SERVICE_NAME}\"; \
              sudo systemctl restart \"$ANGIE_SERVICE_NAME\"; \
              STATUS=$(systemctl is-active \"$ANGIE_SERVICE_NAME\" || true); \
              echo \"Angie status: $STATUS\"; \
              if [ \"$STATUS\" != \"active\" ]; then \
                echo \"Angie failed to start\" >&2; journalctl -u \"$ANGIE_SERVICE_NAME\" -n 200 --no-pager || true; exit 2; \
              fi; \
            "
          '''
        }
      }
    }

    stage('Verify Angie HTTP (agent)') {
      steps {
        sh label: 'HTTP check from Jenkins agent', script: '''
          set -euo pipefail
          ANGIE_TEST_URL="${ANGIE_TEST_URL}"
          if [ -n "$ANGIE_TEST_URL" ]; then
            curl -fsSL "$ANGIE_TEST_URL" >/dev/null || { echo "HTTP check failed at $ANGIE_TEST_URL" >&2; exit 3; }
          fi
        '''
      }
    }

    stage('Backend Restart (optional, SSH)') {
      when { expression { return env.DEPLOY_BACKEND?.toBoolean() } }
      steps {
        sshagent(credentials: ['prod-server-ssh']) {
          sh label: 'Restart backend systemd service', script: '''
            set -euo pipefail
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} bash -lc "\
              set -euo pipefail; \
              BACKEND_SERVICE_NAME=\"${BACKEND_SERVICE_NAME}\"; \
              sudo systemctl restart \"$BACKEND_SERVICE_NAME\"; \
              STATUS=$(systemctl is-active \"$BACKEND_SERVICE_NAME\" || true); \
              echo \"Backend status: $STATUS\"; \
              if [ \"$STATUS\" != \"active\" ]; then exit 2; fi; \
            "
          '''
        }
      }
    }
  }

  post {
    success {
      withCredentials([
        string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_BOT_TOKEN'),
        string(credentialsId: 'telegram-chat-id', variable: 'TELEGRAM_CHAT_ID')
      ]) {
        sh '''
          set -euo pipefail
          COMMIT=$(cat .gitsha)
          MSG="✅ Achieving deploy SUCCESS\nHost: ${DEPLOY_HOST}\nCommit: ${COMMIT}\nAngie: active"
          curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" -d text="$MSG" >/dev/null
        '''
      }
    }
    failure {
      withCredentials([
        string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_BOT_TOKEN'),
        string(credentialsId: 'telegram-chat-id', variable: 'TELEGRAM_CHAT_ID')
      ]) {
        sh '''
          set -euo pipefail
          COMMIT=$(cat .gitsha || echo unknown)
          MSG="❌ Achieving deploy FAILED\nHost: ${DEPLOY_HOST}\nCommit: ${COMMIT}\nSee Jenkins logs for details"
          curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" -d text="$MSG" >/dev/null || true
        '''
      }
    }
  }
}