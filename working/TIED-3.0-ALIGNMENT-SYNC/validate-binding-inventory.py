#!/usr/bin/env python3
"""Argv-only wrapper: load binding-inventory.yaml rows and call binding_inventory_validate."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKING = ROOT / "working" / "TIED-3.0-ALIGNMENT-SYNC"
CLI = ROOT / ".cursor/skills/tied-yaml/scripts/tied-cli.sh"

try:
    import yaml
except ImportError:
    print("yaml package required", file=sys.stderr)
    sys.exit(1)

inv_path = WORKING / "binding-inventory.yaml"
inv = yaml.safe_load(inv_path.read_text())
rows = inv.get("bindings") or []
payload = json.dumps({"rows": rows})

result = subprocess.run(
    [str(CLI), "binding_inventory_validate", payload],
    cwd=str(ROOT),
    env={**dict(**{"TIED_BASE_PATH": str(ROOT / "tied")}), **dict(__import__("os").environ)},
    capture_output=True,
    text=True,
)
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)
sys.exit(result.returncode)
