// Committee page: builds the grid of people from people.txt, in the order they are listed there.

(function () {
    let grid = document.getElementById("committee_grid");
    if (!grid) return;

    function parsePeople(text) {
        let people = [];
        let lines = text.replace(/\r/g, "").split("\n");
        let start = lines.indexOf("-----");
        if (start == -1) return people;

        let block = [];
        for (let line of lines.slice(start + 1).concat([""])) {
            line = line.trim();
            if (line) {
                block.push(line);
                continue;
            }
            if (block.length == 4) {
                let [imgSrc, name, role, course] = block;
                let important = name.startsWith("[Important] ");
                if (important) name = name.substring(12);
                people.push({ imgSrc, name, role, course, important });
            }
            block = [];
        }
        return people;
    }

    function personElement(person) {
        let item = document.createElement("li");
        item.className = "person reveal" + (person.important ? " person_lead" : "");

        // a square frame holds the photo; if the photo is missing, the empty frame keeps the grid even
        let frame = document.createElement("div");
        frame.className = "person_photo";
        item.appendChild(frame);

        let img = document.createElement("img");
        img.src = person.imgSrc;
        img.alt = person.name;
        img.width = 800;
        img.height = 800;
        img.loading = person.important ? "eager" : "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => img.remove());
        frame.appendChild(img);

        let name = document.createElement("h3");
        name.className = "person_name";
        name.textContent = person.name;
        item.appendChild(name);

        let role = document.createElement("p");
        role.className = "person_role";
        role.textContent = person.role;
        item.appendChild(role);

        let course = document.createElement("p");
        course.className = "person_course";
        course.textContent = person.course;
        item.appendChild(course);

        return item;
    }

    fetch("/people.txt", { cache: "no-cache" })
        .then(response => {
            if (!response.ok) throw new Error(response.status);
            return response.text();
        })
        .then(text => {
            let people = parsePeople(text);
            grid.replaceChildren(...people.map(personElement));
        })
        .catch(() => {
            grid.closest(".committee").hidden = true;
        });
})();
