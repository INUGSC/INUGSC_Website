// The first view's globe.
//
// The Earth, drawn with three.js from NASA's Blue Marble and Black Marble imagery (public
// domain). Scrolling through the first view turns the globe from South East Asia to Europe,
// lights up the 16 countries delegates travelled from in 2025 and 2026, then moves in over
// London and names UCL East. Nothing moves unless the visitor scrolls.
//
// This is the source file. The page loads the bundled copy, /globe.js. After changing this
// file, rebuild it from the repository folder with:
//
//     npm install three esbuild
//     npx esbuild src/globe.src.js --bundle --minify --format=esm --outfile=globe.js
//
// and bump globe.js's ?v= in index.html.
//
// Images, in img/globe/:
//   earth_day_4k.jpg, earth_day_2k.jpg  Blue Marble, December (NASA Visible Earth)
//   earth_night.jpg                     Black Marble city lights (NASA Earth Observatory)
//   earth_relief.jpg                    Elevation, for the bump map
//   earth_masks.png                     Red: water, for the sea's sheen. Green: the delegates'
//                                       countries (Natural Earth 1:50m), for the fill

import {
    WebGLRenderer, Scene, PerspectiveCamera, Color, SphereGeometry, Mesh, MeshPhongMaterial,
    DirectionalLight, AmbientLight, TextureLoader, SRGBColorSpace, NoColorSpace, Vector3,
    BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, MathUtils,
} from "three";

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

// Where each delegate country's dot sits (its capital), west to east doesn't matter here:
// they light up as the sweep, which moves from east to west, passes their longitude.
const COUNTRIES = [
    ["Hong Kong", 22.32, 114.17],
    ["Indonesia", -6.21, 106.85],
    ["Singapore", 1.35, 103.82],
    ["Thailand", 13.76, 100.5],
    ["Georgia", 41.72, 44.79],
    ["Cyprus", 35.17, 33.36],
    ["Estonia", 59.44, 24.75],
    ["Bulgaria", 42.7, 23.32],
    ["Poland", 52.23, 21.01],
    ["Malta", 35.9, 14.51],
    ["Germany", 52.52, 13.4],
    ["Italy", 41.9, 12.5],
    ["Belgium", 50.85, 4.35],
    ["United Kingdom", 51.507, -0.128],
    ["Ireland", 53.35, -6.26],
    ["United States", 38.9, -77.04],
];
const LONDON = [51.5386, -0.0166]; // Marshgate, UCL East

// A point on the globe. three.js spheres put longitude -180 on the -x axis and 0 on +x.
function onGlobe(lat, lon, radius = 1, target = new Vector3()) {
    const phi = MathUtils.degToRad(lon + 180);
    const theta = MathUtils.degToRad(90 - lat);
    return target.set(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(radius);
}

// ---------- The flight ----------
// The camera's latitude, longitude and distance (in Earth radii from the centre), at points
// through the scroll. Between them it eases.
const KEYS = [
    { p: 0, lat: 10, lon: 102, d: 4.7 },
    { p: 0.5, lat: 38, lon: 16, d: 3.7 },
    { p: 0.78, lat: 50, lon: 1.5, d: 2.45 },
    { p: 1, lat: 51.5, lon: -0.02, d: 2.05 },
];
// The sweep that lights the countries: its longitude through the scroll
const SWEEP = { from: 132, to: -96, start: 0.06, end: 0.52 };

function camAt(p) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = MathUtils.smootherstep(p, a.p, b.p);
    return {
        lat: MathUtils.lerp(a.lat, b.lat, t),
        lon: MathUtils.lerp(a.lon, b.lon, t),
        d: MathUtils.lerp(a.d, b.d, t),
    };
}

function sweepAt(p) {
    const t = MathUtils.clamp((p - SWEEP.start) / (SWEEP.end - SWEEP.start), 0, 1);
    return MathUtils.lerp(SWEEP.from, SWEEP.to, t);
}

function start() {
    const root = document.documentElement;
    const before = section.offsetHeight;
    root.classList.add("flyin_on");
    if (window.scrollY > 0) window.scrollBy(0, section.offsetHeight - before);

    const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(DEEP_NAVY, 1);

    const scene = new Scene();
    scene.background = new Color(DEEP_NAVY);

    // The sun stands over the Arabian Sea: Asia is lit at the start, evening falls on its far
    // side, and Europe is in late-morning light at the end
    const sunWorld = onGlobe(8, 58, 1).normalize();
    const sun = new DirectionalLight(0xffffff, 3.1);
    sun.position.copy(sunWorld).multiplyScalar(10);
    scene.add(sun, new AmbientLight(0x2b3166, 0.55));

    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const loader = new TextureLoader();
    const load = (url, srgb = true) => new Promise(resolve => {
        loader.load(url, texture => {
            texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            resolve(texture);
        }, undefined, () => resolve(null));
    });

    const uniforms = {
        uNight: { value: null },
        uMasks: { value: null },
        uSunView: { value: new Vector3() },
        uSweep: { value: SWEEP.from },
        uAccent: { value: new Color(0x8fd0f5) },
    };

    const material = new MeshPhongMaterial({
        color: 0xffffff,
        specular: new Color(0x2a3550),
        shininess: 16,
        bumpScale: 2.2,
    });
    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms);
        shader.fragmentShader = shader.fragmentShader
            .replace("#include <common>", `#include <common>
uniform sampler2D uNight;
uniform sampler2D uMasks;
uniform vec3 uSunView;
uniform float uSweep;
uniform vec3 uAccent;`)
            // Tint the delegates' countries once the sweep has passed them
            .replace("#include <map_fragment>", `#include <map_fragment>
vec4 globeMasks = texture2D(uMasks, vMapUv);
float globeLon = vMapUv.x * 360.0 - 180.0;
float globeLit = smoothstep(uSweep - 2.5, uSweep + 2.5, globeLon) * globeMasks.g;
diffuseColor.rgb = mix(diffuseColor.rgb, uAccent, globeLit * 0.4);`)
            // City lights on the night side
            .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
float globeDay = dot(normalize(vNormal), uSunView);
float globeNight = smoothstep(0.1, -0.22, globeDay);
totalEmissiveRadiance += texture2D(uNight, vMapUv).rgb * globeNight * 1.35;
totalEmissiveRadiance += uAccent * globeLit * globeNight * 0.12;`);
    };

    const globe = new Mesh(new SphereGeometry(1, 180, 90), material);
    scene.add(globe);

    // The countries' dots: the same size everywhere, as on the delegate map further down
    const dots = new BufferGeometry();
    const positions = [], lons = [];
    for (const [, lat, lon] of COUNTRIES) {
        onGlobe(lat, lon, 1.004).toArray(positions, positions.length);
        lons.push(lon);
    }
    dots.setAttribute("position", new Float32BufferAttribute(positions, 3));
    dots.setAttribute("aLon", new Float32BufferAttribute(lons, 1));
    const dotMaterial = new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uSize: { value: 7 },
            uSweep: uniforms.uSweep,
            uColor: { value: new Color(0xffffff) },
        },
        vertexShader: `
            attribute float aLon;
            uniform float uSize;
            uniform float uSweep;
            varying float vAlpha;
            void main() {
                vec4 view = modelViewMatrix * vec4(position, 1.0);
                vec3 normalView = normalize(normalMatrix * position);
                float facing = dot(normalView, normalize(-view.xyz));
                vAlpha = smoothstep(0.05, 0.3, facing) * smoothstep(uSweep - 3.0, uSweep + 3.0, aLon);
                gl_Position = projectionMatrix * view;
                gl_PointSize = uSize;
            }`,
        fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
                float r = length(gl_PointCoord - 0.5);
                float edge = 1.0 - smoothstep(0.38, 0.5, r);
                gl_FragColor = vec4(uColor, edge * vAlpha);
                #include <colorspace_fragment>
            }`,
    });
    scene.add(new Points(dots, dotMaterial));

    const camera = new PerspectiveCamera(34, 1, 0.01, 50);
    const content = stage.querySelector(".first_view_content");
    const count = stage.querySelector(".globe_count");
    const countNumber = count && count.querySelector(".globe_count_number");
    const label = stage.querySelector(".flyin_label");
    const londonPoint = onGlobe(LONDON[0], LONDON[1], 1.002);

    let width = 0, height = 0, narrow = false, ratio = 1;
    function resize() {
        width = stage.clientWidth;
        height = stage.clientHeight;
        narrow = width / height < 0.9;
        ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (width * height)));
        renderer.setPixelRatio(ratio);
        renderer.setSize(width, height, false);
        dotMaterial.uniforms.uSize.value = (narrow ? 6 : 7) * ratio;
    }

    function frameView(p) {
        // The globe sits right of the text on wide screens and above it on narrow ones, then
        // moves to the middle once the text has gone
        const m = narrow ? MathUtils.smoothstep(p, 0.6, 0.82) : MathUtils.smoothstep(p, 0.15, 0.6);
        const fx = MathUtils.lerp(narrow ? 0.5 : 0.8, 0.5, m);
        const fy = MathUtils.lerp(narrow ? 0.27 : 0.48, 0.5, m);
        const fullW = 2 * Math.max(fx, 1 - fx) * width;
        const fullH = 2 * Math.max(fy, 1 - fy) * height;
        const baseFov = narrow ? 50 : 34;
        camera.fov = 2 * MathUtils.radToDeg(Math.atan(Math.tan(MathUtils.degToRad(baseFov / 2)) * fullH / height));
        camera.aspect = fullW / fullH;
        camera.setViewOffset(fullW, fullH, fullW / 2 - fx * width, fullH / 2 - fy * height, width, height);
        camera.updateProjectionMatrix();
    }

    function progress() {
        const rect = section.getBoundingClientRect();
        const travel = section.offsetHeight - stage.offsetHeight;
        if (travel <= 0) return 0;
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        return MathUtils.clamp((top - rect.top) / travel, 0, 1);
    }

    const projected = new Vector3();
    let shownCount = -1;
    function draw(p) {
        frameView(p);
        const c = camAt(p);
        // The globe starts further off, clear of the opening text (beside it on wide screens,
        // above it on narrow ones), and comes closer as you scroll
        const off = narrow
            ? MathUtils.lerp(1.55, 1.18, MathUtils.smoothstep(p, 0.55, 1))
            : MathUtils.lerp(1.24, 1, MathUtils.smoothstep(p, 0.02, 0.5));
        onGlobe(c.lat, c.lon, c.d * off, camera.position);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();

        uniforms.uSunView.value.copy(sunWorld).transformDirection(camera.matrixWorldInverse);
        const sweep = sweepAt(p);
        uniforms.uSweep.value = sweep;
        renderer.render(scene, camera);

        // The opening text lifts away first
        const away = MathUtils.clamp((p - 0.04) / 0.2, 0, 1);
        content.style.opacity = String(1 - away);
        content.style.transform = away ? `translateY(${-4 * away}rem)` : "";
        content.style.visibility = away >= 1 ? "hidden" : "";

        // Then the count of countries, which rises as they light up
        if (count) {
            const lit = COUNTRIES.filter(([, , lon]) => lon >= sweep).length;
            if (lit !== shownCount) {
                countNumber.textContent = String(Math.max(lit, 1));
                shownCount = lit;
            }
            const inOut = MathUtils.clamp((p - 0.2) / 0.08, 0, 1) * MathUtils.clamp((0.66 - p) / 0.08, 0, 1);
            count.style.opacity = String(inOut);
            count.style.transform = `translateY(${(1 - inOut) * 1.5}rem)`;
        }

        // Last, the label over London
        if (label) {
            projected.copy(londonPoint).project(camera);
            const x = (projected.x + 1) / 2 * width;
            const y = (1 - projected.y) / 2 * height;
            label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            label.style.opacity = String(MathUtils.clamp((p - 0.66) / 0.1, 0, 1));
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

    Promise.all([
        load(small ? "/img/globe/earth_day_2k.jpg" : "/img/globe/earth_day_4k.jpg"),
        load("/img/globe/earth_night.jpg"),
        load("/img/globe/earth_relief.jpg", false),
        load("/img/globe/earth_masks.png", false),
    ]).then(([day, night, relief, masks]) => {
        if (!day || !night || !masks) {
            root.classList.remove("flyin_on");
            return;
        }
        material.map = day;
        material.bumpMap = relief;
        material.specularMap = masks;
        uniforms.uNight.value = night;
        uniforms.uMasks.value = masks;
        material.needsUpdate = true;

        resize();
        draw(current);
        stage.classList.add("flyin_drawn");

        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", () => {
            resize();
            draw(current);
            request();
        });
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
