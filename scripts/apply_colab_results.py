"""
Apply a Colab backfill bundle to the local repository.

After running `notebooks/backfill_ai_colab.ipynb` on Colab GPU you'll get a
zip like `une_backfill_<timestamp>.zip`. Drop it next to the repo (or pass its
path) and run:

    python scripts/apply_colab_results.py /path/to/une_backfill_<ts>.zip

What it does:
  1. Verifies the zip contains `telegram_messages.db` and at least one JSON.
  2. Backs up the existing local DB to `telegram_messages.db.bak`.
  3. Replaces the DB and the JSONs in `app/public/data/`.
  4. Prints a `git status` snapshot so you can review and commit yourself.

It NEVER commits or pushes — review the diff first.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply a Colab backfill bundle to the repo.")
    parser.add_argument("zip_path", help="Path to the une_backfill_<ts>.zip produced by Colab.")
    parser.add_argument(
        "--repo-root",
        default=str(Path(__file__).resolve().parent.parent),
        help="Path to the repo root (defaults to parent of this script).",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip writing telegram_messages.db.bak before replacing the DB.",
    )
    args = parser.parse_args()

    zip_path = Path(args.zip_path)
    repo = Path(args.repo_root)
    if not zip_path.is_file():
        print(f"ERROR: zip not found: {zip_path}", file=sys.stderr)
        return 1
    if not repo.is_dir():
        print(f"ERROR: repo not found: {repo}", file=sys.stderr)
        return 1

    with zipfile.ZipFile(zip_path) as zf:
        members = zf.namelist()
        has_db = any(m.endswith("telegram_messages.db") for m in members)
        json_members = [m for m in members if m.endswith(".json") and "analysis_data_" in m]
        if not has_db:
            print("ERROR: zip does not contain telegram_messages.db", file=sys.stderr)
            return 2
        if not json_members:
            print("ERROR: zip contains no analysis_data_*.json", file=sys.stderr)
            return 2

        target_db = repo / "telegram_messages.db"
        if target_db.exists() and not args.no_backup:
            backup = repo / "telegram_messages.db.bak"
            shutil.copy2(target_db, backup)
            print(f"Backup written: {backup}")

        for m in members:
            if not (m.endswith(".db") or m.endswith(".json")):
                continue
            data = zf.read(m)
            # Strip the optional top-level wrapping folder.
            rel = m
            for member_root in (
                "telegram_messages.db",
                "app/public/data/",
            ):
                if member_root in m:
                    idx = m.find(member_root)
                    rel = m[idx:]
                    break
            target = repo / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            print(f"  applied {rel} ({len(data) / 1024:.0f} KB)")

    # Show git status so the user can review.
    print("\n--- git status ---")
    subprocess.run(["git", "status", "--short"], cwd=repo, check=False)
    print(
        "\nReview changes with `git diff -- app/public/data/`, then commit when you're happy:\n"
        "  git add telegram_messages.db app/public/data/analysis_data_*.json\n"
        "  git commit -m 'AI backfill from Colab GPU'\n"
        "  git push"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
