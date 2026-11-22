// Abstract competition: reads abstracts.txt and closes submissions when it says so or when the
// closing time has passed. Closed, the elements marked .abstracts_open_only are removed and the
// section's status line shows the closed message.

const ABSTRACTS_DEFAULT_CLOSES = "2026-12-08 23:59";
const ABSTRACTS_DEFAULT_MESSAGE = "Submissions have closed. Results will be announced soon.";

// "YYYY-MM-DD HH:MM" in UK time. The UK is on GMT from late October to late March and on
// BST (UTC+1) otherwise; the last Sunday of March and of October bound BST.
function abstractsUkTime(text) {
    let m = /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/.exec(text || "");
    if (!m) return null;
    let [y, mo, d, h, mi] = m.slice(1).map(Number);
    let lastSunday = month => {
        let last = new Date(Date.UTC(y, month + 1, 0));
        return last.getUTCDate() - last.getUTCDay();
    };
    let inBst = (mo > 3 && mo < 10) ||
        (mo == 3 && d >= lastSunday(2)) ||
        (mo == 10 && d < lastSunday(9));
    return new Date(Date.UTC(y, mo - 1, d, h - (inBst ? 1 : 0), mi, 59));
}

function applyAbstracts(settings) {
    let closes = abstractsUkTime(settings.closes) || abstractsUkTime(ABSTRACTS_DEFAULT_CLOSES);
    let open = settings.open !== false && Date.now() <= closes.getTime();

    if (open) {
        if (settings.link) {
            document.querySelectorAll(".abstracts_form_link").forEach(a => a.href = settings.link);
        }
        return;
    }
    document.querySelectorAll(".abstracts_open_only").forEach(el => el.remove());
    document.querySelectorAll(".abstracts_status").forEach(el => {
        el.textContent = settings.message || ABSTRACTS_DEFAULT_MESSAGE;
    });
}

async function checkForAbstracts() {
    let settings = {};
    try {
        let response = await fetch("/abstracts.txt", { cache: "no-cache" });
        if (response.ok) {
            for (let line of (await response.text()).split("\n")) {
                let i = line.indexOf(":");
                if (i < 0) continue;
                let key = line.slice(0, i).trim().toUpperCase();
                let value = line.slice(i + 1).trim();
                if (key == "SUBMISSIONS OPEN") settings.open = value.toUpperCase() != "NO";
                else if (key == "FORM LINK") settings.link = value;
                else if (key.startsWith("CLOSES")) settings.closes = value;
                else if (key == "CLOSED MESSAGE") settings.message = value;
            }
        }
    } catch (e) {
        // No file: fall back to the closing time above.
    }
    applyAbstracts(settings);
}

checkForAbstracts();
