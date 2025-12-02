"""
CLI Test Script for NARI Alarm System
Tests alarm triggering without web interface
"""
import time
from datetime import datetime, timedelta
import pytz
from backend.core.clock_system import ClockManager

IST = pytz.timezone('Asia/Kolkata')

def test_alarm_trigger():
    print("=" * 60)
    print("NARI Alarm System - CLI Test")
    print("=" * 60)
    
    # Create clock manager without socketio
    manager = ClockManager(socketio=None)
    
    # Get current time and set alarm for 1 minute from now
    now = datetime.now(IST)
    alarm_time = now + timedelta(minutes=1)
    alarm_time_str = alarm_time.strftime("%Y-%m-%d %H:%M")
    
    print(f"\nCurrent time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Setting alarm for: {alarm_time_str}")
    
    # Add test alarm
    result = manager.add_alarm("CLI Test Alarm", alarm_time_str, repeat=False)
    
    if result:
        print(f"[OK] Alarm created successfully: {result}")
        print(f"  ID: {result['id']}")
        print(f"  Enabled: {result['enabled']}")
    else:
        print("[FAIL] Failed to create alarm")
        return
    
    print(f"\nWaiting for alarm to trigger at {alarm_time_str}...")
    print("(Will check every second for 90 seconds)")
    print("-" * 60)
    
    # Monitor for 90 seconds
    for i in range(90):
        current = datetime.now(IST)
        current_str = current.strftime("%Y-%m-%d %H:%M:%S")
        
        # Check alarms
        triggered = manager.check_alarms()
        
        if triggered:
            print(f"\n{'='*60}")
            print(f"[ALARM TRIGGERED] at {current_str}!")
            print(f"{'='*60}")
            for alarm in triggered:
                print(f"  Alarm: {alarm['name']}")
                print(f"  Time: {alarm['time']}")
                print(f"  Enabled: {alarm['enabled']}")
            print(f"{'='*60}\n")
            print("[OK] Test PASSED - Alarm triggered successfully!")
            return True
        
        # Show progress every 10 seconds
        if i % 10 == 0:
            print(f"[{current_str}] Checking... ({i}/90 seconds)")
        
        time.sleep(1)
    
    print(f"\n[FAIL] Test FAILED - Alarm did not trigger within 90 seconds")
    print(f"Final alarm state:")
    for alarm in manager.alarms:
        print(f"  {alarm}")
    return False

if __name__ == "__main__":
    test_alarm_trigger()
