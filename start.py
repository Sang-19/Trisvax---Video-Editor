#!/usr/bin/env python3
"""Docker setup and physical Android device diagnostics for Trisvax Video Editor."""
from __future__ import annotations
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / ("start-" + time.strftime("%Y%m%d-%H%M%S") + ".log")
COUNTS = {"PASS": 0, "WARN": 0, "FAIL": 0}

def log(message: str) -> None:
    line = "[" + time.strftime("%H:%M:%S") + "] " + message
    print(line, flush=True)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")

def run_check(label: str, command: list[str], required: bool = True, timeout: int = 900) -> bool:
    log("CHECK: " + label)
    try:
        result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, timeout=timeout, check=False)
        output = (result.stdout or "").strip()
        if output:
            for line in output.splitlines()[-15:]:
                log("  " + line)
        if result.returncode == 0:
            COUNTS["PASS"] += 1
            log("PASS: " + label)
            return True
        status = "FAIL" if required else "WARN"
        COUNTS[status] += 1
        log(status + ": " + label + " (exit " + str(result.returncode) + ")")
        return False
    except (OSError, subprocess.TimeoutExpired) as exc:
        status = "FAIL" if required else "WARN"
        COUNTS[status] += 1
        log(status + ": " + label + ": " + str(exc))
        return False

def main() -> int:
    log("=" * 68)
    log("TRISVAX VIDEO EDITOR — ENVIRONMENT STARTUP")
    log("Project: " + str(ROOT))
    log("Python: " + sys.version.split()[0])
    log("=" * 68)
    if os.name != "nt":
        COUNTS["WARN"] += 1
        log("WARN: Windows launcher expected; continuing with available tools.")

    docker = shutil.which("docker")
    adb = shutil.which("adb")
    if not docker:
        COUNTS["FAIL"] += 1
        log("FAIL: Docker CLI not found. Install/start Docker Desktop and add docker.exe to PATH.")
    else:
        run_check("Docker CLI", ["docker", "--version"])
        run_check("Docker Compose", ["docker", "compose", "version"])
        docker_ok = run_check("Docker daemon", ["docker", "info"], timeout=60)

    if not adb:
        COUNTS["FAIL"] += 1
        log("FAIL: adb not found. Install Android SDK Platform-Tools and add platform-tools to PATH.")
    else:
        run_check("ADB installation", ["adb", "version"])
        run_check("ADB device listing", ["adb", "devices"])
        try:
            result = subprocess.run(["adb", "devices"], text=True, capture_output=True, timeout=20)
            rows = [row.strip() for row in result.stdout.splitlines()[1:] if row.strip()]
            if any(row.endswith("\\tdevice") for row in rows):
                COUNTS["PASS"] += 1
                log("PASS: Authorized physical Android device detected.")
            elif any("unauthorized" in row for row in rows):
                COUNTS["FAIL"] += 1
                log("FAIL: Phone unauthorized. Unlock it and accept the USB debugging prompt.")
            else:
                COUNTS["FAIL"] += 1
                log("FAIL: No physical device. Connect USB and enable USB debugging.")
        except (OSError, subprocess.TimeoutExpired) as exc:
            COUNTS["FAIL"] += 1
            log("FAIL: Could not inspect ADB devices: " + str(exc))

    if docker and locals().get("docker_ok", False):
        image_ok = run_check("Build Docker image", ["docker", "compose", "build"], timeout=1800)
        if image_ok and run_check("Start Docker container", ["docker", "compose", "up", "-d"], timeout=180):
            run_check("Container running", ["docker", "compose", "ps", "--status", "running"])
            run_check("Node inside Docker", ["docker", "compose", "exec", "-T", "trisvax-video-editor", "node", "--version"])
            run_check("Java inside Docker", ["docker", "compose", "exec", "-T", "trisvax-video-editor", "java", "-version"])
            run_check("Android SDK inside Docker",
                      ["docker", "compose", "exec", "-T", "trisvax-video-editor", "bash", "-lc", "sdkmanager --list_installed"],
                      required=False, timeout=120)

    log("=" * 68)
    log("SUMMARY: " + str(COUNTS["PASS"]) + " PASS | " + str(COUNTS["WARN"]) +
        " WARN | " + str(COUNTS["FAIL"]) + " FAIL")
    log("Log file: " + str(LOG_FILE))
    if COUNTS["FAIL"]:
        log("RESULT: Setup has failures. Resolve FAIL items and run start.bat again.")
        return 1
    log("RESULT: Environment checks passed. App scaffold/build is a separate step.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
