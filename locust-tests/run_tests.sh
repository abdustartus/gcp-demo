#!/bin/bash
HOST="http://localhost:3000"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo "Stage 1: Warmup (10 users, 1 min)"
echo "========================================"
locust -f "$DIR/locustfile.py" \
  --headless \
  --host=$HOST \
  --users 10 \
  --spawn-rate 2 \
  --run-time 1m \
  --html "$DIR/reports/stage1_warmup.html" \
  --csv "$DIR/reports/stage1_warmup" \
  2>&1 | tail -20

echo ""
echo "========================================"
echo "Stage 2: Baseline (100 users, 3 min)"
echo "========================================"
locust -f "$DIR/locustfile.py" \
  --headless \
  --host=$HOST \
  --users 100 \
  --spawn-rate 10 \
  --run-time 3m \
  --html "$DIR/reports/stage2_baseline.html" \
  --csv "$DIR/reports/stage2_baseline" \
  2>&1 | tail -20

echo ""
echo "========================================"
echo "Stage 3: Spike — Coldplay Rush (500 users, 3 min)"
echo "========================================"
locust -f "$DIR/locustfile.py" \
  --headless \
  --host=$HOST \
  --users 500 \
  --spawn-rate 50 \
  --run-time 3m \
  --html "$DIR/reports/stage3_spike.html" \
  --csv "$DIR/reports/stage3_spike" \
  2>&1 | tail -20

echo ""
echo "All stages complete! Reports saved to $DIR/reports/"
