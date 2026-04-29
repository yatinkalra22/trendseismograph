#!/usr/bin/env python3
"""
Run the Zerve cells locally without a Zerve runtime.

This loads each `zerve/cells/NN_<block>.py` file in order, executes it, and
captures its module globals so downstream cells can read them via
`from zerve import variable`. The cells themselves are not modified.

Default selection: cell 01 only (smoke test). Pass cell numbers to run more.

Usage:
    python scripts/run_zerve_local.py                  # smoke test (cell 01)
    python scripts/run_zerve_local.py 01 02 04 05      # run a subset
    python scripts/run_zerve_local.py --all            # run 01..11
    python scripts/run_zerve_local.py --list           # list cells and exit
    python scripts/run_zerve_local.py --all --skip 03 06 07
        # run everything except cells that need YouTube + transformers

Notes:
    - Cells 12 (API) and 13 (App) are deployment artefacts; they are never
      run by --all. To launch cell 13 as a Streamlit app locally, run
      `streamlit run zerve/cells/13_app.py` directly.
    - Cell 02 pings Google Trends (~5-7 min for 47 trends; pytrends is slow).
    - Cell 03 needs YOUTUBE_API_KEY in your environment or .env file.
    - Cells 06 and 07 download ~700 MB of HuggingFace model weights on first
      run, then cache them under ~/.cache/huggingface.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CELLS_DIR = REPO_ROOT / "zerve" / "cells"
TRENDS_CSV = REPO_ROOT / "data" / "trends.csv"

# Make `from zerve import variable` resolve to our local shim.
sys.path.insert(0, str(REPO_ROOT))
import zerve  # noqa: E402 — must follow path insert

CELL_PATTERN = re.compile(r"^(\d{2})_([a-z_0-9]+)\.py$")
DEPLOYMENT_CELLS = {"12", "13"}  # not run by --all


def discover_cells() -> list[tuple[str, str, Path]]:
    """Return [(num, block_name, path), ...] sorted by cell number."""
    out: list[tuple[str, str, Path]] = []
    for p in sorted(CELLS_DIR.glob("*.py")):
        m = CELL_PATTERN.match(p.name)
        if m:
            out.append((m.group(1), m.group(2), p))
    return out


def load_dotenv_if_present() -> None:
    """Minimal .env loader so YOUTUBE_API_KEY etc. are visible to cells."""
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


def run_cell(num: str, block_name: str, path: Path, work_dir: Path) -> int:
    print(f"\n{'=' * 64}\n[ {num} ] {block_name}\n{'=' * 64}")
    src = path.read_text()
    code = compile(src, str(path), "exec")
    cell_globals: dict[str, object] = {
        "__name__": "__main__",
        "__file__": str(path),
    }
    cwd = os.getcwd()
    os.chdir(work_dir)
    try:
        exec(code, cell_globals)
    finally:
        os.chdir(cwd)

    # Capture data outputs only: skip dunders, modules, classes, callables.
    import types
    outputs = {
        k: v
        for k, v in cell_globals.items()
        if not k.startswith("_")
        and not isinstance(v, types.ModuleType)
        and not callable(v)
    }
    zerve._set_block_outputs(block_name, outputs)
    print(f"[ {num} ] {block_name}: captured {len(outputs)} output variables")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("only", nargs="*", help="Cell numbers to run (e.g. 01 02 04)")
    ap.add_argument("--skip", nargs="*", default=[], help="Cell numbers to skip")
    ap.add_argument("--all", action="store_true", help="Run cells 01..11 (skips deployment cells 12, 13)")
    ap.add_argument("--list", action="store_true", help="List cells and exit")
    args = ap.parse_args()

    cells = discover_cells()
    if args.list:
        for num, name, _ in cells:
            tag = "  (deployment)" if num in DEPLOYMENT_CELLS else ""
            print(f"  {num}  {name}{tag}")
        return 0

    only = {n.zfill(2) for n in args.only}
    skip = {n.zfill(2) for n in args.skip}

    if only:
        cells = [c for c in cells if c[0] in only]
    elif args.all:
        cells = [c for c in cells if c[0] not in DEPLOYMENT_CELLS]
    else:
        cells = [c for c in cells if c[0] == "01"]
        print("No cells specified — running smoke test (cell 01 only). "
              "Use --all or pass cell numbers (e.g. 01 02 04).")

    cells = [c for c in cells if c[0] not in skip]
    if not cells:
        print("No cells selected after filtering.")
        return 1

    load_dotenv_if_present()

    # Cell 01 looks for "trends.csv" at CWD. Stage a temp work dir with it present.
    work_dir = Path(tempfile.mkdtemp(prefix="zerve_local_"))
    if TRENDS_CSV.exists():
        shutil.copy(TRENDS_CSV, work_dir / "trends.csv")
    print(f"Workdir: {work_dir}")
    print(f"Will run: {[n for n, _, _ in cells]}")

    for num, name, path in cells:
        try:
            run_cell(num, name, path, work_dir)
        except SystemExit:
            raise
        except BaseException as exc:
            print(f"\n[ {num} ] {name} FAILED: {type(exc).__name__}: {exc}")
            import traceback
            traceback.print_exc()
            return 2

    print(f"\nAll done. Blocks captured: {zerve._list_blocks()}")
    print(f"Workdir kept at {work_dir} for inspection.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
