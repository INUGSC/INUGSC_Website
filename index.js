let fadeInContainers = [].slice.call(
    document.querySelectorAll(".fade_in_while_scrolling")
);

function testForFadeIn() {
    fadeInContainers.forEach(container => {
        if (container.className.indexOf("transition_performed") != -1) return;

        let rect = container.getBoundingClientRect();
        let threshold = window.innerHeight - 100;
        if (rect.y < threshold) {
            container.className += " transition_performed";
        }
    });
}

function checkForAnchor() {
    if (location.hash == "") return;

    let anchor = location.hash.substring(1);
    let anchorElement = document.getElementById(`anchor_${anchor}`);

    if (!anchorElement) return;

    let headerHeight = document.querySelector("header").getBoundingClientRect().height;
    let scrollPosition = (anchorElement.getBoundingClientRect().y + window.scrollY) - headerHeight;
    if (scrollPosition < 0) scrollPosition = 0;

    window.scrollTo({top: scrollPosition, behavior: "smooth"});
}

function scrollEventListener() {
    testForFadeIn();
}

function loadEventListener() {
    checkForAnchor();
    testForFadeIn();
}

function hashchangeEventListener() {
    checkForAnchor();
}

window.addEventListener("scroll", scrollEventListener);

window.addEventListener("load", loadEventListener);

window.addEventListener("hashchange", hashchangeEventListener);


let headerHamburger = document.getElementById("header_hamburger_container");
let headerListContainer = document.getElementById("header_list_container");

headerHamburger.addEventListener("click", () => {
    if (headerListContainer.style.maxHeight == "") {
        headerListContainer.style.maxHeight = "100vh";
    } else {
        headerListContainer.style.maxHeight = "";
    }
});

let headerLinks = [].slice.call(
    document.querySelectorAll("header div#header_list_container ul a")
);

headerLinks.forEach(headerLink => {
    headerLink.addEventListener("click", () => {
        if (getComputedStyle(headerHamburger).display == "block") {
            // If we are in mobile mode
            headerListContainer.style.maxHeight = "";
        }
    });
});


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
        span.textContent = character == " " ? "\u00a0" : character;
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
