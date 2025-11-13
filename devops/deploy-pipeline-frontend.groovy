pipeline {
    agent any

    environment {
        GIT_REPO        = 'https://github.com/hak-vichet1111/achieving.git'
        TEMP_PATH       = '/tmp/frontend/achieving'
        PROD_SERVER     = '62.146.233.58'
        PROD_USER       = 'jenkins'
        PROD_PATH       = '/tmp/test-build-folder/achieving'   // change to /var/www/achieving for production
        BACKUP_PATH     = '/tmp/backup/achieving'
        SSH_CRED        = 'prod-server-ssh'
        PROD_PASS       = credentials('prod-server-password')
        TG_BOT_TOKEN    = credentials('telegram-bot-token')
        TG_CHAT_ID      = '-4906597719'
        BUILD_DIR       = 'frontend'
        BUILD_OUTPUT    = 'dist'
        KNOWN_HOSTS     = '/var/lib/jenkins/.ssh/known_hosts'
        VITE_API_BASE   = ''
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

        stage('Install and Build React Project') {
            steps {
                echo "⚙️ Building React project in ${TEMP_PATH}/${BUILD_DIR}"
                dir("${TEMP_PATH}/${BUILD_DIR}") {
                    sh '''
                        echo "Installing dependencies..."
                        if [ -f package-lock.json ]; then
                          npm ci
                        else
                          npm install
                        fi

                        echo "Preparing .env for Vite build..."
                        rm -f .env
                        echo "VITE_API_BASE='${VITE_API_BASE}'" > .env

                        echo "Building production build..."
                        npm run build
                    '''
                }
            }
        }

        stage('Deploy to Production Server') {
            steps {
                echo "🚀 Starting deployment to production server ${PROD_SERVER}"
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

                        # Safely remove outdated host key before connecting (best practice)
                        if [ -f ${KNOWN_HOSTS} ]; then
                          sudo -u jenkins ssh-keygen -f ${KNOWN_HOSTS} -R ${PROD_SERVER} || true
                        fi

                        # Re-learn and store new host key
                        sudo -u jenkins ssh-keyscan -H ${PROD_SERVER} >> ${KNOWN_HOSTS} 2>/dev/null || true
                        sudo chmod 600 ${KNOWN_HOSTS}
                        sudo chown jenkins:jenkins ${KNOWN_HOSTS}

                        REMOTE_TMP="~/achieving_build"

                        echo "📁 Preparing remote directories..."
                        sshpass -p "${PROD_PASS}" ssh -o StrictHostKeyChecking=yes ${PROD_USER}@${PROD_SERVER} "mkdir -p ${REMOTE_TMP} ${PROD_PATH} ${BACKUP_PATH}"

                        echo "📤 Transferring files to remote temp..."
                        sshpass -p "${PROD_PASS}" scp -o StrictHostKeyChecking=yes -r ${TEMP_PATH}/${BUILD_DIR}/${BUILD_OUTPUT}/. ${PROD_USER}@${PROD_SERVER}:${REMOTE_TMP}/

                        BACKUP_TS=`date +%Y%m%d%H%M%S`
                        BACKUP_DIR="${BACKUP_PATH}/achieving_${BACKUP_TS}"

                        echo "⚙️ Executing remote deployment..."
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

                            echo \"📦 Backing up current production...\"
                            if [ -d \"${PROD_PATH}\" ]; then
                                echo \"${PROD_PASS}\" | sudo -S rsync -a --delete \"${PROD_PATH}/\" \"${BACKUP_DIR}/\"
                            fi

                            echo \"🚀 Deploying new build...\"
                            echo \"${PROD_PASS}\" | sudo -S rsync -a --delete \"${REMOTE_TMP}/\" \"${PROD_PATH}/\"

                            echo \"🧽 Cleaning temporary build folder...\"
                            rm -rf \"${REMOTE_TMP}\"

                            echo \"🔧 Fixing permissions...\"
                            echo \"${PROD_PASS}\" | sudo -S chown -R www-data:www-data \"${PROD_PATH}\"
                            echo \"${PROD_PASS}\" | sudo -S chmod -R 755 \"${PROD_PATH}\"

                            echo \"✅ Deployment finished successfully.\"
                        "
                    '''
                }
            }
        }

        stage('Clean Temporary Files') {
            steps {
                echo "🧹 Cleaning up Jenkins build path"
                sh "rm -rf ${TEMP_PATH}"
            }
        }
    }

    post {
        success {
            echo "✅ Deployment completed successfully!"
            script {
                sh '''
                    SERVICE_STATUS=$(sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_SERVER "systemctl is-active angie 2>/dev/null || systemctl is-active nginx 2>/dev/null || echo unknown")
                    FILES_COUNT=$(sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_SERVER "find $PROD_PATH -type f | wc -l 2>/dev/null || echo 0")
                    TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

                    curl -s -X POST https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage \
                        -d chat_id=$TG_CHAT_ID \
                        -d text="✅ *Frontend Deployment Successful!*%0AHost: $PROD_SERVER%0APath: $PROD_PATH%0AFiles: $FILES_COUNT%0AService: $SERVICE_STATUS%0ATime: $TS" \
                        -d parse_mode=Markdown
                '''
            }
        }

        failure {
            echo "❌ Deployment failed! Initiating rollback..."
            script {
                sh '''
                    set -e
                    if ! command -v sshpass >/dev/null 2>&1; then
                      echo "Installing sshpass..."
                      if command -v apt-get >/dev/null 2>&1; then
                        sudo apt-get update -y && sudo apt-get install -y sshpass || true
                      fi
                    fi

                    LAST_BACKUP=`sshpass -p "${PROD_PASS}" ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} "ls -t ${BACKUP_PATH}/achieving_* 2>/dev/null | head -n 1"`
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
                            # No pre-clean needed; rsync --delete restores exact backup contents
                            echo \"${PROD_PASS}\" | sudo -S rsync -a --delete \"$LAST_BACKUP/\" \"${PROD_PATH}/\"
                            echo \"${PROD_PASS}\" | sudo -S chown -R www-data:www-data ${PROD_PATH}
                            echo \"${PROD_PASS}\" | sudo -S chmod -R 755 ${PROD_PATH}
                        "
                    else
                        echo "⚠️ No backup found for rollback!"
                    fi
                '''

                sh '''
                    SERVICE_STATUS=$(sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_SERVER "systemctl is-active angie 2>/dev/null || systemctl is-active nginx 2>/dev/null || echo unknown")
                    TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
                    curl -s -X POST https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage \
                        -d chat_id=$TG_CHAT_ID \
                        -d text="🚨 *Frontend Deployment Failed!*%0ARollback attempted if backup found.%0AHost: $PROD_SERVER%0APath: $PROD_PATH%0AService: $SERVICE_STATUS%0ATime: $TS" \
                        -d parse_mode=Markdown
                '''
            }
        }
    }
}