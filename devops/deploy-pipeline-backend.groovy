pipeline {
    agent any

    environment {
        GIT_REPO        = 'https://github.com/hak-vichet1111/achieving.git'
        TEMP_PATH       = '/tmp/backend/achieving'
        PROD_SERVER     = '62.146.233.58'
        PROD_USER       = 'jenkins'
        PROD_PATH       = '/data/achieving/backend'   // change to /data/achieving/backend for production
        BACKUP_PATH     = '/tmp/backup/backend'
        PROD_PASS       = credentials('prod-server-password')
        TG_BOT_TOKEN    = credentials('telegram-bot-token')
        TG_CHAT_ID      = '-4906597719'
        BUILD_DIR       = 'backend'
        ARTIFACT_NAME   = 'achieving-backend'
        KNOWN_HOSTS     = '/var/lib/jenkins/.ssh/known_hosts'
    }

    stages {
        stage('Clone Project') {
            steps {
                echo "📦 Cloning repository from ${GIT_REPO}"
                dir("${TEMP_PATH}") {
                    deleteDir()
                    git branch: 'main', url: "${GIT_REPO}"
                }
            }
        }

        stage('Build Backend') {
            steps {
                echo "⚙️ Building Go backend in ${TEMP_PATH}/${BUILD_DIR}"
                dir("${TEMP_PATH}/${BUILD_DIR}") {
                    sh '''
                        set -e

                        # Ensure Go toolchain is available on Jenkins agent
                        if ! command -v go >/dev/null 2>&1; then
                            echo "Go is not installed. Installing golang-go..."
                            if command -v apt-get >/dev/null 2>&1; then
                                sudo apt-get update -y && sudo apt-get install -y golang-go
                            else
                                echo "Error: go not found and apt-get is unavailable. Please install Go on the agent." >&2
                                exit 1
                            fi
                        fi

                        echo "Go version:"
                        go version || true

                        echo "Ensuring Go modules downloaded..."
                        go mod download || true

                        echo "Building backend binary for Debian (Linux amd64)..."
                        GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o achieving-backend ./

                        echo "Verifying artifact..."
                        test -x achieving-backend
                    '''
                }
            }
        }

        stage('Deploy to Production Server') {
            steps {
                echo "🚀 Starting backend deployment to ${PROD_SERVER}"
                script {
                    sh '''
                        set -e

                        # Ensure sshpass is installed
                        if ! command -v sshpass >/dev/null 2>&1; then
                          echo "Installing sshpass..."
                          if command -v apt-get >/dev/null 2>&1; then
                            sudo apt-get update -y && sudo apt-get install -y sshpass || true
                          fi
                        fi

                        # Safely refresh host key
                        if [ -f ${KNOWN_HOSTS} ]; then
                          sudo -u jenkins ssh-keygen -f ${KNOWN_HOSTS} -R ${PROD_SERVER} || true
                        fi
                        sudo -u jenkins ssh-keyscan -H ${PROD_SERVER} >> ${KNOWN_HOSTS} 2>/dev/null || true
                        sudo chmod 600 ${KNOWN_HOSTS}
                        sudo chown jenkins:jenkins ${KNOWN_HOSTS}

                        REMOTE_TMP="~/achieving_backend_build"

                        echo "📁 Preparing remote directories..."
                        sshpass -p "${PROD_PASS}" ssh -o StrictHostKeyChecking=yes ${PROD_USER}@${PROD_SERVER} "mkdir -p ${REMOTE_TMP} ${PROD_PATH} ${BACKUP_PATH} && rm -rf ${REMOTE_TMP}/*"

                        echo "📤 Transferring backend artifact..."
                        sshpass -p "${PROD_PASS}" scp -o StrictHostKeyChecking=yes "${TEMP_PATH}/${BUILD_DIR}/${ARTIFACT_NAME}" ${PROD_USER}@${PROD_SERVER}:"${REMOTE_TMP}/"

                        BACKUP_TS=`date +%Y%m%d%H%M%S`
                        BACKUP_DIR="${BACKUP_PATH}/backend_${BACKUP_TS}"

                        echo "⚙️ Executing remote backend deployment..."
                        sshpass -p "${PROD_PASS}" ssh -o StrictHostKeyChecking=yes ${PROD_USER}@${PROD_SERVER} "
                            set -e

                            # Ensure rsync is available on remote
                            if ! command -v rsync >/dev/null 2>&1; then
                                if command -v apt-get >/dev/null 2>&1; then
                                    echo \"${PROD_PASS}\" | sudo -S apt-get update -y && echo \"${PROD_PASS}\" | sudo -S apt-get install -y rsync
                                fi
                            fi

                            echo \"📦 Creating backup directory...\"
                            echo \"${PROD_PASS}\" | sudo -S mkdir -p \"${BACKUP_DIR}\"

                            echo \"📦 Backing up current backend, if exists...\"
                            if [ -f \"${PROD_PATH}/${ARTIFACT_NAME}\" ]; then
                                echo \"${PROD_PASS}\" | sudo -S rsync -a --delete \"${PROD_PATH}/\" \"${BACKUP_DIR}/\"
                            fi

                            echo \"🚀 Deploying new backend...\"
                            echo \"${PROD_PASS}\" | sudo -S install -m 0755 \"${REMOTE_TMP}/${ARTIFACT_NAME}\" \"${PROD_PATH}/${ARTIFACT_NAME}\"

                            echo \"🔧 Fixing permissions...\"
                            echo \"${PROD_PASS}\" | sudo -S chown -R www-data:www-data \"${PROD_PATH}\"
                            echo \"${PROD_PASS}\" | sudo -S chmod -R 755 \"${PROD_PATH}\"

                            echo \"🧯 Restarting service, if exists...\"
                            echo \"${PROD_PASS}\" | sudo -S systemctl restart achieving-backend || true
                            echo \"🔍 Checking service status...\"
                            if echo \"${PROD_PASS}\" | sudo -S systemctl is-active --quiet achieving-backend; then
                                echo \"✅ achieving-backend is active\"
                            else
                                echo \"⚠️ achieving-backend is not active\"
                                echo \"${PROD_PASS}\" | sudo -S systemctl status achieving-backend --no-pager -l || true
                            fi

                            echo \"🧽 Cleaning temporary backend folder...\"
                            rm -rf \"${REMOTE_TMP}\"

                            echo \"✅ Backend deployment finished successfully.\"
                        "
                    '''
                }
            }
        }

        stage('Clean Temporary Files') {
            steps {
                echo "🧹 Cleaning up Jenkins backend build path"
                sh "rm -rf ${TEMP_PATH}"
            }
        }
    }

    post {
        success {
            echo "✅ Backend deployment completed successfully!"
            script {
                sh '''
                    STATUS=$(sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_SERVER "systemctl is-active achieving-backend 2>/dev/null || echo inactive")
                    SIZE=$(sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_SERVER "stat -c %s $PROD_PATH/$ARTIFACT_NAME 2>/dev/null || echo 0")
                    TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

                    curl -s -X POST https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage \
                        -d chat_id=$TG_CHAT_ID \
                        -d text="✅ *Backend Deployment Successful!*%0AHost: $PROD_SERVER%0APath: $PROD_PATH%0AService: $STATUS%0AArtifact: $ARTIFACT_NAME - $SIZE bytes%0ATime: $TS" \
                        -d parse_mode=Markdown
                '''
            }
        }

        failure {
            echo "❌ Backend deployment failed! Initiating rollback..."
            script {
                sh '''
                    set -e
                    if ! command -v sshpass >/dev/null 2>&1; then
                      echo "Installing sshpass..."
                      if command -v apt-get >/dev/null 2>&1; then
                        sudo apt-get update -y && sudo apt-get install -y sshpass || true
                      fi
                    fi

                    LAST_BACKUP=`sshpass -p "${PROD_PASS}" ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} "ls -t ${BACKUP_PATH}/backend_* 2>/dev/null | head -n 1"`
                    if [ -n "$LAST_BACKUP" ]; then
                        echo "🔄 Rolling back using $LAST_BACKUP"
                        sshpass -p "${PROD_PASS}" ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} "
                            set -e
                            # Ensure rsync is available on remote
                            if ! command -v rsync >/dev/null 2>&1; then
                                if command -v apt-get >/dev/null 2>&1; then
                                    echo \"${PROD_PASS}\" | sudo -S apt-get update -y && echo \"${PROD_PASS}\" | sudo -S apt-get install -y rsync
                                fi
                            fi
                            echo \"${PROD_PASS}\" | sudo -S rsync -a --delete \"$LAST_BACKUP/\" \"${PROD_PATH}/\"
                            echo \"${PROD_PASS}\" | sudo -S chown -R www-data:www-data ${PROD_PATH}
                            echo \"${PROD_PASS}\" | sudo -S chmod -R 755 ${PROD_PATH}
                            echo \"${PROD_PASS}\" | sudo -S systemctl restart achieving-backend || true
                            echo \"🔍 Checking service status after rollback...\"
                            if echo \"${PROD_PASS}\" | sudo -S systemctl is-active --quiet achieving-backend; then
                                echo \"✅ achieving-backend is active\"
                            else
                                echo \"⚠️ achieving-backend is not active\"
                                echo \"${PROD_PASS}\" | sudo -S systemctl status achieving-backend --no-pager -l || true
                            fi
                        "
                    else
                        echo "⚠️ No backend backup found for rollback!"
                    fi
                '''

                sh '''
                    STATUS=$(sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_SERVER "systemctl is-active achieving-backend 2>/dev/null || echo inactive")
                    TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
                    curl -s -X POST https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage \
                        -d chat_id=$TG_CHAT_ID \
                        -d text="🚨 *Backend Deployment Failed!*%0ARollback attempted if backup found.%0AHost: $PROD_SERVER%0APath: $PROD_PATH%0AService: $STATUS%0ATime: $TS" \
                        -d parse_mode=Markdown
                '''
            }
        }
    }
}