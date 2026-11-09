#!/usr/bin/env python3
"""Reload workbooks and optionally recalc via LibreOffice; scan for formula errors."""
from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "downloads"
ERROR_TOKENS = ("#REF!", "#NAME?", "#DIV/0!", "#VALUE!", "#NULL!", "#N/A", "#NUM!")


def scan_formulas(path: Path):
    wb = load_workbook(path)
    issues = []
    formula_count = 0
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                v = cell.value
                if isinstance(v, str) and v.startswith("="):
                    formula_count += 1
                    for tok in ERROR_TOKENS:
                        if tok in v:
                            issues.append(f"{ws.title}!{cell.coordinate}: formula contains {tok}: {v}")
                    # basic #REF check for missing sheet refs already covered
    return formula_count, issues, wb.sheetnames


def soffice_recalc(path: Path, outdir: Path):
    """Convert to ODS and back / or xlsx via soffice to force recalc, then read values."""
    outdir.mkdir(parents=True, exist_ok=True)
    # Convert to xlsx again in temp (forces LibreOffice calc) — use ods intermediate
    cmd = [
        "soffice",
        "--headless",
        "--nolockcheck",
        "--nologo",
        "--norestore",
        "--convert-to",
        "xlsx",
        "--outdir",
        str(outdir),
        str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    return proc.returncode, proc.stdout + proc.stderr


def scan_cached_errors(path: Path):
    wb = load_workbook(path, data_only=True)
    found = []
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                v = cell.value
                if isinstance(v, str) and any(tok in v for tok in ERROR_TOKENS):
                    found.append(f"{ws.title}!{cell.coordinate}={v}")
    return found


def main():
    files = sorted(ROOT.glob("*.xlsx"))
    with tempfile.TemporaryDirectory() as td:
        tdp = Path(td)
        for path in files:
            print("=" * 60)
            print(path.name)
            fc, issues, sheets = scan_formulas(path)
            print(f"  sheets: {sheets}")
            print(f"  formulas: {fc}")
            if issues:
                print("  FORMULA TEXT ISSUES:")
                for i in issues:
                    print("   ", i)
            else:
                print("  formula text: OK (no embedded error tokens)")

            code, log = soffice_recalc(path, tdp)
            print(f"  soffice convert exit={code}")
            if code != 0:
                print(log[-500:])
            out = tdp / path.name
            if out.exists():
                errs = scan_cached_errors(out)
                # Also scan non-data_only for broken formulas LibreOffice may write
                fc2, issues2, _ = scan_formulas(out)
                print(f"  after recalc formulas={fc2}")
                if errs:
                    print("  CACHED VALUE ERRORS:")
                    for e in errs[:30]:
                        print("   ", e)
                    if len(errs) > 30:
                        print(f"   ... +{len(errs)-30} more")
                else:
                    print("  cached values: no #REF!/#NAME?/#DIV/0! etc.")
                if issues2:
                    print("  post-recalc formula text issues:")
                    for i in issues2[:20]:
                        print("   ", i)
            else:
                print("  WARN: converted file missing")


if __name__ == "__main__":
    main()
