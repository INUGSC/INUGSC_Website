/* INUGSC 2027 home page, the venue: a flight from space down to UCL East.

   The video comes from two Google Earth Studio projects on the INUGSC Google account, "INUGSC
   2027 fly-in" (1920 by 1080) and "INUGSC 2027 fly-in portrait v2" (1080 by 1920), encoded by
   src/flyin/encode.py. Once About has slid up off the pinned stage, the flight plays by itself,
   at its own pace, and the page is held until it has finished, so that it is not skipped by
   accident; scrolling on three times skips it, and scrolling up lets go. Google requires its
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

    // The flight starts once About has gone and the whole stage is on view, after a moment to
    // read the heading. Coming back up from Date and venue, the last frame is shown once this
    // much of the stage is uncovered.
    const PAUSE = 900;
    const START_AT = 0.6;

    // While it plays, the page is held: a flick on a phone, or a few turns of a wheel, would
    // otherwise carry a visitor straight past it. The page is let go when the flight ends, at
    // once on scrolling back up, or after this many separate attempts to scroll on.
    const SKIP_AFTER = 3;
    // Scroll events closer together than this belong to one attempt: a turn of the wheel, or a
    // flick on a trackpad and its glide. Spinning the wheel without a pause also counts as
    // another attempt for every this many pixels it would have scrolled.
    const BURST = 350;
    const PUSH = 700;

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
    let reveal = 0;              // how far the section reaches up under About
    let holding = false, holdAt = 0, holdTimer = 0, attempts = 0, burstEnd = 0, pushed = 0, arriving = false;
    let touchY = null, touchCounted = false;
    let navUntil = 0;            // following a link to further down the page: no hold

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
        letGo();
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
        letGo();
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
        };
    }

    // The scroll position at which About has gone and the whole stage is on view, and how far
    // the stage then stays before Date and venue starts to slide over it
    function holdRange() {
        const pinnedAt = parseFloat(getComputedStyle(stage).top) || 0;
        const start = section.getBoundingClientRect().top + window.scrollY - pinnedAt + reveal;
        const stretch = Math.max(0, section.offsetHeight - 2 * stage.offsetHeight - reveal);
        return { start, stretch };
    }

    function check() {
        if (state === "still" || holding) return;
        const y = window.scrollY;
        const down = y > lastY;
        lastY = y;
        const { shown, fromBelow } = uncovered();
        const { start, stretch } = holdRange();
        if (state === "idle") {
            if (fromBelow && !down && shown >= START_AT) {
                showEnd();
            } else if (down && y >= start - 1 && y < start + stretch + 0.8 * stage.offsetHeight && performance.now() > navUntil) {
                // Hold the page here, bringing it back if a fling has carried it on, give the
                // heading a moment, then fly
                state = "waiting";
                hold(clamp(y, start, start + stretch / 2));
                timer = setTimeout(play, PAUSE);
            }
        } else if (state === "waiting" && y < start - 1) {
            clearTimeout(timer);
            timer = 0;
            state = "idle";
        } else if ((state === "playing" || state === "done") && shown < 0.25 && !fromBelow) {
            // About is back over most of the stage: ready to fly again next time
            reset();
        }
    }

    // ---------- Holding the page while it plays ----------

    const hint = document.createElement("p");
    hint.className = "flyin_hint";
    hint.textContent = "Keep scrolling to skip";
    hint.setAttribute("aria-hidden", "true");
    stage.appendChild(hint);

    const DOWN_KEYS = new Set([" ", "PageDown", "ArrowDown", "End"]);
    const UP_KEYS = new Set(["PageUp", "ArrowUp", "Home"]);

    function hold(at) {
        holding = true;
        holdAt = at;
        attempts = 0;
        burstEnd = performance.now();    // the scroll that brought them here is not an attempt,
        arriving = true;                 // however long the wheel keeps spinning
        pushed = 0;
        touchCounted = true;             // nor is a swipe still under way
        if (Math.abs(window.scrollY - at) > 1) window.scrollTo({ top: at, behavior: "instant" });
        lastY = at;
        root.classList.add("flyin_hold");
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("keydown", onKey);
        document.addEventListener("focusin", onFocus);
        // Should the video not have started within a few seconds (a slow connection), let go
        clearTimeout(holdTimer);
        holdTimer = setTimeout(letGo, PAUSE + 3000);
    }

    function letGo() {
        if (!holding) return;
        holding = false;
        clearTimeout(holdTimer);
        root.classList.remove("flyin_hold");
        stage.classList.remove("flyin_hinted");
        window.removeEventListener("wheel", onWheel, { passive: false });
        window.removeEventListener("touchstart", onTouchStart, { passive: true });
        window.removeEventListener("touchmove", onTouchMove, { passive: false });
        window.removeEventListener("keydown", onKey);
        document.removeEventListener("focusin", onFocus);
        lastY = window.scrollY;
    }

    // An attempt to scroll on: the first brings up the hint, and enough of them skip the rest
    function attempt() {
        attempts++;
        stage.classList.add("flyin_hinted");
        if (attempts >= SKIP_AFTER) letGo();
    }

    // Scrolling that is part of one attempt does not count again
    function burst(now, delta = 0) {
        const fresh = now - burstEnd > BURST;
        burstEnd = now;
        // Until the scroll that brought them here pauses, nothing counts
        if (arriving && !fresh) return;
        arriving = false;
        pushed += delta;
        if (fresh || pushed >= PUSH) {
            pushed = 0;
            attempt();
        }
    }

    function onWheel(e) {
        if (e.ctrlKey || !e.deltaY) return;      // pinching to zoom, or sideways
        if (e.deltaY < 0) return letGo();        // back up
        e.preventDefault();
        // deltaMode 1 counts lines and 2 pages, rather than pixels
        burst(e.timeStamp, e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1));
    }

    function onTouchStart(e) {
        // The swipe that skips must move the page itself, so let go before it begins: a page
        // cannot start scrolling part-way through a swipe
        if (attempts >= SKIP_AFTER - 1) return letGo();
        touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
        touchCounted = false;
    }

    function onTouchMove(e) {
        if (touchY === null || e.touches.length !== 1) return;   // pinching to zoom
        const dy = e.touches[0].clientY - touchY;
        if (dy > 12) return letGo();             // pulling the page down, back up
        e.preventDefault();
        if (!touchCounted && dy < -12) {
            touchCounted = true;
            attempt();
        }
    }

    function onKey(e) {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (UP_KEYS.has(e.key) || (e.key === " " && e.shiftKey)) return letGo();
        if (!DOWN_KEYS.has(e.key)) return;
        e.preventDefault();
        if (!e.repeat) attempt();
    }

    // Moving the keyboard focus out of the venue lets go
    function onFocus(e) {
        if (!stage.contains(e.target)) letGo();
    }

    // Anything else that moves the page while it is held (the scroll bar, or a fling already
    // under way on a phone) is put back, and counts as an attempt; moving it up lets go
    function holdStill() {
        const y = window.scrollY;
        if (y < holdAt - 2) letGo();
        else if (y > holdAt + 2) {
            window.scrollTo({ top: holdAt, behavior: "instant" });
            burst(performance.now());
        }
    }

    // ---------- Size ----------

    const fourThree = window.matchMedia("(min-aspect-ratio: 4/3)");

    function measure() {
        rem = parseFloat(getComputedStyle(root).fontSize) || 16;
        reveal = Math.max(0, -parseFloat(getComputedStyle(section).marginTop) || 0);
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
            // Let go when it ends, and at the latest a little after
            if (holding) {
                clearTimeout(holdTimer);
                holdTimer = setTimeout(letGo, ((video.duration || LAST / FPS) - video.currentTime) * 1000 + 1500);
            }
        });
        video.addEventListener("ended", () => {
            state = "done";
            placeLabels(LAST);
            // A moment on the finished view, with the buildings named, then the page moves on
            if (holding) {
                clearTimeout(holdTimer);
                holdTimer = setTimeout(letGo, 500);
            }
        });
        video.addEventListener("error", still);

        // Following a link on the page scrolls past the venue without stopping, and lets go
        document.addEventListener("click", e => {
            const link = e.target.closest && e.target.closest("a[href]");
            if (!link) return;
            letGo();
            if (link.hash && link.pathname === location.pathname) navUntil = performance.now() + 2500;
        }, true);

        let pending = 0;
        window.addEventListener("scroll", () => {
            if (holding) return holdStill();
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
        window.flyinState = () => (holding ? `${state}, held` : state);
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
