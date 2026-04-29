"""
Local shim for the Zerve hosted runtime.

When running on Zerve, the platform supplies its own `zerve` package and
this file is ignored. When running locally via `scripts/run_zerve_local.py`,
this shim provides `variable(block_name, var_name)` so cells can be executed
unmodified outside the Zerve environment.

Storage is in-process: the runner exec's each cell, captures its module
globals, and registers them under the cell's block name via
`_set_block_outputs`. Subsequent cells then resolve `variable(...)` against
this dict.
"""
from __future__ import annotations

from typing import Any

_OUTPUTS: dict[str, dict[str, Any]] = {}


def variable(block_name: str, var_name: str) -> Any:
    """Return the named output produced by an upstream block."""
    if block_name not in _OUTPUTS:
        raise KeyError(
            f"Block '{block_name}' has not been run yet. "
            f"Run it first or check spelling. "
            f"Available blocks: {sorted(_OUTPUTS) or '(none)'}"
        )
    block = _OUTPUTS[block_name]
    if var_name not in block:
        raise KeyError(
            f"Block '{block_name}' did not produce variable '{var_name}'. "
            f"Available: {sorted(block) or '(none)'}"
        )
    return block[var_name]


def _set_block_outputs(block_name: str, outputs: dict[str, Any]) -> None:
    _OUTPUTS[block_name] = outputs


def _reset() -> None:
    _OUTPUTS.clear()


def _list_blocks() -> list[str]:
    return sorted(_OUTPUTS)
