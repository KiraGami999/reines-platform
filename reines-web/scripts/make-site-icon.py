"""Build favicon / home-screen icons from the rebranded circular mark.

Produces a ChatGPT-style full-bleed icon: the slate-blue disc fills the
square edge-to-edge so circular OS masks never show a black box behind it.
"""

from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__26_-Photoroom-202d1ecb-9a8b-4238-b5cd-6241d0d545e3.png"
)
PUBLIC = Path(__file__).resolve().parents[1] / "public"
APP = Path(__file__).resolve().parents[1] / "app"

# Sampled from the uploaded emblem ring
SLATE = (53, 71, 93)


def is_black(r: int, g: int, b: int) -> bool:
    return r + g + b <= 28


def crop_to_mark(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if not is_black(r, g, b):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < 0:
        return rgb

    # Tight crop on the circular emblem (almost no padding)
    side = max(max_x - min_x + 1, max_y - min_y + 1)
    cx = (min_x + max_x) // 2
    cy = (min_y + max_y) // 2
    half = side // 2
    left = max(0, cx - half)
    top = max(0, cy - half)
    right = min(w, left + side)
    bottom = min(h, top + side)
    return rgb.crop((left, top, right, bottom))


def make_full_bleed(im: Image.Image) -> Image.Image:
    """Fill black corners with slate so the icon is solid edge-to-edge."""
    rgb = im.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if is_black(r, g, b):
                px[x, y] = SLATE
    return rgb


def save_png(im: Image.Image, path: Path, size: int) -> None:
    out = im.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, format="PNG", optimize=True)
    print(f"saved {path} ({size}x{size})")


def main() -> None:
    mark = make_full_bleed(crop_to_mark(Image.open(SRC)))
    PUBLIC.mkdir(parents=True, exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)

    save_png(mark, PUBLIC / "logo-icon.png", 512)
    save_png(mark, PUBLIC / "apple-touch-icon.png", 180)
    save_png(mark, APP / "icon.png", 32)
    save_png(mark, APP / "apple-icon.png", 180)

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [mark.resize(size, Image.Resampling.LANCZOS) for size in ico_sizes]
    ico_path = PUBLIC / "favicon.ico"
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_images[1:],
    )
    print(f"saved {ico_path}")


if __name__ == "__main__":
    main()
