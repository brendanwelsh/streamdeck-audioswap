#!/usr/bin/env python3
"""Render the Audio Output Swap icon set as crisp vector PNGs (pycairo).

One mark: a speaker emitting a swap (two opposing arrows) = "swap the audio output".
Drawn in a 100x100 logical space and scaled to each Stream Deck target size, so every
output is sharp at its native resolution. Run:  python tools/make-icons.py
"""
import cairo, os

IMGS = os.path.join(os.path.dirname(__file__), "..", "com.welsh.audioswap.sdPlugin", "imgs")
IMGS = os.path.abspath(IMGS)
os.makedirs(IMGS, exist_ok=True)

WHITE  = (1, 1, 1)
SKY    = (0.22, 0.74, 0.97)   # #38BDF8 sky-400, the plugin's accent
SKY_HI = (0.06, 0.65, 0.91)   # #0EA5E9 sky-500 (tile gradient top)
SKY_LO = (0.01, 0.41, 0.63)   # #0369A1 sky-800 (tile gradient bottom)


def rrect(ctx, x, y, w, h, r):
    import math
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r,     r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r,     y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r,     y + r,     r, math.pi, 1.5 * math.pi)
    ctx.close_path()


def draw_glyph(ctx, body, arrow, sw):
    """Draw the speaker (color `body`) + swap arrows (color `arrow`) in 0..100 space."""
    # --- speaker: back box + cone ---
    ctx.set_source_rgb(*body)
    rrect(ctx, 8, 38, 16, 24, 3)      # back box
    ctx.fill()
    ctx.move_to(22, 38)               # cone
    ctx.line_to(42, 22)
    ctx.line_to(42, 78)
    ctx.line_to(22, 62)
    ctx.close_path()
    ctx.fill()

    # --- swap arrows (⇄) to the right of the cone ---
    ctx.set_source_rgb(*arrow)
    ctx.set_line_width(sw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    # top arrow -> right
    ctx.move_to(50, 38); ctx.line_to(86, 38); ctx.stroke()
    ctx.move_to(78, 30); ctx.line_to(86, 38); ctx.line_to(78, 46); ctx.stroke()
    # bottom arrow <- left
    ctx.move_to(88, 62); ctx.line_to(52, 62); ctx.stroke()
    ctx.move_to(60, 54); ctx.line_to(52, 62); ctx.line_to(60, 70); ctx.stroke()


def render(path, size, body, arrow, tile=False, margin=0.06, sw=7.0):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(surf)

    if tile:
        # full-color rounded app tile with a vertical sky gradient (the plugin "logo")
        grad = cairo.LinearGradient(0, 0, 0, size)
        grad.add_color_stop_rgb(0.0, *SKY_HI)
        grad.add_color_stop_rgb(1.0, *SKY_LO)
        ctx.set_source(grad)
        rrect(ctx, 0, 0, size, size, size * 0.22)
        ctx.fill()
        glyph_scale = 0.60                      # centered glyph with app-icon margins
    else:
        glyph_scale = 1.0 - 2 * margin

    # map 0..100 logical -> centered square of side size*glyph_scale
    side = size * glyph_scale
    off = (size - side) / 2.0
    ctx.translate(off, off)
    ctx.scale(side / 100.0, side / 100.0)
    draw_glyph(ctx, body, arrow, sw)

    surf.write_to_png(path)
    print("wrote", os.path.relpath(path, IMGS), f"{size}px")


def p(name):
    return os.path.join(IMGS, name)


# Action icon: monochrome white on transparent (20 / 40)
render(p("action-audio.png"),     20, WHITE, WHITE)
render(p("action-audio@2x.png"),  40, WHITE, WHITE)

# Category icon: monochrome white on transparent (28 / 56)
render(p("category.png"),         28, WHITE, WHITE)
render(p("category@2x.png"),      56, WHITE, WHITE)

# Key image (the dial tile in the app canvas): white glyph on transparent, proper key sizes (72 / 144)
render(p("key.png"),              72, WHITE, WHITE)
render(p("key@2x.png"),          144, WHITE, WHITE)

# Plugin "logo" tile: full-color sky gradient + white glyph (256 / 512)
render(p("plugin-icon.png"),     256, WHITE, WHITE, tile=True)
render(p("plugin-icon@2x.png"),  512, WHITE, WHITE, tile=True)

# LCD dial pixmap: white speaker + sky-blue arrows on transparent. Sent as a base64 data URI and
# scaled by Stream Deck into a 48px layout box on a hi-DPI touchscreen, so render BIG (288) to stay
# crisp — a small source here is what made the dial icon look blurry.
render(p("speaker.png"),         288, WHITE, SKY)

print("done ->", IMGS)
