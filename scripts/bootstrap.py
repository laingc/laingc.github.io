#!/usr/bin/env python3
"""Install the pinned Hugo binary locally, without administrator access."""

import hashlib
import os
from pathlib import Path
import platform
import re
import subprocess
import tarfile
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def install():
    version = (ROOT / ".hugo-version").read_text().strip()
    destination = ROOT / ".tools" / "hugo"
    if destination.is_file():
        result = subprocess.run([str(destination), "version"], capture_output=True, text=True, check=True)
        installed = re.match(r"hugo v([0-9.]+)(?:[-+ ]|$)", result.stdout)
        if installed and installed.group(1) == version:
            print(result.stdout.strip())
            return
    system = platform.system().lower()
    machine = platform.machine().lower()
    if system == "darwin":
        asset = f"hugo_{version}_darwin-universal.pkg"
    elif system == "linux" and machine in ("x86_64", "aarch64", "arm64"):
        arch = "amd64" if machine == "x86_64" else "arm64"
        asset = f"hugo_{version}_linux-{arch}.tar.gz"
    else:
        raise SystemExit(f"Unsupported platform: {system}/{machine}. Use macOS or Linux.")
    base = f"https://github.com/gohugoio/hugo/releases/download/v{version}"
    with tempfile.TemporaryDirectory(prefix="hugo-install-") as directory:
        temporary = Path(directory)
        archive = temporary / asset
        urllib.request.urlretrieve(f"{base}/{asset}", archive)
        with urllib.request.urlopen(f"{base}/hugo_{version}_checksums.txt", timeout=60) as response:
            checksums = dict(line.split()[::-1] for line in response.read().decode().splitlines() if line.strip())
        actual = hashlib.sha256(archive.read_bytes()).hexdigest()
        if checksums.get(asset) != actual:
            raise SystemExit("Hugo checksum mismatch. No binary installed.")
        if system == "darwin":
            expanded = temporary / "expanded"
            subprocess.run(["pkgutil", "--expand-full", str(archive), str(expanded)], check=True)
            candidates = [p for p in expanded.rglob("hugo") if p.is_file()]
            if len(candidates) != 1:
                raise SystemExit("Cannot identify the Hugo binary in the package.")
            binary = candidates[0].read_bytes()
        else:
            with tarfile.open(archive) as package:
                member = package.extractfile("hugo")
                if member is None:
                    raise SystemExit("The Hugo archive contains no binary.")
                binary = member.read()
        destination.parent.mkdir(exist_ok=True)
        destination.write_bytes(binary)
        os.chmod(destination, 0o755)
    subprocess.run([str(destination), "version"], check=True)


def install_scanner():
    version = (ROOT / ".gitleaks-version").read_text().strip()
    destination = ROOT / ".tools" / "gitleaks"
    if destination.is_file():
        result = subprocess.run([str(destination), "version"], capture_output=True, text=True, check=True)
        if result.stdout.strip().lstrip("v") == version:
            print(f"Gitleaks {version}")
            return
    system = platform.system().lower()
    machine = platform.machine().lower()
    if system not in ("darwin", "linux") or machine not in ("x86_64", "aarch64", "arm64"):
        raise SystemExit(f"Unsupported scanner platform: {system}/{machine}")
    arch = "x64" if machine == "x86_64" else "arm64"
    asset = f"gitleaks_{version}_{system}_{arch}.tar.gz"
    base = f"https://github.com/gitleaks/gitleaks/releases/download/v{version}"
    with tempfile.TemporaryDirectory(prefix="gitleaks-install-") as directory:
        archive = Path(directory) / asset
        urllib.request.urlretrieve(f"{base}/{asset}", archive)
        with urllib.request.urlopen(f"{base}/gitleaks_{version}_checksums.txt", timeout=60) as response:
            checksums = dict(line.split()[::-1] for line in response.read().decode().splitlines() if line.strip())
        if hashlib.sha256(archive.read_bytes()).hexdigest() != checksums.get(asset):
            raise SystemExit("Gitleaks checksum mismatch. No binary installed.")
        with tarfile.open(archive) as package:
            member = package.extractfile("gitleaks")
            if member is None:
                raise SystemExit("The Gitleaks archive contains no binary.")
            destination.write_bytes(member.read())
        os.chmod(destination, 0o755)
    print(f"Gitleaks {version}")


if __name__ == "__main__":
    install()
    install_scanner()
