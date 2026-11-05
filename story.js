// "INUGSC, 2011 to 2027": the editions play through as you scroll.
//
// The section is pinned under the condensed header for one screen per edition. Each edition's
// year, line and seal rise into place and lift away as you scroll past it, while the photographs
// on the right cross-fade. Everything is scrubbed by the scroll position; nothing runs on a timer.
// Without this script, or with reduced motion, the section is a plain list of editions.
(function () {
    const section = document.querySelector(".story");
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = section.querySelector(".story_stage");
    const steps = [...section.querySelectorAll(".story_step")];
    const photos = [...section.querySelectorAll(".story_photo")];
    const rail = [...section.querySelectorAll(".story_rail li")];
    const count = steps.length;

    document.documentElement.classList.add("story_on");
    section.style.setProperty("--story-steps", String(count));
    // The photographs are only lazy-loaded until the story is near
    photos.forEach(photo => photo.removeAttribute("loading"));

    const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

    function progress() {
        const rect = section.getBoundingClientRect();
        const travel = section.offsetHeight - stage.offsetHeight;
        if (travel <= 0) return 0;
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        return clamp((top - rect.top) / travel, 0, 1);
    }

    let lastActive = -1;
    function draw() {
        frame = 0;
        // 0 at the start of the first edition, `count` at the end of the last
        const position = progress() * count;

        steps.forEach((step, i) => {
            // Distance from this edition's centre, in editions
            const d = position - (i + 0.5);
            // Fully shown in the middle of its stretch; the first and last stay at the ends
            const fade = (i === 0 && d < 0) || (i === count - 1 && d > 0)
                ? 1
                : clamp(1 - (Math.abs(d) - 0.28) / 0.2, 0, 1);
            step.style.opacity = fade.toFixed(3);
            const shift = (i === 0 && d < 0) || (i === count - 1 && d > 0) ? 0 : clamp(d, -0.5, 0.5);
            step.style.transform = `translateY(${(-shift * 5).toFixed(2)}rem)`;
            step.style.visibility = fade > 0 ? "" : "hidden";
        });

        // Each photograph shows for the editions that name it, cross-fading at the joins
        const active = clamp(Math.floor(position), 0, count - 1);
        const within = clamp(position - active, 0, 1);
        const photoNow = Number(steps[active].dataset.photo);
        const next = steps[Math.min(active + 1, count - 1)];
        const photoNext = Number(next.dataset.photo);
        const blend = photoNext !== photoNow ? clamp((within - 0.72) / 0.28, 0, 1) : 0;
        photos.forEach((photo, k) => {
            let shown = 0;
            if (k === photoNow) shown = 1 - blend;
            if (k === photoNext && photoNext !== photoNow) shown = blend;
            photo.style.opacity = shown.toFixed(3);
            // A slow drift within the frame, as in the other split sections
            photo.style.transform = `scale(1.08) translateY(${((position / count) * 4 - 2).toFixed(2)}%)`;
        });

        if (active !== lastActive) {
            rail.forEach((item, i) => item.classList.toggle("story_rail_active", i === active));
            lastActive = active;
        }
        section.style.setProperty("--story-progress", (position / count).toFixed(4));
    }

    let frame = 0;
    function request() {
        if (!frame) frame = requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
})();
