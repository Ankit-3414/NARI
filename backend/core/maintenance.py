import os
import json
import hashlib
import shutil
import time
from datetime import datetime
from backend.core.logger import recovery_logger, system_logger

HASH_FILE = os.path.join("data", "core", "hashes.json")
BACKUP_DIR = os.path.join("data", "backups")

class IntegrityChecker:
    def __init__(self):
        self.hashes = self._load_hashes()

    def _load_hashes(self):
        if os.path.exists(HASH_FILE):
            try:
                with open(HASH_FILE, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                system_logger.error(f"Corrupted hash file: {HASH_FILE}")
                return {}
        return {}

    def _save_hashes(self):
        os.makedirs(os.path.dirname(HASH_FILE), exist_ok=True)
        with open(HASH_FILE, 'w') as f:
            json.dump(self.hashes, f, indent=4)

    def calculate_hash(self, file_path):
        """Calculates SHA256 hash of a file."""
        if not os.path.exists(file_path):
            return None
        
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def update_hash(self, file_path):
        """Updates the stored hash for a file."""
        current_hash = self.calculate_hash(file_path)
        if current_hash:
            self.hashes[file_path] = current_hash
            self._save_hashes()
            system_logger.info(f"Updated hash for {file_path}")

    def verify_integrity(self, file_path):
        """
        Verifies if the file matches its stored hash.
        Returns True if valid or no hash stored yet.
        Returns False if hash mismatch.
        """
        if file_path not in self.hashes:
            # New file, treat as valid and save hash
            self.update_hash(file_path)
            return True
        
        current_hash = self.calculate_hash(file_path)
        if current_hash != self.hashes[file_path]:
            system_logger.warning(f"Integrity check failed for {file_path}")
            return False
        
        return True

class AutoRecovery:
    def __init__(self):
        self.integrity_checker = IntegrityChecker()

    def create_backup(self, file_path):
        """Creates a timestamped backup of the file."""
        if not os.path.exists(file_path):
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_folder = os.path.join(BACKUP_DIR, timestamp)
        os.makedirs(backup_folder, exist_ok=True)
        
        filename = os.path.basename(file_path)
        dest_path = os.path.join(backup_folder, filename)
        
        shutil.copy2(file_path, dest_path)
        recovery_logger.info(f"Created backup for {file_path} at {dest_path}")

    def restore_from_backup(self, file_path):
        """Restores the file from the most recent backup."""
        filename = os.path.basename(file_path)
        
        # Find all backups containing this file
        backups = []
        if not os.path.exists(BACKUP_DIR):
            recovery_logger.error("No backup directory found.")
            return False

        for ts_folder in os.listdir(BACKUP_DIR):
            ts_path = os.path.join(BACKUP_DIR, ts_folder)
            if os.path.isdir(ts_path):
                potential_backup = os.path.join(ts_path, filename)
                if os.path.exists(potential_backup):
                    backups.append(potential_backup)
        
        if not backups:
            recovery_logger.error(f"No backups found for {file_path}")
            return False
        
        # Sort by timestamp (folder name)
        backups.sort(reverse=True)
        latest_backup = backups[0]
        
        try:
            shutil.copy2(latest_backup, file_path)
            recovery_logger.info(f"Restored {file_path} from {latest_backup}")
            self.integrity_checker.update_hash(file_path) # Update hash after restore
            return True
        except Exception as e:
            recovery_logger.error(f"Failed to restore {file_path}: {e}")
            return False

    def ensure_file_integrity(self, file_path, default_content={}):
        """
        Checks integrity, attempts repair/restore if needed.
        If file doesn't exist, creates it with default_content.
        """
        # 1. Check existence
        if not os.path.exists(file_path):
            system_logger.info(f"File {file_path} missing. Creating new.")
            self._create_new_file(file_path, default_content)
            return

        # 2. Check Integrity
        if not self.integrity_checker.verify_integrity(file_path):
            recovery_logger.warning(f"File {file_path} corrupted (hash mismatch). Attempting restore...")
            if not self.restore_from_backup(file_path):
                recovery_logger.error(f"Restore failed for {file_path}. Resetting to default.")
                # Backup the corrupted file just in case
                corrupted_backup = file_path + ".corrupted." + datetime.now().strftime("%Y%m%d_%H%M%S")
                shutil.move(file_path, corrupted_backup)
                self._create_new_file(file_path, default_content)
            return

        # 3. Validate JSON structure
        try:
            with open(file_path, 'r') as f:
                json.load(f)
        except json.JSONDecodeError:
            recovery_logger.warning(f"File {file_path} has invalid JSON. Attempting restore...")
            if not self.restore_from_backup(file_path):
                 # Backup the corrupted file just in case
                corrupted_backup = file_path + ".corrupted." + datetime.now().strftime("%Y%m%d_%H%M%S")
                shutil.move(file_path, corrupted_backup)
                self._create_new_file(file_path, default_content)

    def _create_new_file(self, file_path, content):
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            json.dump(content, f, indent=4)
        self.integrity_checker.update_hash(file_path)
        self.create_backup(file_path) # Initial backup

