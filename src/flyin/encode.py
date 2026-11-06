"""Cut the Google Earth Studio fly-in into the stills that flyin.js plays.

1. Render the two Earth Studio projects on the INUGSC Google account ("INUGSC 2027 fly-in" and
   "INUGSC 2027 fly-in portrait v2") as cloud videos and download them.
2. Extract every frame:
       ffmpeg -i "INUGSC 2027 fly-in v3.mp4" -q:v 1 land/f%03d.jpg
       ffmpeg -i "INUGSC 2027 fly-in portrait v2.mp4" -q:v 1 port/f%03d.jpg
3. python3 src/flyin/encode.py land port img/flyin

Frame files are f001.jpg to f251.jpg (f001 is frame 0). The frame lists must match SETS in
flyin.js. Needs Pillow with AVIF support.
"""
import sys, os
from multiprocessing import Pool
from PIL import Image

land_dir, port_dir, out = sys.argv[1:4]

DESKTOP = sorted(set(range(0, 97, 2)) | set(range(99, 121, 3)) | set(range(122, 191)) | set(range(193, 251, 3)) | {250})
MOBILE = sorted(set(range(0, 97, 3)) | set(range(100, 121, 4)) | set(range(122, 191, 2)) | set(range(194, 251, 4)) | {250})

def src(d, i):
    return os.path.join(d, f"f{i + 1:03d}.jpg")

def frame_job(args):
    kind, i = args
    d, size, sub = (land_dir, (1600, 900), "d") if kind == "d" else (port_dir, (810, 1440), "m")
    im = Image.open(src(d, i)).convert("RGB").resize(size, Image.LANCZOS)
    path = os.path.join(out, sub, f"{i:03d}.avif")
    im.save(path, "AVIF", quality=35, speed=5, subsampling="4:2:0")
    return path, os.path.getsize(path)

def poster_job(args):
    name, d, i, size, q = args
    im = Image.open(src(d, i)).convert("RGB").resize(size, Image.LANCZOS)
    a = os.path.join(out, f"{name}.avif")
    j = os.path.join(out, f"{name}.jpg")
    im.save(a, "AVIF", quality=q, speed=4, subsampling="4:2:0")
    im.save(j, "JPEG", quality=80, optimize=True, progressive=True)
    return a, os.path.getsize(a) + os.path.getsize(j)

if __name__ == "__main__":
    os.makedirs(os.path.join(out, "d"), exist_ok=True)
    os.makedirs(os.path.join(out, "m"), exist_ok=True)
    jobs = [("d", i) for i in DESKTOP] + [("m", i) for i in MOBILE]
    # The posters are the last frame: the section's still without the script
    posters = [
        ("d_end", land_dir, 250, (1920, 1080), 50),
        ("m_end", port_dir, 250, (1080, 1920), 50),
    ]
    with Pool(2) as pool:
        sizes = pool.map(frame_job, jobs, chunksize=4)
        psizes = pool.map(poster_job, posters)
    dtot = sum(s for p, s in sizes if "/d/" in p)
    mtot = sum(s for p, s in sizes if "/m/" in p)
    print(f"desktop {len(DESKTOP)} frames {dtot/1e6:.2f} MB, mobile {len(MOBILE)} frames {mtot/1e6:.2f} MB")
    print("posters", [(os.path.basename(p), round(s / 1024)) for p, s in psizes])
