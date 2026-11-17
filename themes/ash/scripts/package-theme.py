#!/usr/bin/env python3
"""Create a portable theme archive without generated files."""
import argparse
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
arguments = parser.parse_args()
destination = Path(arguments.output).resolve()
excluded = {'.git', '.DS_Store', '.hugo_build.lock', 'node_modules', 'public', 'resources', 'test-results', 'playwright-report', '.test-output', '__pycache__'}
destination.parent.mkdir(parents=True, exist_ok=True)
count = 0
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob('*')):
        relative = file.relative_to(root)
        if file.is_file() and not excluded.intersection(relative.parts) and file.resolve() != destination:
            archive.write(file, Path('ash') / relative)
            count += 1
print(f'{destination}: {count} files, {destination.stat().st_size:,} bytes')
