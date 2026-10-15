// Builds the "Previous sponsors" logos from sponsors.txt into <ul id="sponsor_list">.
let sponsorList = document.getElementById("sponsor_list");

function createSponsorContainer(sponsor) {
    let sponsorContainer = document.createElement("li");

    let img = document.createElement("img");
    img.src = sponsor.imgSrc;
    img.alt = sponsor.name;
    img.loading = "lazy";
    if (sponsor.smaller) img.className = "smaller";
    sponsorContainer.appendChild(img);

    return sponsorContainer;
}

function generateSponsorContainers(sponsorObjects) {
    sponsorList.innerHTML = "";
    sponsorObjects.forEach(sponsorObject => {
        sponsorList.appendChild(createSponsorContainer(sponsorObject));
    });
}

// If the list can't be loaded, hide the whole section rather than show an empty heading.
function hideSponsorsSection() {
    let section = sponsorList.closest("section");
    if (section) section.hidden = true;
}

function parseSponsorsList(sponsorsFileContents) {
    let sponsors = [];

    let lines = sponsorsFileContents.split("\n");
    if (lines[lines.length - 1] != "") lines.push("");

    let foundStart = false;
    let currentSponsor = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!foundStart) {
            if (line == "-----") foundStart = true;
            continue;
        }
        if (line == "") {
            if (currentSponsor.length == 2) {
                let imgSrc = currentSponsor[0];
                let name = currentSponsor[1];
                let smaller = false;
                if (name.startsWith("[Smaller] ")) {
                    smaller = true;
                    name = name.substring(10);
                }
                sponsors.push({imgSrc, name, smaller});
            }
            currentSponsor = [];
        } else {
            currentSponsor.push(line);
        }
    }

    return sponsors;
}

async function fetchSponsorsList() {
    let url = "/sponsors.txt";

    let response = await fetch(url);
    if (!response.ok) return;

    return await response.text();
}

async function loadSponsors() {
    if (!sponsorList) return;

    let sponsorsFileContents = await fetchSponsorsList().catch(() => undefined);
    let sponsorObjects = sponsorsFileContents ? parseSponsorsList(sponsorsFileContents) : [];
    if (sponsorObjects.length == 0) {
        hideSponsorsSection();
        return;
    }
    generateSponsorContainers(sponsorObjects);
}

loadSponsors();
