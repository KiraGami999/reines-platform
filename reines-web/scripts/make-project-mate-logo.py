"""Build the white-on-transparent Project Mate portal mark.

Source is a navy icon + wordmark on a white canvas. Output matches the
convention used by public/logo.png (white foreground, transparent
background) so the existing ReinesLogo on-dark / on-light (brightness-0)
variants work unmodified for both light and dark portal chrome.
"""

from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__29___1_-71ae0c13-5594-4484-bb7b-cd3cc04716dd.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "logo-project-mate.png"

WHITE_THRESHOLD = 235  # r/g/b above this on a white canvas = background


def is_background(r: int, g: int, b: int) -> bool:
    return r > WHITE_THRESHOLD and g > WHITE_THRESHOLD and b > WHITE_THRESHOLD


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    w, h = src.size
    px = src.load()

    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        if is_background(*px[x, y]):
            bg[y][x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                if is_background(*px[nx, ny]):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                continue
            # Foreground (navy mark + enclosed white detailing) → solid white.
            opx[x, y] = (255, 255, 255, 255)

    bbox = out.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("No foreground pixels found.")
    trimmed = out.crop(bbox)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    trimmed.save(OUT, format="PNG", optimize=True)
    print(f"saved {OUT} ({trimmed.size[0]}x{trimmed.size[1]})")


if __name__ == "__main__":
    main()
