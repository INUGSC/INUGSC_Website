/* INUGSC 2027 home page: a scroll-driven flight from space down to UCL East.

   The frames come from two Google Earth Studio projects on the INUGSC Google account, "INUGSC 2027
   fly-in" (1920 by 1080) and "INUGSC 2027 fly-in portrait v2" (1080 by 1920), rendered as
   videos and cut into stills by src/flyin/encode.py. Google requires its attribution, which
   is part of every frame, to stay legible while the footage shows, so the drawing below never
   lets it leave the stage or sit under the opening actions.

   Without this script (or with reduced motion, Save-Data or no AVIF) the first view is a
   still: the poster in index.html. */
(function () {
    "use strict";

    const section = document.querySelector(".first_view");
    const stage = section && section.querySelector(".first_view_stage");
    const canvas = stage && stage.querySelector(".flyin_canvas");
    if (!canvas || !window.fetch || !window.createImageBitmap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (navigator.connection && navigator.connection.saveData) return;

    const range = (from, to, step) => {
        const list = [];
        for (let i = from; i <= to; i += step) list.push(i);
        return list;
    };
    const unique = list => [...new Set(list)].sort((a, b) => a - b);
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, v) => {
        const t = clamp((v - a) / (b - a), 0, 1);
        return t * t * (3 - 2 * t);
    };

    const LAST = 250;

    // Two sets of frames: wide for most screens, tall for phones. Where the camera moves fast,
    // more frames are kept; where it barely moves, fewer. "align" matches the poster's
    // object-position in site.css, so the canvas takes over without a jump. "attribution" is the
    // box Google's credit sits in (left, top, right, bottom as fractions of the frame), and the
    // label tracks place the building names on the last part of the flight. "keep" is how many
    // decoded frames to hold behind and ahead of the playhead, and how far away one is dropped.
    const SETS = {
        wide: {
            dir: "/img/flyin/d/",
            width: 1600,
            height: 900,
            frames: unique([...range(0, 96, 2), ...range(99, 120, 3), ...range(122, 190, 1), ...range(193, 250, 3)]),
            align: [0.8, 0.85],
            attribution: [0.65, 0.83, 0.9, 0.9],
            labels: {
                marshgate: [[190, 0.464, 0.445], [220, 0.465, 0.444], [250, 0.469, 0.442]],
                pool_street: [[190, 0.823, 0.404], [220, 0.84, 0.411], [250, 0.898, 0.428]],
            },
            keep: [3, 8, 10],
        },
        tall: {
            dir: "/img/flyin/m/",
            width: 810,
            height: 1440,
            frames: unique([...range(0, 96, 3), ...range(100, 120, 4), ...range(122, 190, 2), ...range(194, 250, 4)]),
            align: [0.5, 0.75],
            attribution: [0.08, 0.83, 0.92, 0.9],
            labels: {
                marshgate: [[190, 0.425, 0.465], [220, 0.435, 0.465], [250, 0.44, 0.465]],
            },
            keep: [2, 6, 8],
        },
    };

    // Scroll progress to frame. The descent from space is quick, the almost still moment above
    // Marshgate around frame 100 is passed over, and the swing down and the drift get the room.
    const MAP = [[0, 0], [0.03, 0], [0.36, 96], [0.42, 122], [0.77, 190], [1, LAST]];
    function frameFor(p) {
        for (let k = 1; k < MAP.length; k++) {
            if (p <= MAP[k][0]) {
                const [p0, f0] = MAP[k - 1];
                const [p1, f1] = MAP[k];
                return f0 + (f1 - f0) * (p - p0) / (p1 - p0);
            }
        }
        return LAST;
    }

    const root = document.documentElement;
    const ctx = canvas.getContext("2d", { alpha: false });
    const content = stage.querySelector(".first_view_content");
    const actions = stage.querySelector(".first_view_actions");
    const labels = [...stage.querySelectorAll(".flyin_label")];

    let kind = "";
    let set = null;
    let blobs = new Map();
    let bitmaps = new Map();
    let decoding = new Set();
    let queue = [];
    let loading = 0;
    let requested = 0;
    let eager = false;
    let drawn = false;
    let cw = 0, ch = 0, W = 0, H = 0, ratio = 1, rem = 16, actionsOffset = 0, alignX = 0.8;
    let pTarget = 0, pCurrent = 0, fTarget = 0, fCurrent = 0;
    let raf = 0;

    // ---------- Frames ----------

    function nearestIndex(f) {
        const frames = set.frames;
        let lo = 0, hi = frames.length - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (frames[mid] <= f) lo = mid; else hi = mid;
        }
        return Math.abs(frames[hi] - f) < Math.abs(frames[lo] - f) ? hi : lo;
    }

    function url(f) {
        return set.dir + String(f).padStart(3, "0") + ".avif";
    }

    // The first few frames, then coarse to fine across the whole flight, so that scrolling
    // early still finds a frame near where it is
    function priority(frames) {
        const order = [];
        const seen = new Set();
        const add = f => {
            if (!seen.has(f)) {
                seen.add(f);
                order.push(f);
            }
        };
        frames.slice(0, 6).forEach(add);
        for (const step of [16, 8, 4, 2, 1]) frames.forEach((f, i) => i % step === 0 && add(f));
        return order;
    }

    // Only the first frames load straight away. The rest follow once the visitor scrolls, or
    // once the page has finished loading and settled.
    function pump() {
        const limit = eager ? 6 : 2;
        while (loading < limit && queue.length && (eager || requested < 8)) {
            const f = queue.shift();
            if (blobs.has(f)) continue;
            const forSet = set;
            loading++;
            requested++;
            fetch(url(f))
                .then(r => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
                .then(blob => {
                    if (forSet !== set) return;
                    blobs.set(f, blob);
                    keepNear();
                })
                .catch(() => {})
                .finally(() => {
                    loading--;
                    pump();
                });
        }
    }

    function loadAll() {
        if (eager) return;
        eager = true;
        pump();
    }

    function decode(f) {
        if (bitmaps.has(f) || decoding.has(f) || !blobs.has(f)) return;
        const forSet = set;
        decoding.add(f);
        createImageBitmap(blobs.get(f)).then(
            bitmap => {
                decoding.delete(f);
                if (forSet !== set) return bitmap.close();
                bitmaps.set(f, bitmap);
                schedule();
            },
            () => decoding.delete(f)
        );
    }

    // Decoded frames are large, so only those near the playhead are kept, with more of them
    // in the direction of travel
    function keepNear() {
        const frames = set.frames;
        const [back, ahead, drop] = set.keep;
        const i = nearestIndex(fCurrent);
        const forward = fTarget >= fCurrent;
        const lo = Math.max(0, i - (forward ? back : ahead));
        const hi = Math.min(frames.length - 1, i + (forward ? ahead : back));
        for (let k = lo; k <= hi; k++) decode(frames[k]);
        for (const [f, bitmap] of bitmaps) {
            const k = nearestIndex(f);
            if (k < i - drop || k > i + drop) {
                bitmap.close();
                bitmaps.delete(f);
            }
        }
    }

    function nearestDecoded(f) {
        let best = null, distance = Infinity;
        for (const [g, bitmap] of bitmaps) {
            if (Math.abs(g - f) < distance) {
                distance = Math.abs(g - f);
                best = bitmap;
            }
        }
        return best;
    }

    // ---------- Drawing ----------

    // Cover the stage, aligned like the poster, then nudge the frame if that would put Google's
    // attribution off the visible part of the stage, or (while "hold" lasts) under the actions
    function layout(stageTop, lift, hold) {
        const s = Math.max(W / set.width, H / set.height);
        const w = set.width * s, h = set.height * s;
        let x = (W - w) * alignX;
        let y = (H - h) * set.align[1];

        const [left, top, right, bottom] = set.attribution;
        const margin = 10 * ratio;
        let floor = Math.min(H, (window.innerHeight - stageTop) * ratio) - margin;
        if (hold > 0) {
            const actionsTop = (actionsOffset - lift) * ratio - margin;
            floor = Math.min(floor, lerp(floor, actionsTop, hold));
        }
        const minX = margin - left * w;
        const maxX = W - margin - right * w;
        x = minX <= maxX ? clamp(x, minX, maxX) : (minX + maxX) / 2;
        y = Math.max(Math.min(y, floor - bottom * h), margin - top * h);
        return { x, y, w, h };
    }

    function drawFrame(box) {
        const frames = set.frames;
        const i = nearestIndex(fCurrent);
        const a = frames[i] <= fCurrent ? i : Math.max(0, i - 1);
        const b = Math.min(frames.length - 1, frames[a] < fCurrent ? a + 1 : a);
        let under = bitmaps.get(frames[a]);
        let over = b !== a ? bitmaps.get(frames[b]) : null;
        const t = b !== a ? (fCurrent - frames[a]) / (frames[b] - frames[a]) : 0;
        if (!under) {
            under = over || nearestDecoded(fCurrent);
            over = null;
        }
        if (!under) return false;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(under, box.x, box.y, box.w, box.h);
        // Between two frames, the later one fades over the earlier one
        if (over && t > 0.002) {
            ctx.globalAlpha = t;
            ctx.drawImage(over, box.x, box.y, box.w, box.h);
            ctx.globalAlpha = 1;
        }
        return true;
    }

    function placeLabels(box) {
        const reveal = smooth(196, 214, fCurrent);
        for (const el of labels) {
            const track = set.labels[el.dataset.label];
            if (!track || reveal <= 0) {
                el.style.opacity = "0";
                continue;
            }
            const f = clamp(fCurrent, track[0][0], track[track.length - 1][0]);
            let k = 1;
            while (k < track.length - 1 && track[k][0] < f) k++;
            const [f0, x0, y0] = track[k - 1];
            const [f1, x1, y1] = track[k];
            const u = (f - f0) / (f1 - f0);
            const x = (box.x + lerp(x0, x1, u) * box.w) / ratio;
            const y = (box.y + lerp(y0, y1, u) * box.h) / ratio;
            // Each label stands about 7rem tall above its point, so that much room is needed
            const inside = x > 16 && x < cw - 16 && y > 7.5 * rem && y < ch;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            el.style.opacity = inside ? String(reveal) : "0";
        }
    }

    function render() {
        // Read before writing, so the page is laid out once a frame
        const stageTop = stage.getBoundingClientRect().top;

        // The opening text lifts away as the descent begins. On tall screens the actions go
        // first, and only then does the frame let Google's attribution down past where they were.
        const away = clamp((pCurrent - 0.015) / 0.095, 0, 1);
        const shown = 1 - away;
        const tall = kind === "tall";
        const actionsShown = tall ? 1 - smooth(0, 0.5, away) : 1;
        const hold = tall && actions ? 1 - smooth(0.5, 1, away) : 0;
        const lift = 3 * rem * away;
        const box = layout(stageTop, lift, hold);

        content.style.opacity = String(shown);
        content.style.transform = away ? `translateY(${(-lift).toFixed(1)}px)` : "";
        content.style.visibility = away >= 1 ? "hidden" : "";
        if (actions) actions.style.opacity = actionsShown < 1 ? String(actionsShown) : "";
        stage.style.setProperty("--flyin-shown", shown.toFixed(3));

        if (drawFrame(box) && !drawn) {
            drawn = true;
            stage.classList.add("flyin_drawn");
        }
        placeLabels(box);
    }

    // ---------- Scroll ----------

    function progress() {
        const rect = section.getBoundingClientRect();
        // The section holds the flight plus one more screen, during which the next section
        // slides up over the still-pinned stage (see site.css)
        const travel = section.offsetHeight - 2 * stage.offsetHeight;
        if (travel <= 0) return 0;
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        return clamp((top - rect.top) / travel, 0, 1);
    }

    function tick() {
        raf = 0;
        // Ease towards the scroll position, so a flick of the wheel glides rather than jumps
        pCurrent += (pTarget - pCurrent) * 0.14;
        if (Math.abs(pTarget - pCurrent) < 0.0004) pCurrent = pTarget;
        fCurrent += (fTarget - fCurrent) * 0.16;
        if (Math.abs(fTarget - fCurrent) < 0.01) fCurrent = fTarget;
        keepNear();
        render();
        if (pCurrent !== pTarget || fCurrent !== fTarget) schedule();
    }

    function schedule() {
        if (!raf) raf = requestAnimationFrame(tick);
    }

    // The playhead always comes to rest on a whole frame, never between two
    function request() {
        pTarget = progress();
        fTarget = set.frames[nearestIndex(frameFor(pTarget))];
        schedule();
    }

    function choose(next) {
        kind = next;
        set = SETS[next];
        for (const bitmap of bitmaps.values()) bitmap.close();
        bitmaps = new Map();
        blobs = new Map();
        decoding = new Set();
        queue = priority(set.frames);
        requested = 0;
        fTarget = set.frames[nearestIndex(fTarget)];
        fCurrent = fTarget;
        pump();
    }

    // Where the actions sit in the stage, before any lift (offsets ignore transforms)
    function measure() {
        rem = parseFloat(getComputedStyle(root).fontSize) || 16;
        actionsOffset = actions ? content.offsetTop + actions.offsetTop : 0;
    }

    // From 4:3 the wide frames sit further right, clear of the text, as the poster does
    const fourThree = window.matchMedia("(min-aspect-ratio: 4/3)");

    function resize() {
        const nw = stage.clientWidth, nh = stage.clientHeight;
        measure();
        if (set) alignX = kind === "wide" && fourThree.matches ? 0.55 : set.align[0];
        // Phones resize the window as their address bar comes and goes; the stage, sized in
        // svh, does not change, so neither does the canvas
        if (nw === cw && nh === ch) return false;
        cw = nw;
        ch = nh;
        // Cap the pixels drawn, so large screens stay smooth
        ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.2e6 / (cw * ch)));
        W = Math.round(cw * ratio);
        H = Math.round(ch * ratio);
        canvas.width = W;
        canvas.height = H;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const next = cw / ch < 0.9 ? "tall" : "wide";
        if (next !== kind) choose(next);
        alignX = kind === "wide" && fourThree.matches ? 0.55 : set.align[0];
        return true;
    }

    function start() {
        const before = section.offsetHeight;
        root.classList.add("flyin_on");
        // Keep the visitor's place if the page opened part-way down, at an anchor
        if (window.scrollY > 0) window.scrollBy(0, section.offsetHeight - before);

        resize();
        pTarget = pCurrent = progress();
        fTarget = fCurrent = set.frames[nearestIndex(frameFor(pTarget))];
        keepNear();

        window.addEventListener("scroll", () => {
            loadAll();
            request();
        }, { passive: true });
        window.addEventListener("resize", () => {
            if (resize()) render();
            request();
        });
        if (document.fonts) document.fonts.ready.then(() => {
            measure();
            render();
        });
        const later = () => setTimeout(loadAll, 1500);
        if (document.readyState === "complete") later();
        else window.addEventListener("load", later, { once: true });

        // For previews: await window.flyinPreview(0.5) draws that point of the flight, and
        // flyinPreview(0.5, true) draws it between whole frames, as the page does mid-glide
        window.flyinProgress = progress;
        window.flyinPreview = async (p, between) => {
            const wait = test => new Promise(done => {
                const check = () => (test() ? done() : setTimeout(check, 20));
                check();
            });
            loadAll();
            pTarget = pCurrent = p;
            const exact = frameFor(p);
            fTarget = fCurrent = between ? exact : set.frames[nearestIndex(exact)];
            const frames = set.frames;
            const i = nearestIndex(fCurrent);
            const a = frames[i] <= fCurrent ? i : Math.max(0, i - 1);
            const needed = [frames[a], frames[Math.min(frames.length - 1, a + 1)]];
            if (!needed.every(f => blobs.has(f))) queue.unshift(...needed);
            pump();
            keepNear();
            for (const f of needed) {
                await wait(() => blobs.has(f));
                decode(f);
                await wait(() => bitmaps.has(f));
            }
            render();
        };
    }

    // A two-pixel AVIF: browsers that cannot decode it keep the still first view
    const probe = "AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAIQAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAgAAAAIAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAKW1kYXQSAAoIGAA2iAhoNCAyExlHh4Yhh5555oAAAJBAyRxhQr4=";
    const bytes = Uint8Array.from(atob(probe), c => c.charCodeAt(0));
    createImageBitmap(new Blob([bytes], { type: "image/avif" })).then(bitmap => {
        bitmap.close();
        start();
    }, () => {});
})();
