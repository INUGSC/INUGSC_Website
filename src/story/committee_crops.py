"""Crop the committee portraits for the 2027 panel of the story, all to the same framing.

The portraits in img/people are framed a little differently, which shows when they sit side by
side. This finds each face and crops a square in which the face is the same width (30% of the
square) and its centre at the same height (42% from the top), so every tile matches and
object-position 50% 42% keeps them matched in tiles of any shape.

    python3 src/story/committee_crops.py <haar dir> img/people img/story/committee laith-ali abigail-clegg ...

<haar dir> holds haarcascade_frontalface_alt2.xml, from cv2/data in the opencv-python 4 wheel
(version 5 no longer ships it). Needs OpenCV, and Pillow with AVIF support. Check the crops by
eye afterwards: a missed or wrong face is reported, and that photo is left out.
"""
import os
import sys

import cv2
from PIL import Image

haar, src, out, *names = sys.argv[1:]
SIZE = 480
RATIO = 0.30        # face width as a share of the square
CY = 0.42           # face centre, from the top of the square

face = cv2.CascadeClassifier(os.path.join(haar, "haarcascade_frontalface_alt2.xml"))
os.makedirs(out, exist_ok=True)

for name in names:
    path = os.path.join(src, f"{name}.jpg")
    grey = cv2.equalizeHist(cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2GRAY))
    found = face.detectMultiScale(grey, scaleFactor=1.05, minNeighbors=6, minSize=(90, 90))
    if len(found) == 0:
        print(name, "no face found, left out")
        continue
    x, y, w, h = max(found, key=lambda b: b[2] * b[3])

    im = Image.open(path).convert("RGB")
    side = min(w / RATIO, *im.size)
    cx, cy = x + w / 2, y + h / 2
    # Keep the square inside the photo, shifting it rather than padding
    left = min(max(cx - side / 2, 0), im.width - side)
    top = min(max(cy - CY * side, 0), im.height - side)
    crop = im.crop((round(left), round(top), round(left + side), round(top + side)))
    crop = crop.resize((SIZE, SIZE), Image.LANCZOS)
    dest = os.path.join(out, f"{name}.avif")
    crop.save(dest, "AVIF", quality=58, speed=4)
    print(name, f"face {w}px", os.path.getsize(dest))
