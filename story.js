// "INUGSC, 2011 to 2027": the editions play through as you scroll.
//
// The section is pinned under the condensed header for 55svh of scrolling per edition. Each
// edition's year and lines rise into place and lift away as you scroll past them, and its panel
// on the right (a photograph from that year's conference where the archive has one, otherwise
// its theme and seal) wipes up over the previous one. Photographs drift slowly within their
// frames. Everything is scrubbed by the scroll position; nothing runs on a timer.
// Without this script, or with reduced motion, the section is a plain list of editions.
(function () {
    const section = document.querySelector(".story");
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = section.querySelector(".story_stage");
    const steps = [...section.querySelectorAll(".story_step")];
    const panels = [...section.querySelectorAll(".story_panel")];
    const rail = [...section.querySelectorAll(".story_rail li")];
    const count = steps.length;

    document.documentElement.classList.add("story_on");
    section.style.setProperty("--story-steps", String(count));
    // Load the panels' images up front once the story is in use, so none arrive late mid-wipe
    section.querySelectorAll(".story_panel img").forEach(img => img.removeAttribute("loading"));

    const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
    const ease = t => t * t * (3 - 2 * t);

    function progress() {
        const rect = section.getBoundingClientRect();
        const travel = section.offsetHeight - stage.offsetHeight;
        if (travel <= 0) return 0;
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        return clamp((top - rect.top) / travel, 0, 1);
    }

    // Where in its stretch of scrolling the next panel starts to wipe up, and finishes
    const WIPE_FROM = 0.76;
    const WIPE_TO = 1.2;

    let lastActive = -1;
    let frame = 0;
    function draw() {
        frame = 0;
        // 0 at the start of the first edition, `count` at the end of the last
        const position = progress() * count;

        steps.forEach((step, i) => {
            // Distance from this edition's centre, in editions
            const d = position - (i + 0.5);
            const pinnedEnd = (i === 0 && d < 0) || (i === count - 1 && d > 0);
            const fade = pinnedEnd ? 1 : clamp(1 - (Math.abs(d) - 0.28) / 0.2, 0, 1);
            step.style.opacity = fade.toFixed(3);
            const shift = pinnedEnd ? 0 : clamp(d, -0.5, 0.5);
            step.style.transform = `translateY(${(-shift * 5).toFixed(2)}rem)`;
            step.style.visibility = fade > 0 ? "" : "hidden";
        });

        panels.forEach((panel, i) => {
            // Panel i arrives during the end of edition i - 1's stretch
            const reveal = i === 0 ? 1 : ease(clamp((position - (i - 1) - WIPE_FROM) / (WIPE_TO - WIPE_FROM), 0, 1));
            panel.style.clipPath = reveal >= 1 ? "none" : `inset(${((1 - reveal) * 100).toFixed(2)}% 0 0 0)`;
            panel.style.visibility = reveal > 0 ? "" : "hidden";
            // Photographs drift upward through their own edition (and a little either side)
            const img = panel.querySelector(".story_panel_photo img, img.story_panel_drift");
            if (img && reveal > 0) {
                const local = clamp(position - i + 0.4, 0, 1.8) / 1.8;
                img.style.transform = `translateY(${(3 - local * 6).toFixed(2)}%) scale(${(1.04 - local * 0.03).toFixed(4)})`;
            }
        });

        const active = clamp(Math.floor(position), 0, count - 1);
        if (active !== lastActive) {
            rail.forEach((item, i) => item.classList.toggle("story_rail_active", i === active));
            lastActive = active;
        }
        section.style.setProperty("--story-progress", (position / count).toFixed(4));
    }

    function request() {
        if (!frame) frame = requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
})();
