import os
import subprocess
import datetime
import requests
from minio import Minio
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# Load configurations
# -----------------------------
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")

MINIO_URL = os.getenv("MINIO_URL")
MINIO_BUCKET = os.getenv("MINIO_BUCKET")
MINIO_PATH = os.getenv("MINIO_PATH")

BACKUP_PATH = os.getenv("BACKUP_PATH")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Ensure backup directory exists
os.makedirs(BACKUP_PATH, exist_ok=True)

# Timestamp for file name
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_file = f"{DB_NAME}_{timestamp}.sql"
backup_full_path = os.path.join(BACKUP_PATH, backup_file)
compressed_file = f"{backup_file}.gz"
compressed_full_path = os.path.join(BACKUP_PATH, compressed_file)


# -----------------------------
# Function: Send Telegram message
# -----------------------------
def send_telegram(msg: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    requests.post(url, data={
        "chat_id": TELEGRAM_CHAT_ID,
        "text": msg
    })


# -----------------------------
# Step 1: Dump MySQL Database
# -----------------------------
def backup_database():
    cmd = [
        "mysqldump",
        f"-h{DB_HOST}",
        f"-u{DB_USER}",
        f"-p{DB_PASS}",
        DB_NAME
    ]

    try:
        with open(backup_full_path, "w") as f:
            subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, check=True)
        return True
    except subprocess.CalledProcessError as e:
        send_telegram(f"❌ MySQL Backup Failed!\nError: {e.stderr.decode()}")
        return False


# -----------------------------
# Step 2: Compress Backup
# -----------------------------
def compress_backup():
    cmd = ["gzip", backup_full_path]
    try:
        subprocess.run(cmd, check=True)
        return True
    except Exception as e:
        send_telegram(f"❌ Compression Failed: {str(e)}")
        return False


# -----------------------------
# Step 3: Upload to MinIO (Public Bucket)
# -----------------------------
def upload_to_minio():
    try:
        client = Minio(
            MINIO_URL.replace("http://", "").replace("https://", ""),
            access_key=None,
            secret_key=None,
            secure=False
        )

        object_name = f"{MINIO_PATH}/{compressed_file}"

        client.fput_object(
            bucket_name=MINIO_BUCKET,
            object_name=object_name,
            file_path=compressed_full_path,
        )

        return f"{MINIO_URL}/{MINIO_BUCKET}/{object_name}"

    except Exception as e:
        send_telegram(f"❌ Upload to MinIO Failed!\nError: {str(e)}")
        return None


# -----------------------------
# Main Process
# -----------------------------
if __name__ == "__main__":
    send_telegram("⏳ Starting MySQL Backup...")

    if not backup_database():
        exit(1)

    compress_backup()

    file_url = upload_to_minio()

    if file_url:
        send_telegram(
            f"✅ MySQL Backup Successful!\n"
            f"📁 Database: {DB_NAME}\n"
            f"☁️ Uploaded to MinIO:\n{file_url}"
        )
    else:
        send_telegram("❌ Backup completed but upload to MinIO failed!")