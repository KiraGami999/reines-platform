"""Build the white-on-transparent Project Mate portal mark.

Source is a navy icon + wordmark + a superscript "®" mark on a white canvas.

Two fixes over the original version of this script:

1. The "®" is cropped out. At the small sizes this logo renders at in the
   portal sidebar/header (~24-32px tall) it shrinks to an illegible hollow
   dot next to "Mate", which reads as a stray rendering artifact.
2. Conversion is per-pixel luminance → alpha, not a background flood-fill.
   The flood-fill approach only marked pixels reached from the canvas edges
   as "background"; enclosed light pixels — the building's window-slit
   details inside the icon, and letter counters like the holes in "P" / "o"
   / "e" / "a" — were never reached, so they got merged into the same solid
   white as the navy mark itself. That flattened the icon into a featureless
   blob and made letters look chunky. Recolouring by how dark each pixel is
   (navy → opaque white, white → transparent) fixes both anti-aliased edges
   *and* enclosed light details in one pass, with no connectivity analysis.

Output matches the convention used by public/logo.png (white foreground,
transparent background) so the existing ReinesLogo on-dark / on-light
(brightness-0) variants work unmodified for both light and dark portal chrome.
"""

from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\kiras\.cursor\projects\c-Users-kiras-OneDrive-Desktop-Reines-Platform\assets"
    r"\c__Users_kiras_AppData_Roaming_Cursor_User_workspaceStorage_bcbead6fdb3a5819cec5df2c66988749"
    r"_images_Rebranded_Logo__29___1_-71ae0c13-5594-4484-bb7b-cd3cc04716dd.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "logo-project-mate.png"

# The "®" mark sits well right of the wordmark with a wide background gap in
# between (verified at x≈819-826 on the 1024px-wide source). Clip the source
# to just before that gap so the trademark circle never enters the crop.
MAX_X = 819

# Luminance of the brand navy (~#2d4a6b) and of a white canvas — pixels are
# mapped linearly between these two so anti-aliased edges stay smooth.
NAVY_LUMINANCE = 0.299 * 45 + 0.587 * 74 + 0.114 * 107  # ≈ 69
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
                opx[x, y] = (255, 255, 255, round(alpha * 255))

    bbox = out.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("No foreground pixels found.")
    trimmed = out.crop(bbox)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    trimmed.save(OUT, format="PNG", optimize=True)
    print(f"saved {OUT} ({trimmed.size[0]}x{trimmed.size[1]})")


if __name__ == "__main__":
    main()
