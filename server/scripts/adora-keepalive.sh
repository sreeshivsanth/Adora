#!/usr/bin/env bash
# Adora Anti-Idle Watchdog for Oracle Cloud Always Free Tier
# Generates a controlled ~20% CPU calculation for 5 minutes (300s)
# to keep 7-day average CPU utilization safely above Oracle's 15% reclamation threshold.

DURATION=300 # 5 minutes
END_TIME=$((SECONDS + DURATION))

echo "[Adora Watchdog] Starting keep-alive CPU spin at $(date)"

while [ $SECONDS -lt $END_TIME ]; do
    # Run a mild calculation then sleep briefly to avoid 100% throttling
    for i in {1..250000}; do
        _=$((i * i))
    done
    sleep 0.15
done

echo "[Adora Watchdog] Keep-alive cycle completed at $(date)"
