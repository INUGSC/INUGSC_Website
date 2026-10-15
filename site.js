// INUGSC site behaviour, used by every page.

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
