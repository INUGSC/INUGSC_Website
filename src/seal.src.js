// The first view's 2027 seal, as a medal.
//
// A three.js medal: the 2027 seal as an enamelled face in a polished rim, with an engraved
// reverse. Scrolling through the first view turns it once, so the reverse passes by and the
// face comes back round as the date settles beneath it. Nothing moves unless the visitor scrolls.
//
// This is the source file. The page loads the bundled copy, /seal.js. After changing this
// file, rebuild it from the repository folder with:
//
//     npm install three esbuild
//     npx esbuild src/seal.src.js --bundle --minify --format=esm --outfile=seal.js
//
// and bump seal.js's ?v= in index.html. The face is img/seal/seal_face.jpg, the 2027 seal
// enlarged to 1024px; a larger original from Canva would make it sharper.

import {
    WebGLRenderer, Scene, PerspectiveCamera, Color, CylinderGeometry, TorusGeometry, Mesh, Group,
    MeshStandardMaterial, MeshPhysicalMaterial, DirectionalLight, TextureLoader, CanvasTexture,
    SRGBColorSpace, PMREMGenerator, RepeatWrapping, MathUtils, ACESFilmicToneMapping,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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

const DEEP_NAVY = 0x0e0e33;

// The reverse: lettering cut into the metal, drawn as a height map (dark is cut in)
function reverseTextures(size = 1024) {
    const height = document.createElement("canvas");
    height.width = height.height = size;
    const g = height.getContext("2d");
    const c = size / 2;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, size, size);
    g.fillStyle = "#000";
    g.strokeStyle = "#000";
    g.textAlign = "center";
    g.textBaseline = "middle";

    // Lettering round the edge
    const ring = "UCL SURGICAL SOCIETY · FOUNDED 2011 · SIXTEENTH CONFERENCE · ";
    g.font = `${size * 0.047}px "Libre Baskerville", Georgia, serif`;
    const radius = size * 0.405;
    let angle = -Math.PI / 2;
    const total = [...ring].reduce((sum, ch) => sum + g.measureText(ch).width, 0);
    const scale = (Math.PI * 2) / total;
    for (const ch of ring) {
        const w = g.measureText(ch).width;
        angle += (w / 2) * scale;
        g.save();
        g.translate(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius);
        g.rotate(angle + Math.PI / 2);
        g.fillText(ch, 0, 0);
        g.restore();
        angle += (w / 2) * scale;
    }
    // Two fine circles either side of it
    g.lineWidth = size * 0.004;
    for (const r of [0.355, 0.455]) {
        g.beginPath();
        g.arc(c, c, size * r, 0, Math.PI * 2);
        g.stroke();
    }
    // The centre
    g.font = `${size * 0.2}px "Libre Baskerville", Georgia, serif`;
    g.fillText("XVI", c, c - size * 0.045);
    g.font = `italic ${size * 0.05}px "Libre Baskerville", Georgia, serif`;
    g.fillText("30–31 January 2027", c, c + size * 0.13);
    g.font = `${size * 0.036}px "Libre Baskerville", Georgia, serif`;
    g.fillText("UCL EAST · LONDON", c, c + size * 0.205);

    const bump = new CanvasTexture(height);
    // Slightly darker where the letters are cut, as engraving catches less light
    const colour = document.createElement("canvas");
    colour.width = colour.height = size;
    const k = colour.getContext("2d");
    k.fillStyle = "#c9ced8";
    k.fillRect(0, 0, size, size);
    k.globalAlpha = 0.45;
    k.drawImage(height, 0, 0);
    const map = new CanvasTexture(colour);
    map.colorSpace = SRGBColorSpace;
    return { bump, map };
}

// The milled edge: fine vertical ridges
function edgeBump() {
    const strip = document.createElement("canvas");
    strip.width = 8;
    strip.height = 2;
    const g = strip.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 8, 2);
    g.fillStyle = "#000";
    g.fillRect(0, 0, 3, 2);
    const t = new CanvasTexture(strip);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(220, 1);
    return t;
}

function start() {
    const root = document.documentElement;
    const before = section.offsetHeight;
    root.classList.add("flyin_on");
    if (window.scrollY > 0) window.scrollBy(0, section.offsetHeight - before);

    // preserveDrawingBuffer keeps the last frame whole while the pinned stage scrolls away
    const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setClearColor(DEEP_NAVY, 1);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new Scene();
    scene.background = new Color(DEEP_NAVY);
    const pmrem = new PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 4, 5);
    scene.add(key);

    const R = 1, T = 0.11;
    const metal = new MeshStandardMaterial({ color: 0xd6dae2, metalness: 1, roughness: 0.24 });
    const edge = new MeshStandardMaterial({ color: 0xc8ccd6, metalness: 1, roughness: 0.32, bumpMap: edgeBump(), bumpScale: 1.5 });
    // The face is a printed enamel: it takes the studio's light but gives back no highlights
    const face = new MeshPhysicalMaterial({ color: 0xffffff, roughness: 1, metalness: 0, specularIntensity: 0, envMapIntensity: 0.5 });
    const reverse = reverseTextures();
    const back = new MeshStandardMaterial({ map: reverse.map, bumpMap: reverse.bump, bumpScale: 3, metalness: 1, roughness: 0.38 });

    const medal = new Group();
    // A cylinder's caps face up and down; turn it so the face looks at the camera
    const body = new Mesh(new CylinderGeometry(R, R, T, 160, 1), [edge, face, back]);
    body.rotation.x = Math.PI / 2;
    // The reverse is drawn on the bottom cap: turn its lettering the right way round
    medal.add(body);
    for (const side of [1, -1]) {
        const rim = new Mesh(new TorusGeometry(R - 0.028, 0.034, 28, 200), metal);
        rim.position.z = side * T / 2;
        medal.add(rim);
    }
    scene.add(medal);

    const camera = new PerspectiveCamera(30, 1, 0.1, 50);
    const content = stage.querySelector(".first_view_content");
    const caption = stage.querySelector(".seal_caption");

    let width = 0, height = 0, narrow = false;
    function resize() {
        width = stage.clientWidth;
        height = stage.clientHeight;
        narrow = width / height < 0.9;
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (width * height)));
        renderer.setPixelRatio(ratio);
        renderer.setSize(width, height, false);
    }

    function frameView(p) {
        const m = MathUtils.smoothstep(p, 0.12, 0.55);
        const fx = MathUtils.lerp(narrow ? 0.5 : 0.77, 0.5, m);
        const fy = MathUtils.lerp(narrow ? 0.25 : 0.44, narrow ? 0.36 : 0.4, m);
        const fullW = 2 * Math.max(fx, 1 - fx) * width;
        const fullH = 2 * Math.max(fy, 1 - fy) * height;
        const baseFov = narrow ? 44 : 30;
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

    function draw(p) {
        frameView(p);
        const t = MathUtils.smootherstep(p, 0, 1);
        // One full turn, from a three-quarter view to face-on
        medal.rotation.y = MathUtils.lerp(-0.62, Math.PI * 2, t);
        medal.rotation.x = MathUtils.lerp(-0.2, 0, t) + Math.sin(t * Math.PI) * 0.12;
        medal.rotation.z = MathUtils.lerp(0.06, 0, t);
        const distance = MathUtils.lerp(narrow ? 8 : 7, narrow ? 7 : 7.2, t);
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);

        const away = MathUtils.clamp((p - 0.04) / 0.2, 0, 1);
        content.style.opacity = String(1 - away);
        content.style.transform = away ? `translateY(${-4 * away}rem)` : "";
        content.style.visibility = away >= 1 ? "hidden" : "";

        if (caption) {
            const shown = MathUtils.clamp((p - 0.72) / 0.14, 0, 1);
            caption.style.opacity = String(shown);
            caption.style.transform = `translate(-50%, ${(1 - shown) * 1.5}rem)`;
        }
    }

    let current = progress();
    let target = current;
    let frame = 0;
    function tick() {
        frame = 0;
        current += (target - current) * 0.14;
        if (Math.abs(target - current) < 0.0004) current = target;
        draw(current);
        if (current !== target) frame = requestAnimationFrame(tick);
    }
    function request() {
        target = progress();
        if (!frame) frame = requestAnimationFrame(tick);
    }

    const fontReady = document.fonts && document.fonts.load
        ? Promise.all([
            document.fonts.load('40px "Libre Baskerville"'),
            document.fonts.load('italic 40px "Libre Baskerville"'),
        ]).catch(() => null)
        : Promise.resolve();

    const faceLoaded = new Promise(resolve => {
        new TextureLoader().load("/img/seal/seal_face.jpg", texture => {
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            resolve(texture);
        }, undefined, () => resolve(null));
    });

    Promise.all([faceLoaded, fontReady]).then(([texture]) => {
        if (!texture) {
            root.classList.remove("flyin_on");
            return;
        }
        // Redraw the reverse now the typeface has loaded
        const fresh = reverseTextures();
        back.map = fresh.map;
        back.bumpMap = fresh.bump;
        // The cylinder's top cap maps the image upright when seen from the front
        texture.center.set(0.5, 0.5);
        texture.rotation = Math.PI / 2;
        face.map = texture;
        fresh.map.center.set(0.5, 0.5);
        fresh.bump.center.set(0.5, 0.5);
        fresh.map.rotation = fresh.bump.rotation = -Math.PI / 2;
        for (const t of [fresh.map, fresh.bump]) {
            t.wrapS = t.wrapT = RepeatWrapping;
            t.repeat.set(-1, -1);
        }
        face.needsUpdate = back.needsUpdate = true;

        resize();
        draw(current);
        stage.classList.add("flyin_drawn");
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", () => {
            resize();
            draw(current);
            request();
        });
        window.flyinProgress = progress;
        window.flyinPreview = p => {
            current = target = p;
            draw(p);
        };
    });
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = navigator.connection && navigator.connection.saveData;
if (section && stage && canvas && !reducedMotion && !saveData && webglAvailable()) {
    start();
}
