#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/workspace/.mrs-browsers}"
if [[ -d /workspace/.mrs-system/root/usr/lib/x86_64-linux-gnu ]]; then
  export LD_LIBRARY_PATH="/workspace/.mrs-system/root/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  # Playwright's dlopen preflight checks the global ldconfig cache only, which
  # cannot see rootless libraries. Verify actual dynamic loading before replacing
  # that preflight; browser startup and every functional assertion still run.
  python - <<'PY'
import ctypes
for name in ['libgtk-4.so.1','libgraphene-1.0.so.0','libharfbuzz-icu.so.0','libmanette-0.2.so.0','libhyphen.so.0','libGLESv2.so.2']:
    ctypes.CDLL(name)
print('WebKit rootless dependencies: dynamic load verified')
PY
  export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
fi
exec npm run test:e2e -- --project=webkit "$@"
