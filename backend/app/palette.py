from __future__ import annotations

import json
import os
import subprocess


_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_NODE_SCRIPT = os.path.join(_ROOT, "palette_generator.cjs")


def generate_palette(count: int) -> list[str]:
    result = subprocess.run(
        ["node", _NODE_SCRIPT, str(count)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout or "[]")
