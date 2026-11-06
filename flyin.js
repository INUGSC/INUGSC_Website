/* INUGSC 2027 home page, the venue: a flight from space down to UCL East.

   The video comes from two Google Earth Studio projects on the INUGSC Google account, "INUGSC
   2027 fly-in" (1920 by 1080) and "INUGSC 2027 fly-in portrait v2" (1080 by 1920), encoded by
   src/flyin/encode.py. Once About has slid up off the pinned stage, the flight plays by itself,
   at its own pace, while the page carries on scrolling freely. Google requires its
   attribution, which is part of every frame, to stay legible while the footage shows, so the
   video is placed so that it never leaves the stage.

   Without this script (or with reduced motion, Save-Data, no MP4 support, or when the browser
   will not play it, as in Low Power Mode on iPhones) the section is a still of the flight's
   last frame: the poster in index.html. */
(function () {
    "use strict";

    const section = document.querySelector(".flyin");
    const stage = section && section.querySelector(".flyin_stage");
    const video = stage && stage.querySelector(".flyin_video");
    if (!video || !video.canPlayType || !video.canPlayType('video/mp4; codecs="avc1.640028"')) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (navigator.connection && navigator.connection.saveData) return;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, v) => {
        const t = clamp((v - a) / (b - a), 0, 1);
        return t * t * (3 - 2 * t);
    };

    const FPS = 30;
    const LAST = 250;

    // The flight starts once most of the stage and all of the heading are uncovered (on phones
    // the heading is at the top, so it is uncovered last), after a moment to read the heading
    const START_AT = 0.6;
    const PAUSE = 900;

    // Two videos: wide for most screens, tall for phones. "align" matches the poster's
    // object-position in site.css. "attribution" is the box Google's credit sits in (left, top,
    // right, bottom as fractions of the frame), and the label tracks place the building names
    // on the last part of the flight, by frame.
    const SETS = {
        wide: {
            src: "/img/flyin/wide.mp4",
            poster: "/img/flyin/d_start.jpg",
            width: 1600,
            height: 900,
            align: [0.8, 0.85],
            attribution: [0.65, 0.83, 0.9, 0.9],
            labels: {
                marshgate: [[190, 0.464, 0.445], [220, 0.465, 0.444], [250, 0.469, 0.442]],
                pool_street: [[190, 0.823, 0.404], [220, 0.84, 0.411], [250, 0.898, 0.428]],
            },
        },
        tall: {
            src: "/img/flyin/tall.mp4",
            poster: "/img/flyin/m_start.jpg",
            width: 810,
            height: 1440,
            align: [0.5, 0.75],
            attribution: [0.08, 0.83, 0.92, 0.9],
            labels: {
                marshgate: [[190, 0.425, 0.465], [220, 0.435, 0.465], [250, 0.44, 0.465]],
            },
        },
    };

    const root = document.documentElement;
    const labels = [...stage.querySelectorAll(".flyin_label")];
    const content = stage.querySelector(".flyin_content");
    const before = section.previousElementSibling;
    const after = section.nextElementSibling;

    let kind = "";
    let set = null;
    let wanted = false;          // close enough to start loading
    let cw = 0, ch = 0, rem = 16, alignX = 0.8;
    let box = { x: 0, y: 0, w: 0, h: 0 };
    // idle: at the first frame, heading shown; waiting: about to play; playing; done: on the
    // last frame; still: the browser would not play it, so the poster stays
    let state = "idle";
    let timer = 0;
    let raf = 0;
    let lastY = window.scrollY;

    // ---------- Placing the video ----------

    // Cover the stage, aligned like the poster, then nudge the frame if that would put Google's
    // attribution off the visible part of the stage
    function layout() {
        const s = Math.max(cw / set.width, ch / set.height);
        const w = set.width * s, h = set.height * s;
        let x = (cw - w) * alignX;
        let y = (ch - h) * set.align[1];

        const [left, top, right, bottom] = set.attribution;
        const margin = 10;
        const pinnedAt = parseFloat(getComputedStyle(stage).top) || 0;
        const floor = Math.min(ch, window.innerHeight - pinnedAt) - margin;
        const minX = margin - left * w;
        const maxX = cw - margin - right * w;
        x = minX <= maxX ? clamp(x, minX, maxX) : (minX + maxX) / 2;
        y = Math.max(Math.min(y, floor - bottom * h), margin - top * h);
        box = { x, y, w, h };

        video.style.width = `${w.toFixed(1)}px`;
        video.style.height = `${h.toFixed(1)}px`;
        video.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }

    function placeLabels(frame) {
        const reveal = smooth(196, 214, frame);
        for (const el of labels) {
            const track = set.labels[el.dataset.label];
            if (!track || reveal <= 0) {
                el.style.opacity = "0";
                continue;
            }
            const f = clamp(frame, track[0][0], track[track.length - 1][0]);
            let k = 1;
            while (k < track.length - 1 && track[k][0] < f) k++;
            const [f0, x0, y0] = track[k - 1];
            const [f1, x1, y1] = track[k];
            const u = (f - f0) / (f1 - f0);
            const x = box.x + lerp(x0, x1, u) * box.w;
            const y = box.y + lerp(y0, y1, u) * box.h;
            // Each label stands about 7rem tall above its point, so that much room is needed
            const inside = x > 16 && x < cw - 16 && y > 7.5 * rem && y < ch;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            el.style.opacity = inside ? String(reveal) : "0";
        }
    }

    const frameNow = () => (state === "idle" || state === "waiting" ? 0 : clamp(video.currentTime * FPS, 0, LAST));

    // While the video plays, the labels follow the buildings
    function follow() {
        raf = 0;
        placeLabels(frameNow());
        if (!video.paused && !video.ended) raf = requestAnimationFrame(follow);
    }

    // ---------- Loading ----------

    function load() {
        wanted = true;
        const time = video.currentTime;
        const poster = new Image();
        poster.onload = () => {
            if (state === "still") return;
            video.poster = set.poster;
            stage.classList.add("flyin_drawn");
        };
        poster.src = set.poster;
        video.src = set.src;
        video.preload = "auto";
        video.load();
        if (time > 0) video.addEventListener("loadedmetadata", () => { video.currentTime = time; }, { once: true });
        // Turning a tablet mid-flight swaps the video; carry on from the same moment
        if (state === "playing") video.addEventListener("loadeddata", () => {
            const resumed = video.play();
            if (resumed && resumed.catch) resumed.catch(still);
        }, { once: true });
    }

    function choose(next) {
        kind = next;
        set = SETS[next];
        if (wanted) load();
    }

    // ---------- Playing ----------

    function play() {
        timer = 0;
        state = "playing";
        if (window.flyinManual) {                    // previews step through it themselves
            stage.classList.add("flyin_playing");
            return;
        }
        const started = video.play();
        if (started && started.catch) started.catch(still);
    }

    // The browser would not play it: fall back to the still of the last frame, as without the script
    function still() {
        state = "still";
        clearTimeout(timer);
        stage.classList.remove("flyin_drawn", "flyin_playing");
        for (const el of labels) el.style.opacity = "0";
    }

    // Arriving from below, the flight is shown as it ends rather than played backwards into
    function showEnd() {
        state = "done";
        stage.classList.add("flyin_playing");
        const seek = () => {
            video.currentTime = video.duration || LAST / FPS;
            placeLabels(LAST);
        };
        if (video.readyState >= 1) seek();
        else video.addEventListener("loadedmetadata", seek, { once: true });
    }

    function reset() {
        clearTimeout(timer);
        timer = 0;
        state = "idle";
        video.pause();
        if (video.readyState >= 1) video.currentTime = 0;
        stage.classList.remove("flyin_playing");
        placeLabels(0);
    }

    // How much of the stage is on view, between About above it and Date and venue below it
    function uncovered() {
        const r = stage.getBoundingClientRect();
        const top = Math.max(r.top, before ? before.getBoundingClientRect().bottom : r.top);
        const bottom = Math.min(r.bottom, after ? after.getBoundingClientRect().top : r.bottom, window.innerHeight);
        return {
            shown: Math.max(0, bottom - top) / r.height,
            fromBelow: after && after.getBoundingClientRect().top < r.bottom - 1,
            ready: top <= content.getBoundingClientRect().top + 1,
        };
    }

    function check() {
        if (state === "still") return;
        const { shown, fromBelow, ready } = uncovered();
        const up = window.scrollY < lastY;
        lastY = window.scrollY;
        if (state === "idle" && shown >= START_AT && (ready || fromBelow)) {
            if (fromBelow || up) showEnd();
            else {
                state = "waiting";
                timer = setTimeout(play, PAUSE);
            }
        } else if (state === "waiting" && (shown < START_AT || !ready)) {
            clearTimeout(timer);
            timer = 0;
            state = "idle";
        } else if ((state === "playing" || state === "done") && shown === 0 && !fromBelow) {
            // About is back over the whole stage: ready to fly again next time
            reset();
        }
    }

    // ---------- Size ----------

    const fourThree = window.matchMedia("(min-aspect-ratio: 4/3)");

    function measure() {
        rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    }

    function resize() {
        measure();
        const nw = stage.clientWidth, nh = stage.clientHeight;
        // Phones resize the window as their address bar comes and goes; the stage, sized in
        // svh, does not change, so neither does the video
        if (nw === cw && nh === ch) return;
        cw = nw;
        ch = nh;
        const next = cw / ch < 0.9 ? "tall" : "wide";
        if (next !== kind) choose(next);
        alignX = kind === "wide" && fourThree.matches ? 0.55 : set.align[0];
        layout();
        placeLabels(frameNow());
    }

    function start() {
        // Keep the visitor's place if the page opened part-way down, at an anchor: the
        // section grows, so whatever was at the top of the window is put back there
        const ref = [...document.querySelectorAll("main > section")].find(el => el.getBoundingClientRect().bottom > 0);
        const refTop = ref ? ref.getBoundingClientRect().top : 0;
        root.classList.add("flyin_on");
        if (ref && window.scrollY > 0) window.scrollBy(0, ref.getBoundingClientRect().top - refTop);
        lastY = window.scrollY;

        resize();

        video.addEventListener("playing", () => {
            stage.classList.add("flyin_playing");
            if (!raf) raf = requestAnimationFrame(follow);
        });
        video.addEventListener("ended", () => {
            state = "done";
            placeLabels(LAST);
        });
        video.addEventListener("error", still);

        let pending = 0;
        window.addEventListener("scroll", () => {
            if (!pending) pending = requestAnimationFrame(() => {
                pending = 0;
                check();
            });
        }, { passive: true });
        window.addEventListener("resize", resize);
        if (document.fonts) document.fonts.ready.then(measure);

        // Start loading when the section is a screen and a half away
        if ("IntersectionObserver" in window) {
            const watch = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    watch.disconnect();
                    load();
                }
            }, { rootMargin: "150% 0px" });
            watch.observe(section);
        } else {
            load();
        }
        check();

        // For previews: with window.flyinManual set, the flight does not play by itself, and
        // await window.flyinPreview(seconds) shows that moment of it
        window.flyinState = () => state;
        window.flyinDuration = () => video.duration || LAST / FPS;
        window.flyinPreview = async seconds => {
            if (!wanted) load();
            if (video.readyState < 1) await new Promise(done => video.addEventListener("loadedmetadata", done, { once: true }));
            video.pause();
            const t = clamp(seconds, 0, video.duration);
            if (Math.abs(video.currentTime - t) > 0.001) {
                const seeked = new Promise(done => video.addEventListener("seeked", done, { once: true }));
                video.currentTime = t;
                await seeked;
            }
            if (t >= video.duration - 0.05) state = "done";
            if (video.readyState < 2) await new Promise(done => video.addEventListener("loadeddata", done, { once: true }));
            placeLabels(frameNow());
        };
    }

    start();
})();
