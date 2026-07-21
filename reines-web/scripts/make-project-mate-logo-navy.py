"""Build the navy-on-transparent Project Mate portal mark.

Same crop + luminance-to-alpha pipeline as make-project-mate-logo.py, but the
opaque foreground colour is the brand navy (#2d4a6b) instead of white. This
is the asset used for "on-light" contexts (e.g. the auth pages' mobile brand
mark, which sits on a light zinc/white panel) — a brightness(0) filter on the
white mark rendered flat black there, which the client wants as the actual
brand navy instead.
"""

from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__29___1_-71ae0c13-5594-4484-bb7b-cd3cc04716dd.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "logo-project-mate-navy.png"

MAX_X = 819

NAVY_RGB = (45, 74, 107)  # #2d4a6b
NAVY_LUMINANCE = 0.299 * NAVY_RGB[0] + 0.587 * NAVY_RGB[1] + 0.114 * NAVY_RGB[2]
WHITE_LUMINANCE = 255.0


def luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    src = src.crop((0, 0, min(MAX_X, src.size[0]), src.size[1]))
    w, h = src.size
    px = src.load()

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()

    span = WHITE_LUMINANCE - NAVY_LUMINANCE
    for y in range(h):
        for x in range(w):
            l = luminance(*px[x, y])
            alpha = (WHITE_LUMINANCE - l) / span
            alpha = max(0.0, min(1.0, alpha))
            if alpha > 0:
                opx[x, y] = (*NAVY_RGB, round(alpha * 255))

    bbox = out.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("No foreground pixels found.")
    trimmed = out.crop(bbox)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    trimmed.save(OUT, format="PNG", optimize=True)
    print(f"saved {OUT} ({trimmed.size[0]}x{trimmed.size[1]})")


if __name__ == "__main__":
    main()
