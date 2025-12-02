import logging
import os
from logging.handlers import TimedRotatingFileHandler
from datetime import datetime

# Constants
LOG_DIR = os.path.join("data", "logs")
BACKUP_COUNT = 4  # Keep 4 weeks of logs (if rotating weekly)

def setup_logger(name, log_file, level=logging.INFO):
    """
    Sets up a logger with the specified name and log file.
    """
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Check if handler already exists to avoid duplicates
    if logger.handlers:
        return logger

    log_path = os.path.join(LOG_DIR, log_file)
    
    # Weekly rotation: 'W0' means rotate every Monday
    handler = TimedRotatingFileHandler(log_path, when="W0", interval=1, backupCount=BACKUP_COUNT)
    
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    # Add console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

# Create loggers
clock_logger = setup_logger('clock', 'clock.log')
automation_logger = setup_logger('automation', 'automation.log')
maintenance_logger = setup_logger('maintenance', 'maintenance.log')
recovery_logger = setup_logger('recovery', 'recovery.log')
system_logger = setup_logger('system', 'system.log')
