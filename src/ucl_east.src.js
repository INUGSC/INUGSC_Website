// The first view's fly-in of UCL East.
//
// A simplified architectural model of Marshgate and One Pool Street, drawn with three.js.
// Scrolling through the first view moves the camera from above the Olympic Park down to the
// river between the two buildings. Nothing moves unless the visitor scrolls.
//
// This is the source file. The page loads the bundled copy, /ucl_east.js. After changing this
// file, rebuild it from the repository folder with:
//
//     npm install three esbuild
//     npx esbuild src/ucl_east.src.js --bundle --minify --format=esm --outfile=ucl_east.js
//
// and bump ucl_east.js's ?v= in index.html.
//
// The model is drawn from published descriptions and photographs, not survey drawings:
// Marshgate is an eight-storey concrete block (tall storeys, about 12 ordinary storeys high) on
// the west bank of the Waterworks River; One Pool Street is a three-storey podium with towers of
// 13 and 17 storeys on the east bank, joined to Marshgate by a footbridge.

import {
    WebGLRenderer, Scene, PerspectiveCamera, Color, Fog,
    HemisphereLight, DirectionalLight, BoxGeometry, PlaneGeometry, CylinderGeometry,
    IcosahedronGeometry, MeshStandardMaterial, Mesh, Vector3,
    CatmullRomCurve3, PCFShadowMap, MathUtils,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const section = document.querySelector(".first_view");
const stage = section && section.querySelector(".first_view_stage");
const canvas = stage && stage.querySelector(".flyin_canvas");

function webglAvailable() {
    try {
        const test = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (test.getContext("webgl2") || test.getContext("webgl")));
    } catch (error) {
        return false;
    }
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = navigator.connection && navigator.connection.saveData;


// ---------- Palette (DESIGN.md colours) ----------

const DEEP_NAVY = 0x0e0e33;
const PALE = 0xe1e8f0;

// ---------- Geometry helpers ----------

// A small seeded random number generator, so the trees and the city stay where they are.
function seeded(seed) {
    return () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

function buildModel() {
    const parts = { pale: [], glass: [], dark: [], tree: [] };

    // A box standing on y = base, centred on x and z
    function box(kind, w, h, d, x, base, z) {
        const g = new BoxGeometry(w, h, d);
        g.translate(x, base + h / 2, z);
        parts[kind].push(g);
    }

    // ---- Marshgate: west bank, a concrete block on a recessed glazed ground floor ----
    {
        const cx = -76, cz = 0, W = 84, D = 64, H = 50, base = 7;
        const storeys = 8, storey = (H - base) / storeys;

        box("glass", W - 9, base, D - 9, cx, 0, cz);                // recessed ground floor
        box("glass", W - 1.6, H - base, D - 1.6, cx, base, cz);      // glazing behind the frame
        box("pale", W + 0.6, 1.8, D + 0.6, cx, H - 1.8, cz);         // parapet
        box("pale", W + 0.6, 1.2, D + 0.6, cx, base - 0.6, cz);      // first-floor edge
        box("pale", 38, 4.5, 24, cx + 8, H, cz - 6);                 // roof plant

        // Ground-floor columns
        for (let x = -W / 2 + 4.2; x < W / 2 - 1; x += 8.4) {
            box("pale", 1.3, base, 1.3, cx + x, 0, cz + D / 2 - 0.65);
            box("pale", 1.3, base, 1.3, cx + x, 0, cz - D / 2 + 0.65);
        }
        for (let z = -D / 2 + 8; z < D / 2 - 1; z += 8) {
            box("pale", 1.3, base, 1.3, cx + W / 2 - 0.65, 0, cz + z);
            box("pale", 1.3, base, 1.3, cx - W / 2 + 0.65, 0, cz + z);
        }

        // The concrete frame: fins on every bay, floor bands between them. Some bays leave a
        // band out, which reads as the double-height spaces each floor's "neighbourhood" has.
        const doubleHeight = {
            south: [[2, 4, [2, 5]], [10, 12, [4]]],
            east: [[4, 7, [3, 6]]],
            north: [[6, 9, [1, 5]]],
            west: [[2, 4, [4]]],
        };
        function skipBand(face, bay, k) {
            return (doubleHeight[face] || []).some(([a, b, ks]) => bay >= a && bay <= b && ks.includes(k));
        }

        const faces = [
            { name: "south", length: W, bays: 16, along: "x", offset: D / 2 },
            { name: "north", length: W, bays: 16, along: "x", offset: -D / 2 },
            { name: "east", length: D, bays: 12, along: "z", offset: W / 2 },
            { name: "west", length: D, bays: 12, along: "z", offset: -W / 2 },
        ];
        for (const face of faces) {
            const bay = face.length / face.bays;
            const out = Math.sign(face.offset) * 0.5;
            for (let i = 0; i <= face.bays; i++) {
                const t = -face.length / 2 + i * bay;
                if (face.along === "x") box("pale", 1.3, H - base, 2.2, cx + t, base, cz + face.offset + out);
                else box("pale", 2.2, H - base, 1.3, cx + face.offset + out, base, cz + t);
            }
            for (let k = 1; k < storeys; k++) {
                for (let i = 0; i < face.bays; i++) {
                    if (skipBand(face.name, i, k)) continue;
                    const t = -face.length / 2 + (i + 0.5) * bay;
                    const y = base + k * storey - 0.45;
                    if (face.along === "x") box("pale", bay, 0.9, 1.1, cx + t, y, cz + face.offset + out);
                    else box("pale", 1.1, 0.9, bay, cx + face.offset + out, y, cz + t);
                }
            }
        }
    }

    // ---- One Pool Street: east bank, a podium with two residential towers ----
    {
        const px = 76, pz = 34, PW = 100, PD = 42, PH = 15;
        box("glass", PW - 1, PH, PD - 1, px, 0, pz);
        box("pale", PW + 0.4, 1.4, PD + 0.4, px, PH - 1.4, pz);
        for (const y of [5, 10]) box("pale", PW + 0.4, 0.7, PD + 0.4, px, y - 0.35, pz);
        for (let x = -PW / 2; x <= PW / 2 + 0.01; x += 5) {
            box("pale", 0.7, PH, 0.9, px + x, 0, pz + PD / 2);
            box("pale", 0.7, PH, 0.9, px + x, 0, pz - PD / 2);
        }
        for (let z = -PD / 2; z <= PD / 2 + 0.01; z += 5.25) {
            box("pale", 0.9, PH, 0.7, px + PW / 2, 0, pz + z);
            box("pale", 0.9, PH, 0.7, px - PW / 2, 0, pz + z);
        }

        function tower(cx, cz, W, D, floors) {
            const fh = 3.1, H = floors * fh;
            box("glass", W - 0.8, H, D - 0.8, cx, PH, cz);
            box("pale", W + 0.4, 1.6, D + 0.4, cx, PH + H - 0.4, cz);
            for (let k = 1; k < floors; k++) box("pale", W + 0.3, 0.55, D + 0.3, cx, PH + k * fh - 0.3, cz);
            // Piers, left off at the glazed common rooms on each end
            for (let x = -W / 2 + 4; x <= W / 2 - 4 + 0.01; x += 2.75) {
                box("pale", 0.6, H, 0.8, cx + x, PH, cz + D / 2);
                box("pale", 0.6, H, 0.8, cx + x, PH, cz - D / 2);
            }
            for (let z = -D / 2; z <= D / 2 + 0.01; z += D / 5) {
                box("pale", 0.8, H, 0.6, cx + W / 2, PH, cz + z);
                box("pale", 0.8, H, 0.6, cx - W / 2, PH, cz + z);
            }
            box("pale", 9, 3, 7, cx, PH + H + 1.2, cz); // roof plant
            return PH + H;
        }
        tower(50, 28, 34, 17, 13);
        tower(104, 40, 34, 17, 17);

        // Roof terrace planting
        const random = seeded(7);
        for (let i = 0; i < 16; i++) {
            const x = px - 6 + (random() - 0.5) * 26;
            const z = pz + (random() - 0.5) * 30;
            treeAt(x, PH, z, 1.6 + random() * 0.8);
        }
    }

    // ---- The footbridge between them ----
    box("pale", 52, 0.9, 7, -6, 2.6, 12);
    box("pale", 52, 1.1, 0.25, -6, 3.5, 15.4);
    box("pale", 52, 1.1, 0.25, -6, 3.5, 8.6);
    for (const x of [-12, 0]) box("pale", 1.2, 2.6, 1.2, x, -1.4, 12);

    // ---- Trees along both banks and through the park ----
    function treeAt(x, y, z, size) {
        const trunk = new CylinderGeometry(0.25 * size, 0.3 * size, 2.2 * size, 5);
        trunk.translate(x, y + 1.1 * size, z);
        const crown = new IcosahedronGeometry(2 * size, 1);
        crown.scale(1, 1.15, 1);
        crown.translate(x, y + 3.6 * size, z);
        parts.tree.push(trunk, crown);
    }
    {
        const random = seeded(42);
        for (let z = -420; z < 420; z += 11) {
            for (const side of [-1, 1]) {
                const x = side * (21 + random() * 4);
                const blockedWest = side < 0 && z > -40 && z < 40;            // Marshgate's river face
                const blockedEast = side > 0 && z > 6 && z < 62;              // One Pool Street
                const blockedBridge = Math.abs(z - 12) < 7;
                if (blockedWest || blockedEast || blockedBridge || random() < 0.18) continue;
                treeAt(x, 0, z + (random() - 0.5) * 4, 0.9 + random() * 0.5);
            }
        }
        // Park to the north
        for (let i = 0; i < 140; i++) {
            const x = -260 + random() * 520;
            const z = -110 - random() * 320;
            if (Math.abs(x) < 26 || Math.abs(x + 250) < 22) continue;
            treeAt(x, 0, z, 1 + random() * 0.8);
        }
    }

    // ---- The surroundings, kept dark so the two buildings stand out ----
    {
        const random = seeded(2027);
        // Stratford, to the south and east
        for (let i = 0; i < 70; i++) {
            const x = -320 + random() * 820;
            const z = 105 + random() * 380;
            if (Math.abs(x) < 80) continue;                                     // keep the river view clear
            const w = 18 + random() * 34, d = 16 + random() * 30;
            let h = 8 + random() * random() * 60;
            // Keep the blocks low where they would stand between the camera and the campus
            const along = (x * 250 + z * 320) / (250 * 250 + 320 * 320);
            const off = Math.abs(x * 320 - z * 250) / Math.hypot(250, 320);
            if (along > 0 && along < 1.1 && off < 140) h = Math.min(h, 10);
            box("dark", w, h, d, x, 0, z);
        }
        for (let i = 0; i < 26; i++) {
            const x = 220 + random() * 320;
            const z = -260 + random() * 340;
            const h = 20 + random() * random() * 110;
            box("dark", 20 + random() * 26, h, 18 + random() * 24, x, 0, z);
        }
        // Low pavilions in the park
        box("dark", 60, 9, 110, 120, 0, -170);
        box("dark", 44, 7, 36, -150, 0, -120);
    }

    return parts;
}

function buildGround() {
    const meshes = [];
    const ground = new MeshStandardMaterial({ color: 0x17174e, roughness: 1 });
    const water = new MeshStandardMaterial({ color: 0x0a0a2a, roughness: 0.3, metalness: 0 });

    // Land between the river channels, so the banks show as edges
    const strips = [
        [-1200, -262], [-238, -14], [14, 1200],
    ];
    for (const [a, b] of strips) {
        const g = new BoxGeometry(b - a, 3, 2400);
        g.translate((a + b) / 2, -1.5, 0);
        const m = new Mesh(g, ground);
        m.receiveShadow = true;
        meshes.push(m);
    }
    const w = new PlaneGeometry(2400, 2400);
    w.rotateX(-Math.PI / 2);
    w.translate(0, -1.3, 0);
    meshes.push(new Mesh(w, water));
    return meshes;
}

// ---------- The camera's path ----------
// Positions and the points the camera looks at, from the first frame (above the park, to the
// south-east) to the last (low over the river, looking up at Marshgate's east face).

const PATH = new CatmullRomCurve3([
    new Vector3(250, 195, 320),
    new Vector3(200, 120, 270),
    new Vector3(120, 58, 250),
    new Vector3(46, 22, 232),
    new Vector3(4, 11, 214),
], false, "centripetal");

const LOOK = new CatmullRomCurve3([
    new Vector3(-8, 14, 10),
    new Vector3(-12, 18, 8),
    new Vector3(-14, 22, 4),
    new Vector3(-10, 26, 0),
    new Vector3(-6, 29, -6),
], false, "centripetal");

// Where the labels point
const ANCHORS = {
    marshgate: new Vector3(-76, 52, 0),
    pool_street: new Vector3(104, 70.5, 40),
};

// ---------- Page wiring ----------

function start() {
    const root = document.documentElement;
    const before = section.offsetHeight;
    root.classList.add("flyin_on");
    // Keep the visitor's place if the page opened part-way down, at an anchor
    if (window.scrollY > 0) window.scrollBy(0, section.offsetHeight - before);

    // preserveDrawingBuffer keeps the last frame whole while the pinned stage scrolls away
    const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setClearColor(DEEP_NAVY, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;

    const scene = new Scene();
    scene.background = new Color(DEEP_NAVY);
    scene.fog = new Fog(DEEP_NAVY, 380, 1150);

    scene.add(new HemisphereLight(0xd9e2f2, 0x0e0e33, 1.5));
    const sun = new DirectionalLight(0xffffff, 2.6);
    sun.position.set(-220, 300, 200);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -240, right: 240, top: 240, bottom: -240, near: 10, far: 900 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.6;
    scene.add(sun, sun.target);

    const materials = {
        pale: new MeshStandardMaterial({ color: PALE, roughness: 0.82 }),
        glass: new MeshStandardMaterial({ color: 0x343f74, roughness: 0.35, metalness: 0.15 }),
        dark: new MeshStandardMaterial({ color: 0x20205f, roughness: 1 }),
        tree: new MeshStandardMaterial({ color: 0x2a3474, roughness: 1, flatShading: true }),
    };
    const parts = buildModel();
    for (const kind of Object.keys(parts)) {
        const mesh = new Mesh(mergeGeometries(parts[kind].map(g => (g.index ? g.toNonIndexed() : g))), materials[kind]);
        mesh.castShadow = kind !== "dark";
        mesh.receiveShadow = true;
        scene.add(mesh);
        parts[kind].forEach(g => g.dispose());
    }
    buildGround().forEach(m => scene.add(m));

    const camera = new PerspectiveCamera(34, 1, 5, 2400);
    const content = stage.querySelector(".first_view_content");
    const labels = [...stage.querySelectorAll(".flyin_label")].map(el => ({ el, anchor: ANCHORS[el.dataset.anchor] }));

    let width = 0, height = 0, narrow = false;
    function resize() {
        width = stage.clientWidth;
        height = stage.clientHeight;
        narrow = width / height < 0.9;
        // Cap the pixels drawn, so large screens stay smooth
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (width * height)));
        renderer.setPixelRatio(ratio);
        renderer.setSize(width, height, false);
    }

    // While the opening text is showing, the buildings sit to the right of it on wide screens
    // and above it on narrow ones. Once the text has gone they move to the middle. This draws a
    // larger view and shows only part of it.
    function frameView(p) {
        const m = MathUtils.smoothstep(p, 0.12, 0.6);
        const fx = MathUtils.lerp(narrow ? 0.5 : 0.63, 0.5, m);
        const fy = MathUtils.lerp(narrow ? 0.27 : 0.44, narrow ? 0.4 : 0.46, m);
        const fullW = 2 * Math.max(fx, 1 - fx) * width;
        const fullH = 2 * Math.max(fy, 1 - fy) * height;
        const baseFov = narrow ? MathUtils.lerp(64, 58, m) : 34;
        camera.fov = 2 * MathUtils.radToDeg(Math.atan(Math.tan(MathUtils.degToRad(baseFov / 2)) * fullH / height));
        camera.aspect = fullW / fullH;
        camera.setViewOffset(fullW, fullH, fullW / 2 - fx * width, fullH / 2 - fy * height, width, height);
        camera.updateProjectionMatrix();
    }

    function progress() {
        const rect = section.getBoundingClientRect();
        // The section holds the flight plus one more screen, during which the next section
        // slides up over the still-pinned stage (see site.css)
        const travel = section.offsetHeight - 2 * stage.offsetHeight;
        if (travel <= 0) return 0;
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        return MathUtils.clamp((top - rect.top) / travel, 0, 1);
    }

    const position = new Vector3(), look = new Vector3(), projected = new Vector3();
    function draw(p) {
        const t = p * p * (3 - 2 * p); // ease in and out
        frameView(p);
        PATH.getPoint(t, position);
        LOOK.getPoint(t, look);
        camera.position.copy(position);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        renderer.render(scene, camera);

        // The opening text lifts away in the first part of the flight
        const away = MathUtils.clamp((p - 0.04) / 0.26, 0, 1);
        content.style.opacity = String(1 - away);
        content.style.transform = away ? `translateY(${-4 * away}rem)` : "";
        content.style.visibility = away >= 1 ? "hidden" : "";

        // The labels name the two buildings in the middle of the flight
        const shown = MathUtils.clamp((p - 0.3) / 0.12, 0, 1);
        for (const label of labels) {
            projected.copy(label.anchor).project(camera);
            const onScreen = projected.z < 1 && projected.y < 0.9 && projected.y > -0.6;
            const x = (projected.x + 1) / 2 * width;
            const y = (1 - projected.y) / 2 * height;
            // Fade a label out as it nears the side of the screen, rather than cutting it off
            const half = label.el.offsetWidth / 2 + 12;
            const room = MathUtils.clamp(Math.min(x - half, width - x - half) / 48, 0, 1);
            label.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            label.el.style.opacity = onScreen ? String(shown * room) : "0";
        }
    }

    let current = progress();
    let target = current;
    let frame = 0;
    function tick() {
        frame = 0;
        // Ease towards the scroll position, so a flick of the wheel glides rather than jumps
        current += (target - current) * 0.14;
        if (Math.abs(target - current) < 0.0004) current = target;
        draw(current);
        if (current !== target) frame = requestAnimationFrame(tick);
    }
    function request() {
        target = progress();
        if (!frame) frame = requestAnimationFrame(tick);
    }

    resize();
    renderer.shadowMap.needsUpdate = true;
    draw(current);
    stage.classList.add("flyin_drawn");

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", () => {
        resize();
        draw(current);
        request();
    });

    // For previews: window.flyinPreview(0.5) draws that point of the flight
    window.flyinProgress = progress;
    window.flyinPreview = p => {
        current = target = p;
        draw(p);
    };
}

if (section && stage && canvas && !reducedMotion && !saveData && webglAvailable()) {
    start();
}
