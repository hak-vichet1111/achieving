pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 10, unit: 'MINUTES')
  }

  parameters {
    string(name: 'HOST_SERVER', defaultValue: '62.146.233.85', description: 'Remote host to SSH (e.g. 62.146.233.85)')
    string(name: 'SSH_PORT', defaultValue: '22', description: 'SSH port on remote host')
    string(name: 'SSH_USER_ID', defaultValue: '', description: 'Jenkins Secret Text credential ID for SSH username (e.g. jenkins)')
    string(name: 'SSH_PASS_ID', defaultValue: '', description: 'Jenkins Secret Text credential ID for SSH password')
  }

  stages {
    stage('Validate Parameters') {
      steps {
        script {
          if (!params.HOST_SERVER?.trim()) { error('HOST_SERVER is required') }
          if (!params.SSH_USER_ID?.trim()) { error('SSH_USER_ID (credential ID) is required') }
          if (!params.SSH_PASS_ID?.trim()) { error('SSH_PASS_ID (credential ID) is required') }
        }
      }
    }

    stage('Install sshpass if needed') {
      steps {
        sh '''
          set -eux
          if command -v sshpass >/dev/null 2>&1; then
            exit 0
          fi

          echo "sshpass not found; attempting installation"

          # Optimize for Debian-based agents
          if command -v apt-get >/dev/null 2>&1; then
            export DEBIAN_FRONTEND=noninteractive
            sudo apt-get -y update || true
            sudo apt-get -y install --no-install-recommends sshpass || true
          else
            echo "No known package manager found. Please install sshpass manually." >&2
          fi

          command -v sshpass >/dev/null 2>&1 || { echo "sshpass still missing" >&2; exit 1; }
        '''
      }
    }

    stage('Check Remote Node/npm') {
      steps {
        script {
          withCredentials([
            string(credentialsId: params.SSH_USER_ID, variable: 'SSH_USER'),
            string(credentialsId: params.SSH_PASS_ID, variable: 'SSH_PASS')
          ]) {
            sh '''
              set -eux
              HOST="${HOST_SERVER}"
              PORT="${SSH_PORT}"
              USER="${SSH_USER}"
              PASS="${SSH_PASS}"

              # Verify Node and npm on remote; fail if missing
              sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" '
                set -e
                if command -v node >/dev/null 2>&1; then
                  echo "node installed: $(node --version)"
                else
                  echo "node not installed" >&2; exit 1
                fi
                if command -v npm >/dev/null 2>&1; then
                  echo "npm installed: $(npm --version)"
                else
                  echo "npm not installed" >&2; exit 1
                fi
              '
            '''
          }
        }
      }
    }

    stage('SSH Connectivity Test') {
      steps {
        script {
          withCredentials([
            string(credentialsId: params.SSH_USER_ID, variable: 'SSH_USER'),
            string(credentialsId: params.SSH_PASS_ID, variable: 'SSH_PASS')
          ]) {
            sh '''
              set -eux
              HOST="${HOST_SERVER}"
              PORT="${SSH_PORT}"
              USER="${SSH_USER}"
              PASS="${SSH_PASS}"

              # Basic connectivity and identity
              sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" "whoami; hostname; uname -a; id"

              # Check target deployment directory presence
              sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" "ls -ld /var/www/achieving || echo 'Directory missing: /var/www/achieving'"

            '''
          }
        }
      }
    }
  }

  post {
    success {
      echo 'SSH smoke test completed successfully.'
    }
    failure {
      echo 'SSH smoke test failed. Check credentials, network, or firewall.'
    }
  }
}
