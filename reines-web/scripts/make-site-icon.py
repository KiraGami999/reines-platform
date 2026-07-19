"""Build favicon / site icons from the rebranded circular mark."""

from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__26_-Photoroom-202d1ecb-9a8b-4238-b5cd-6241d0d545e3.png"
)
PUBLIC = Path(__file__).resolve().parents[1] / "public"
APP = Path(__file__).resolve().parents[1] / "app"


def crop_to_mark(im: Image.Image, pad_ratio: float = 0.04) -> Image.Image:
    """Trim excess black padding around the circular emblem; keep black background."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            # Non-black content (slate circle + white hexagon)
            if r + g + b > 24:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < 0:
        return rgb

    side = max(max_x - min_x + 1, max_y - min_y + 1)
    pad = max(4, int(side * pad_ratio))
    cx = (min_x + max_x) // 2
    cy = (min_y + max_y) // 2
    half = side // 2 + pad
    left = max(0, cx - half)
    top = max(0, cy - half)
    right = min(w, cx + half)
    bottom = min(h, cy + half)
    cropped = rgb.crop((left, top, right, bottom))

    # Force square canvas with black fill
    s = max(cropped.size)
    canvas = Image.new("RGB", (s, s), (0, 0, 0))
    ox = (s - cropped.size[0]) // 2
    oy = (s - cropped.size[1]) // 2
    canvas.paste(cropped, (ox, oy))
    return canvas


def main() -> None:
    mark = crop_to_mark(Image.open(SRC))
    PUBLIC.mkdir(parents=True, exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)

    # High-res PNG used by metadata + Apple / PWA-style icons
    icon_512 = mark.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(PUBLIC / "logo-icon.png", format="PNG", optimize=True)
    print(f"saved {PUBLIC / 'logo-icon.png'} (512x512)")

    apple = mark.resize((180, 180), Image.Resampling.LANCZOS)
    apple.save(PUBLIC / "apple-touch-icon.png", format="PNG", optimize=True)
    print(f"saved {PUBLIC / 'apple-touch-icon.png'} (180x180)")

    # Multi-size ICO for browser tab / taskbar
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

    # Next.js App Router file-based icons (preferred discovery)
    app_icon = mark.resize((32, 32), Image.Resampling.LANCZOS)
    app_icon.save(APP / "icon.png", format="PNG", optimize=True)
    print(f"saved {APP / 'icon.png'} (32x32)")

    apple_app = mark.resize((180, 180), Image.Resampling.LANCZOS)
    apple_app.save(APP / "apple-icon.png", format="PNG", optimize=True)
    print(f"saved {APP / 'apple-icon.png'} (180x180)")


if __name__ == "__main__":
    main()
