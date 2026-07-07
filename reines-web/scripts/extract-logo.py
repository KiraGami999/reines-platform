"""Extract transparent logo from uploaded asset — removes outer black background only."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__24_-Photoroom-29f5dd6d-cb68-4827-832c-4d518cfa3962.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "logo.png"

# Pixels at or below this luminance connected to image edges become transparent.
BACKGROUND_LUMINANCE = 28


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def is_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    return luminance(r, g, b) <= BACKGROUND_LUMINANCE


def flood_remove_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    bg = [[False] * w for _ in range(h)]

    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        r, g, b, a = px[x, y]
        if is_background_pixel(r, g, b, a):
            bg[y][x] = True
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                r, g, b, a = px[nx, ny]
                if is_background_pixel(r, g, b, a):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (0, 0, 0, 0)

    return rgba


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source not found: {SRC}")

    img = Image.open(SRC)
    print(f"Source: {SRC.name} ({img.size[0]}x{img.size[1]}, mode={img.mode})")

    result = flood_remove_background(img)

    alpha_bbox = result.getchannel("A").getbbox()
    if alpha_bbox:
        result = result.crop(alpha_bbox)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    result.save(OUT, format="PNG", optimize=True)
    print(f"Saved: {OUT} ({result.size[0]}x{result.size[1]})")

    # Verify alpha channel exists
    alpha = result.getchannel("A")
    bbox = alpha.getbbox()
    print(f"Content bbox: {bbox}")


if __name__ == "__main__":
    main()
