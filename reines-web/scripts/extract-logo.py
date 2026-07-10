"""Extract transparent logo from white-on-black (or blue-background) source assets."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

# Prefer the clean white-on-black master asset in /public.
SRC_CANDIDATES = [
    PUBLIC / "reines-logo.png",
    Path(
        r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
        r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
        r"_images_ChatGPT_Image_Jul_10__2026__12_20_45_PM-38c568a0-4ef1-4a49-ae1f-29d4017afae7.png"
    ),
]

OUT_LOGO = PUBLIC / "logo.png"
OUT_ICON = PUBLIC / "logo-loader.png"

BLACK_LUMINANCE = 32
BLACK_MARK_LUMINANCE = 52


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def is_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True

    lum = luminance(r, g, b)
    if lum <= BLACK_LUMINANCE:
        return True

    # Remove slate/navy export backgrounds (screenshots or colored exports).
    if lum < 175 and b > r + 8 and b >= g - 6:
        return True

    return False


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


def clean_logo_pixels(img: Image.Image) -> Image.Image:
    """Convert extracted marks to pure white/black with no gray background halos."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue

            lum = luminance(r, g, b)

            if lum <= BLACK_MARK_LUMINANCE:
                px[x, y] = (0, 0, 0, 255)
            else:
                alpha = max(0, min(255, int(round(lum))))
                px[x, y] = (255, 255, 255, alpha)

    return rgba


def trim_transparent(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    return img.crop(bbox) if bbox else img


def resolve_source() -> Path:
    for candidate in SRC_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit("No logo source image found.")


def extract_icon_from_logo(logo: Image.Image) -> Image.Image:
    """Crop the left hexagon mark for the loading screen icon."""
    w, h = logo.size
    px = logo.load()

    def col_alpha(x: int) -> int:
        return sum(1 for y in range(h) if px[x, y][3] > 20)

    in_blob = False
    icon_end = min(90, w)
    for x in range(w):
        dense = col_alpha(x) > h * 0.15
        if dense and not in_blob:
            in_blob = True
        elif in_blob and not dense:
            gap = all(col_alpha(x + i) <= h * 0.08 for i in range(min(8, w - x)))
            if gap:
                icon_end = x
                break

    icon = logo.crop((0, 0, icon_end, h))
    icon = trim_transparent(icon)
    side = max(icon.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - icon.size[0]) // 2
    oy = (side - icon.size[1]) // 2
    canvas.paste(icon, (ox, oy), icon)
    return canvas


def main() -> None:
    src = resolve_source()
    img = Image.open(src)
    print(f"Source: {src} ({img.size[0]}x{img.size[1]}, mode={img.mode})")

    result = clean_logo_pixels(flood_remove_background(img))
    result = trim_transparent(result)

    PUBLIC.mkdir(parents=True, exist_ok=True)
    result.save(OUT_LOGO, format="PNG", optimize=True)
    print(f"Saved logo: {OUT_LOGO} ({result.size[0]}x{result.size[1]})")

    icon = trim_transparent(extract_icon_from_logo(result))
    icon.save(OUT_ICON, format="PNG", optimize=True)
    print(f"Saved icon: {OUT_ICON} ({icon.size[0]}x{icon.size[1]})")


if __name__ == "__main__":
    main()
