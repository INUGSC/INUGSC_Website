// INUGSC site behaviour for the renovated pages. index.js stays until the
// Widening Participation page is renovated.

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
