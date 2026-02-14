from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
APP_DIR = ROOT_DIR / "app"

MAX_ROUTE_LINES = 700
HEX_COLOR_PATTERN = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})")
RGBA_PATTERN = re.compile(r"rgba?\(")
WITH_SPRING_PATTERN = re.compile(r"\bwithSpring\s*\(")
HAPTICS_PATTERN = re.compile(r"expo-haptics")


def iter_route_files() -> list[Path]:
    return sorted(APP_DIR.rglob("*.tsx"))


def main() -> None:
    violations: list[str] = []

    for route_path in iter_route_files():
        relative = route_path.relative_to(ROOT_DIR).as_posix()
        content = route_path.read_text(encoding="utf-8")
        line_count = content.count("\n") + 1

        if line_count > MAX_ROUTE_LINES:
            violations.append(
                f"{relative}: route has {line_count} lines (max {MAX_ROUTE_LINES})"
            )

        if HEX_COLOR_PATTERN.search(content) or RGBA_PATTERN.search(content):
            violations.append(
                f"{relative}: contains raw color literal; use theme tokens instead"
            )

        if WITH_SPRING_PATTERN.search(content):
            violations.append(
                f"{relative}: contains withSpring transition; use timing-based motion"
            )

        if HAPTICS_PATTERN.search(content):
            violations.append(
                f"{relative}: contains haptic import/usage; avoid haptics in current polish baseline"
            )

    if violations:
        print("Frontend guardrails failed:")
        for violation in violations:
            print(f"- {violation}")
        sys.exit(1)

    print("Frontend guardrails passed.")


if __name__ == "__main__":
    main()
