"""Crop the rebranded logo tightly for the public navbar (keep navy background)."""

from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__25_-214c012e-ae68-412d-887c-6c7d0bebf4eb.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "logo-nav-rebrand.png"


def is_mark(r: int, g: int, b: int) -> bool:
    return r > 200 and g > 200 and b > 200


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    px = im.load()

    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if is_mark(r, g, b):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < 0:
        raise SystemExit("No logo marks found to crop.")

    pad_x = max(8, int((max_x - min_x) * 0.06))
    pad_y = max(8, int((max_y - min_y) * 0.18))
    left = max(0, min_x - pad_x)
    top = max(0, min_y - pad_y)
    right = min(w, max_x + pad_x + 1)
    bottom = min(h, max_y + pad_y + 1)

    cropped = im.crop((left, top, right, bottom))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(OUT, format="PNG", optimize=True)
    print(f"mark bbox: ({min_x}, {min_y})–({max_x}, {max_y})")
    print(f"saved {OUT} ({cropped.size[0]}x{cropped.size[1]})")


if __name__ == "__main__":
    main()
