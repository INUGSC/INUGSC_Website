// INUGSC site behaviour, used by every page.

// Motion is on unless the visitor asked for less. The style sheet keys its soft arrivals and its pinned
// testimonial scene on this class, so with reduced motion, or with no script at all, the page just sits still.
if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    document.documentElement.classList.add("motion");
}

// Soft arrivals: a block marked .reveal glides in once, shortly after it comes into view. Scrolling only
// decides when; the style sheet's eased transition decides how, so it looks the same at any scroll speed.
(function () {
    if (!document.documentElement.classList.contains("motion")) return;

    let line = 0.88;    // a block arrives once its top is this far down the window
    let queued = false;

    function sweep() {
        queued = false;
        let height = window.innerHeight;
        let order = 0;
        document.querySelectorAll(".reveal:not(.is_in)").forEach(block => {
            let box = block.getBoundingClientRect();
            if (box.top >= height * line) return;
            if (box.bottom < 0) {
                // scrolled past without ever being seen: it is simply there
                block.classList.add("is_seen");
            } else {
                // blocks that arrive in the same moment come a beat apart, not all at once
                block.style.setProperty("--delay", Math.min(order++, 4) * 0.12 + "s");
            }
            block.classList.add("is_in");
        });
    }

    function ask() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(sweep);
    }

    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    window.addEventListener("load", ask);
    // some blocks (the committee grid, for one) are built by other scripts after this one has run
    new MutationObserver(ask).observe(document.body, { childList: true, subtree: true });
    ask();
})();

// The testimonials are a pinned scene (see the style sheet). Scrolling only chooses which answer is
// current; the change itself plays out in time. The answers change a quarter and a half of the way
// along the pinned stretch, and the first is current from a little before the band pins.
(function () {
    let band = document.querySelector(".voices");
    let stage = band && band.querySelector(".voices_stage");
    let quotes = band ? [...band.querySelectorAll(".quote")] : [];
    if (!stage || !quotes.length || !document.documentElement.classList.contains("motion")) return;

    let current = -1;
    let queued = false;

    function update() {
        queued = false;
        if (getComputedStyle(stage).position != "sticky") return;
        let travel = band.offsetHeight - window.innerHeight;
        if (travel <= 0) return;
        let progress = -band.getBoundingClientRect().top / travel;    // 0 as the band pins, 1 as it lets go
        let step = progress < -0.25 ? 0 : progress < 0.25 ? 1 : progress < 0.5 ? 2 : 3;
        if (step == current) return;
        current = step;
        quotes.forEach((quote, i) => {
            quote.classList.toggle("is_current", i == step - 1);
            quote.classList.toggle("is_past", i < step - 1);
        });
    }

    function ask() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
    }

    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    window.addEventListener("load", ask);
    ask();
})();

// Phone menu: open and close it, and close it again once a link is chosen.
(function () {
    let header = document.querySelector(".site_header");
    let button = document.querySelector(".site_menu_button");
    if (!header || !button) return;

    function setOpen(open) {
        header.classList.toggle("menu_open", open);
        button.setAttribute("aria-expanded", String(open));
    }

    button.addEventListener("click", () => {
        setOpen(!header.classList.contains("menu_open"));
    });

    header.querySelectorAll(".site_nav a").forEach(link => {
        link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", event => {
        if (event.key == "Escape" && header.classList.contains("menu_open")) {
            setOpen(false);
            button.focus();
        }
    });
})();

// Delegate map: point at a lit country to name it. The nearest lit country to the
// pointer wins, so small neighbours (the UK and Belgium, Italy and Malta) stay easy
// to tell apart. On a phone, tap near a country; tap anywhere else to clear the label.
(function () {
    let map = document.querySelector(".delegates_map");
    let svg = map && map.querySelector("svg.dotmap");
    if (!svg) return;

    let label = document.createElement("p");
    label.className = "map_label";
    label.setAttribute("aria-hidden", "true");   // the paragraph above already lists every country
    map.appendChild(label);

    // every dot of every lit country, in map units
    let points = [];
    svg.querySelectorAll("g.dotmap_country").forEach(country => {
        let dots = country.querySelector("path.dotmap_hl");
        if (!dots) return;
        for (let m of dots.getAttribute("d").matchAll(/M([\d.]+) ([\d.]+)/g)) {
            points.push({ x: +m[1], y: +m[2], country });
        }
    });

    let active = null;
    let view = svg.viewBox.baseVal;            // the map's frame starts at view.x, view.y in map units

    function scale() {
        return svg.getBoundingClientRect().width / view.width;
    }

    // the lit country nearest to a point on screen, if one is within reach (in pixels)
    function nearest(clientX, clientY, reach) {
        let box = svg.getBoundingClientRect(), s = scale();
        let x = view.x + (clientX - box.left) / s, y = view.y + (clientY - box.top) / s;
        let best = null, bestDistance = reach / s;
        for (let point of points) {
            let distance = Math.hypot(point.x - x, point.y - y);
            if (distance < bestDistance) {
                best = point.country;
                bestDistance = distance;
            }
        }
        return best;
    }

    function show(country) {
        if (country == active) return;
        if (active) active.classList.remove("is_active");
        active = country;
        country.classList.add("is_active");

        // the label sits just above the country, at a point stored on it in map units
        let box = svg.getBoundingClientRect(), base = map.getBoundingClientRect(), s = scale();
        label.textContent = country.dataset.name;
        label.style.left = (box.left - base.left + (country.dataset.x - view.x) * s) + "px";
        label.style.top = (box.top - base.top + (country.dataset.y - view.y) * s) + "px";
        label.classList.add("is_visible");
    }

    function hide() {
        if (active) active.classList.remove("is_active");
        active = null;
        label.classList.remove("is_visible");
    }

    svg.addEventListener("pointermove", event => {
        if (event.pointerType == "touch") return;
        let country = nearest(event.clientX, event.clientY, 14);
        country ? show(country) : hide();
    });

    svg.addEventListener("pointerleave", event => {
        if (event.pointerType != "touch") hide();
    });

    svg.addEventListener("click", event => {
        let country = nearest(event.clientX, event.clientY, 24);
        country ? show(country) : hide();
    });

    document.addEventListener("pointerdown", event => {
        if (active && !svg.contains(event.target)) hide();
    });
})();

// University belt: a mouse moving over the belt holds it still, so a name can be read.
// :hover is not trusted for this. While the page scrolls, browsers keep the old hover state
// until the scroll ends, so a belt that had been under a resting pointer stayed frozen the
// whole time it scrolled away. Here only real pointer movement holds the belt, and any scroll,
// or the pointer leaving, lets it go again. Touch screens never hold it.
(function () {
    let belt = document.querySelector(".belt");
    if (!belt || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let lastScroll = -Infinity;

    function release() {
        belt.classList.remove("is_held");
    }

    function scrolled() {
        lastScroll = performance.now();
        release();
    }

    belt.addEventListener("pointermove", event => {
        if (event.pointerType == "touch") return;
        // a mouse that twitches while the page is still scrolling does not hold it
        if (performance.now() - lastScroll > 300) belt.classList.add("is_held");
    });
    belt.addEventListener("pointerleave", release);
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("wheel", scrolled, { passive: true });
    window.addEventListener("blur", release);
})();

// "Coming soon." letters rise in one after another as the line arrives,
// and replay if the visitor scrolls back up and down again.
(function () {
    let line = document.querySelector(".coming_soon_line");
    if (!line || !("IntersectionObserver" in window)) return;

    let text = line.textContent;
    line.setAttribute("aria-label", text);
    line.textContent = "";
    [...text].forEach((character, i) => {
        let span = document.createElement("span");
        span.className = "coming_soon_char";
        span.setAttribute("aria-hidden", "true");
        span.style.setProperty("--i", i);
        span.textContent = character == " " ? " " : character;
        line.appendChild(span);
    });
    line.classList.add("letters_ready");

    new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                line.classList.add("letters_in");
            } else if (entry.boundingClientRect.top > 0) {
                // only reset when it has dropped back below the screen
                line.classList.remove("letters_in");
            }
        });
    }, { threshold: 0.6 }).observe(line);
})();
