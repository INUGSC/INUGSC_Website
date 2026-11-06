"""Make the fly-in's videos and stills from the Google Earth Studio renders.

1. Render the two Earth Studio projects on the INUGSC Google account ("INUGSC 2027 fly-in" and
   "INUGSC 2027 fly-in portrait v2") as cloud videos and download them.
2. python3 src/flyin/encode.py "INUGSC 2027 fly-in v3.mp4" "INUGSC 2027 fly-in portrait v2.mp4" img/flyin

This writes wide.mp4 (1600 by 900) and tall.mp4 (810 by 1440), which flyin.js plays, and the
stills: d_start and m_start (the first frame, shown until the video can play) and d_end and
m_end (the last frame, the section's picture without the script). Needs ffmpeg, and Pillow with
AVIF support.
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image

land, port, out = sys.argv[1:4]

SETS = [
    ("wide", "d", land, (1600, 900)),
    ("tall", "m", port, (810, 1440)),
]


def run(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


for name, prefix, source, (w, h) in SETS:
    video = os.path.join(out, f"{name}.mp4")
    # A keyframe every second, so the video can start again quickly when it replays
    run("-i", source, "-an", "-vf", f"scale={w}:{h}:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "29", "-profile:v", "high",
        "-g", "30", "-movflags", "+faststart", video)

    with tempfile.TemporaryDirectory() as tmp:
        first = os.path.join(tmp, "first.png")
        last = os.path.join(tmp, "last.png")
        run("-i", source, "-vf", f"scale={w}:{h}:flags=lanczos", "-frames:v", "1", first)
        # Earth Studio renders 251 frames, 0 to 250
        run("-i", source, "-vf", f"select=eq(n\\,250),scale={w}:{h}:flags=lanczos", "-frames:v", "1", last)

        im = Image.open(first).convert("RGB")
        im.save(os.path.join(out, f"{prefix}_start.jpg"), "JPEG", quality=78, optimize=True, progressive=True)

        im = Image.open(last).convert("RGB")
        im.save(os.path.join(out, f"{prefix}_end.avif"), "AVIF", quality=55, speed=4, subsampling="4:2:0")
        im.save(os.path.join(out, f"{prefix}_end.jpg"), "JPEG", quality=80, optimize=True, progressive=True)

    print(name, os.path.getsize(video))
