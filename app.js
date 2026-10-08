/* ============================================================
   The Palace Luxury Resort — app.js
   The resort image IS the 3D world, shown top-down contain-fit:
   the ENTIRE image is always visible inside 100vw × 100vh
   (sea-colored letterbox when window aspect ≠ image aspect).
     map    — perfectly static. No drag, no zoom, no motion.
              Only the location labels are interactive.
     detail — click a point: camera dives smoothly to it in 2D
              top-down. There you may DRAG to look around that
              specific area (bounded to it) and wheel to zoom.
     back   — Esc / ← Back to map returns to the still view.
     pano   — click "Beach Club" or "Restaurant": cloud banks sweep
              in from the left & right, the camera skydives out of the
              sky into a 360° panorama, flares and lands softly on the
              spot, then slowly looks around. Esc / ← Back to map
              returns.
     villa  — click "Villas": the Beach-Club skydive (clouds →
              free-fall → land), then a walk-through built from the
              villas/frames/* sequence: DIRECTION POINTS play the
              walk point-to-point like Google Maps, a big navigation
              arrow shows the way, and door points swing OPEN as you
              pass. Esc / ← Back to map returns.
   Textures: resort-new.webp (map) · beach/beach_panorama.jpg &
   restaurant/restaurant.png (360°) · villas/frames/* (walk-through
   sequence) · clouds/cloud-*.png (optional real cloud photos;
   painted cumulus is generated when absent).
   ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ============================================================
   1. Locations — (u,v) measured on resort-new.webp
   ============================================================ */
const LOCATIONS = [
  { id: "villas",      name: "Villas",          color: "#1b4f9c", icon: "🏠", u: 0.350, v: 0.190, dist: 26, walk: true, blurb: "Pool-tucked garden residences.",         highlights: "Private pools · Gardens", nearby: "Family Cottages" },
  { id: "spa",         name: "Spa & Wellness",  color: "#9c27b0", icon: "🧘", u: 0.550, v: 0.170, dist: 26, blurb: "Steam, stillness and slow mornings.",    highlights: "Rituals · Tea house",     nearby: "Fitness Center" },
  { id: "fitness",     name: "Fitness Center",  color: "#00897b", icon: "🏋️", u: 0.695, v: 0.160, dist: 26, blurb: "Strength and cardio above the bay.",     highlights: "Trainers · Classes",      nearby: "Parking" },
  { id: "parking",     name: "Parking",         color: "#546e7a", icon: "🅿️", u: 0.870, v: 0.210, dist: 30, blurb: "Valet and guest parking.",               highlights: "Valet · EV charging",     nearby: "Main Entrance" },
  { id: "cottages",    name: "Family Cottages", color: "#e65100", icon: "🏡", u: 0.095, v: 0.280, dist: 26, blurb: "Roomy cottages for the whole crew.",     highlights: "2–3 bedrooms · Lawns",    nearby: "Playground" },
  { id: "playground",  name: "Playground",      color: "#f9a825", icon: "🛝", u: 0.226, v: 0.325, dist: 24, blurb: "Slides and shade for small guests.",     highlights: "Zip line · Sandpit",      nearby: "Tennis Court" },
  { id: "tennis",      name: "Tennis Court",    color: "#2e7d32", icon: "🎾", u: 0.350, v: 0.370, dist: 24, blurb: "Floodlit hard court in the palms.",      highlights: "Night play · Coaching",   nearby: "Restaurant" },
  { id: "restaurant",  name: "Restaurant",      color: "#c62828", icon: "🍴", u: 0.565, v: 0.285, dist: 26, pano: true, blurb: "Island produce, open-fire kitchen.",     highlights: "Chef's table · Terrace",  nearby: "Swimming Pool" },
  { id: "entrance",    name: "Main Entrance",   color: "#1565c0", icon: "🏛️", u: 0.945, v: 0.330, dist: 26, blurb: "Arrival pavilion and porte-cochère.",    highlights: "Valet · Concierge",       nearby: "Parking" },
  { id: "conference",  name: "Conference Hall", color: "#455a64", icon: "💼", u: 0.770, v: 0.370, dist: 26, blurb: "Events with a sea-view foyer.",          highlights: "Ballroom · Breakouts",    nearby: "Bar & Lounge" },
  { id: "deluxe",      name: "Deluxe Rooms",    color: "#6a1b9a", icon: "🛏️", u: 0.140, v: 0.485, dist: 26, blurb: "Ocean-facing rooms over the green.",     highlights: "Balconies · Suites",      nearby: "Garden Rooms" },
  { id: "garden",      name: "Garden Rooms",    color: "#558b2f", icon: "🌿", u: 0.295, v: 0.545, dist: 24, blurb: "Ground-floor rooms into the ferns.",     highlights: "Patios · Hammocks",       nearby: "Lake View Rooms" },
  { id: "swimpool",    name: "Swimming Pool",   color: "#0277bd", icon: "🏊", u: 0.510, v: 0.430, dist: 26, blurb: "The lagoon at the heart of it all.",     highlights: "Swim-up bar · Cabanas",   nearby: "Bar & Lounge" },
  { id: "bar",         name: "Bar & Lounge",    color: "#ad1457", icon: "🍸", u: 0.610, v: 0.470, dist: 24, blurb: "Sunset cocktails by the water.",         highlights: "Craft cocktails · DJ",    nearby: "Beach Club" },
  { id: "lakeview",    name: "Lake View Rooms", color: "#01579b", icon: "🌅", u: 0.400, v: 0.590, dist: 26, blurb: "Suites on the mirror lake.",             highlights: "Decks · Breakfast",       nearby: "Private Beach" },
  { id: "indoor",      name: "Indoor Games",    color: "#00838f", icon: "🎮", u: 0.880, v: 0.490, dist: 24, blurb: "Billiards, bowling and board games.",    highlights: "Arcade · Lounge",         nearby: "Conference Hall" },
  { id: "beach",       name: "Private Beach",   color: "#00acc1", icon: "⛱️", u: 0.125, v: 0.650, dist: 30, blurb: "White sand and rowed umbrellas.",        highlights: "Cabanas · Kayaks",        nearby: "Water Sports" },
  { id: "beachclub",   name: "Beach Club",      color: "#0097a7", icon: "🏖️", u: 0.660, v: 0.660, dist: 26, pano: true, blurb: "Grilled catch and cold drinks on sand.", highlights: "Day beds · Grill",        nearby: "Water Sports" },
  { id: "watersports", name: "Water Sports",    color: "#0288d1", icon: "🚤", u: 0.655, v: 0.855, dist: 28, blurb: "Kayaks, boards and a jetty for two.",    highlights: "Jet ski · Parasail",      nearby: "Beach Club" },
];



/* ============================================================
   2. Renderer / scene / camera
   ============================================================ */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // photo colors stay exact

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2e8ba8); // sea tone (only visible past edges)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 1200);
camera.up.set(0, 0, -1); // image "up" = screen up in top view

/* ============================================================
   3. Loading overlay
   ============================================================ */
const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loader-fill");
const loaderStatus = document.getElementById("loader-status");
function setLoad(pct, msg) {
  if (pct !== null) loaderFill.style.width = `${Math.round(pct)}%`;
  if (msg) loaderStatus.textContent = msg;
}

/* ============================================================
   4. The world: one large textured plane (the resort image)
   ============================================================ */
const PLANE_W = 160;        // world width; depth follows image aspect
let PLANE_D = 106;          // set from the loaded texture
let planeMesh = null;
let oceanMesh = null;
let planeTex = null;        // texture created once, reused across rebuilds
let sourceCanvasRef = null; // kept for aspect-correct rebuilds on resize

/* Load the highest-res source image available (same-origin). */
function loadResortImage() {
  // Label-free image first; older files as fallbacks
  const sources = ["./resort-new.webp", "./resort.png", "./resort.webp"];
  return new Promise((resolve, reject) => {
    const tryNext = (i) => {
      if (i >= sources.length) return reject(new Error("no image found"));
      setLoad(30 + i * 10, `Loading resort imagery (${sources[i].split("/").pop()})`);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => tryNext(i + 1);
      img.src = sources[i];
    };
    tryNext(0);
  });
}

/* ------------------------------------------------------------
   Image pass-through. resort-new.webp ships WITHOUT baked labels,
   so no pixel surgery is needed. (The earlier canvas cleaning for
   resort.png/webp is retired — see git history if you re-introduce
   the labeled image.)
   ------------------------------------------------------------ */
function cleanImage(img) {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  cv.getContext("2d").drawImage(img, 0, 0);
  return cv;
}

function buildWorld(sourceCanvas) {
  const tex = new THREE.CanvasTexture(sourceCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (renderer.capabilities.isWebGL2) {
    tex.generateMipmaps = true;               // crisp when zoomed out
    tex.minFilter = THREE.LinearMipmapLinearFilter;
  } else {
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
  }
  planeTex = tex;
  sourceCanvasRef = sourceCanvas;

  buildPlane();

  // open-sea backdrop visible only past the plane edges (during zoom-out caps)
  oceanMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshBasicMaterial({ color: 0x2b829e })
  );
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.y = -0.5;
  scene.add(oceanMesh);
}

/* (Re)build the plane so its aspect EXACTLY matches the window.
   The image stretches to fill 100vw × 100vh — no letterbox, no crop,
   every place visible. Rebuilt on resize. */
function buildPlane() {
  PLANE_D = PLANE_W / (innerWidth / innerHeight); // plane matches window aspect

  if (planeMesh) {
    scene.remove(planeMesh);
    planeMesh.geometry.dispose();
  }
  const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_D);
  const mat = new THREE.MeshBasicMaterial({ map: planeTex }); // unlit → exact colors
  planeMesh = new THREE.Mesh(geo, mat);
  planeMesh.rotation.x = -Math.PI / 2; // photo top (-Z) away from viewer
  scene.add(planeMesh);
}

/* Image (u,v) → world anchor on the plane */
function anchorFromUV(u, v) {
  return new THREE.Vector3((u - 0.5) * PLANE_W, 0.25, (v - 0.5) * PLANE_D);
}

/* Default view: top-down, plane aspect == window aspect ⇒ the image
   fills the viewport edge-to-edge with NO cropping and NO letterbox. */
function fitCameraHeight() {
  const camAspect = innerWidth / innerHeight;
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const h = PLANE_W / (2 * halfTan * camAspect); // plane width == viewport width
  return h * 0.999; // hair of overfill kills any rounding slivers at the edges
}
function snapToMapView() {
  camera.position.set(0, fitCameraHeight(), 0);
  camera.lookAt(0, 0, 0);
}

/* ------------------------------------------------------------
   Edge-aware framing. The camera's ground footprint must stay ON
   the image at every height, so no zoom or pan can ever reveal the
   void past its edges. Spots near an edge (Main Entrance, etc.)
   therefore zoom DEEPER while hugging the edge — never centering
   with empty space beside them.
   ------------------------------------------------------------ */
const _halfTanStatic = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
function groundHalfExtent(h) {
  return {
    halfH: h * _halfTanStatic,                       // ground half-extent (Z)
    halfW: h * _halfTanStatic * (innerWidth / innerHeight), // ground half-extent (X)
  };
}

/* Highest camera height that still keeps the image covering the
   viewport when focused at world point (x, z). The closer the point
   is to an image edge, the lower the cap; interior points keep the
   requested height. (Coverage needs halfW(h) ≤ edgeDistX, and
   halfW grows linearly with h, so each cap is linear too.) */
function maxHeightForFocus(x, z) {
  const { halfW, halfH } = groundHalfExtent(1); // half-extent per unit height
  const capX = (PLANE_W / 2 - Math.abs(x)) / halfW;
  const capZ = (PLANE_D / 2 - Math.abs(z)) / halfH;
  return Math.max(6, Math.min(fitCameraHeight(), capX, capZ)) * 0.999;
}

/* Keep a focus point inside the image for a camera at height h. */
function clampFocusPoint(x, z, h) {
  const { halfW, halfH } = groundHalfExtent(h);
  const limX = Math.max(0, PLANE_W / 2 - halfW);
  const limZ = Math.max(0, PLANE_D / 2 - halfH);
  return {
    x: THREE.MathUtils.clamp(x, -limX, limX),
    z: THREE.MathUtils.clamp(z, -limZ, limZ),
  };
}

/* ============================================================
   5. Pins — always-visible name pills (same style as the image)
   ============================================================ */
const pinsLayer = document.getElementById("pins");
const pinMap = new Map(); // id -> { el, anchor }
const _pp = new THREE.Vector3();

function buildPins() {
  LOCATIONS.forEach((loc) => {
    const el = document.createElement("button");
    el.className = "pin";
    el.style.setProperty("--pin-color", loc.color);
    el.innerHTML = `
      <span class="pin-badge">${loc.icon}</span>
      <span class="pin-pill">${loc.name}</span>`;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (loc.walk) enterVilla(loc);            // video walk-through
      else if (loc.pano) enterPano(loc);        // 360° skydive view
      else enterDetail(loc.id);
    });
    pinsLayer.appendChild(el);
    pinMap.set(loc.id, { el, anchor: anchorFromUV(loc.u, loc.v) });
  });
}

function updatePins() {
  if (!planeMesh) return;
  for (const { el, anchor } of pinMap.values()) {
    // anchors are ALREADY world-space (plane never moves) — project directly.
    const proj = _pp.copy(anchor).project(camera);
    const behind = proj.z > 1;
    const x = (proj.x * 0.5 + 0.5) * innerWidth;
    const y = (-proj.y * 0.5 + 0.5) * innerHeight;
    // badge is 34px wide → shift left half of it so the tail tip sits on the spot
    el.style.transform = `translate(${x - 17}px, ${y - 6}px) translateY(-100%)`;
    el.style.opacity = behind ? "0" : "";
    el.style.pointerEvents = behind ? "none" : "auto";
  }
}

/* ============================================================
   6. Modes — map is FROZEN; detail unlocks zoom + drag
   ============================================================ */
const detailEl = document.getElementById("detail");
const detailEyebrow = document.getElementById("detail-eyebrow");
const detailName = document.getElementById("detail-name");
const detailDesc = document.getElementById("detail-desc");
const detailHighlights = document.getElementById("detail-highlights");
const detailNearby = document.getElementById("detail-nearby");
const detailClose = document.getElementById("detail-close");
const btnNext = document.getElementById("btn-next");
const btnTour = document.getElementById("btn-tour");
const tourFill = document.getElementById("tour-fill");

let mode = "map";          // "map" | "detail" | "tour" | "pano" | "diving"
let controls = null;
let activeTween = null;
let detailId = null;
let autoTour = null;

const _look = new THREE.Vector3(0, 0, 0);

function killTween() {
  if (activeTween) { activeTween.kill(); activeTween = null; }
}

function ensureControls() {
  if (!controls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = false;  // 2D only — the image must stay face-on
    controls.enableZoom = true;     // wheel dollies straight down/up
    controls.zoomToCursor = false;
    // left-drag = PAN (rotate is off, so remap the primary button)
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null };
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    controls.minDistance = 8;       // close zoom on the area
    controls.maxDistance = fitCameraHeight(); // zoom-out ends at the full map view
    // up = (0,0,-1) ⇒ straight above the target is polar 90°; lock the axis
    controls.minPolarAngle = Math.PI / 2 - 0.001;
    controls.maxPolarAngle = Math.PI / 2 + 0.001;
  }
}

/* ------------------------------------------------------------
   Drag-pan bounds: while exploring a location, panning is clamped
   so the view stays around THAT area. worldRadius is roughly the
   smaller of (distance to nearest other pin, half the view size at
   the hover height) — computed per location from the hover height.
   ------------------------------------------------------------ */
let panBounds = null; // { minX, maxX, minZ, maxZ }

function setPanBoundsFor(loc) {
  const p = anchorFromUV(loc.u, loc.v);
  const h = loc.dist ?? 28;
  // view half-extent on the ground at hover height
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const halfH = h * halfTan;                       // along image height (Z)
  const halfW = halfH * (innerWidth / innerHeight); // along image width (X)
  // don't let the user stray farther than ~60% of one view from the pin
  const reachX = Math.min(halfW * 1.4, PLANE_W * 0.5);
  const reachZ = Math.min(halfH * 1.4, PLANE_D * 0.5);
  panBounds = {
    minX: p.x - reachX, maxX: p.x + reachX,
    minZ: p.z - reachZ, maxZ: p.z + reachZ,
  };
}

const _halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2); // (kept for pan-reach math)
let _lastFrameT = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - _lastFrameT) / 1000, 0.05);
  _lastFrameT = now;

  // 360° panorama mode renders its own scene & camera
  if (mode === "pano") {
    updatePano(dt, now);
    renderer.render(panoScene, panoCamera);
    return;
  }
  // mid-skydive: clouds still cover the map → keep rendering it; once the
  // world has swapped (screen fully clouded) → render the pano scene
  if (mode === "diving") {
    if (panoActive && panoSphere && panoSphere.visible) renderer.render(panoScene, panoCamera);
    else renderer.render(scene, camera);
    return;
  }
  // villa walk-through draws itself on the 2D canvas (no THREE render)
  if (mode === "villa") {
    updateVilla(dt);
    return;
  }

  if (controls && controls.enabled) {
    controls.update();
    const t = controls.target;
    let nx = t.x, nz = t.z;

    // 1) area-local drag bounds (stay around the clicked pin)
    if (panBounds) {
      nx = THREE.MathUtils.clamp(nx, panBounds.minX, panBounds.maxX);
      nz = THREE.MathUtils.clamp(nz, panBounds.minZ, panBounds.maxZ);
    }

    // 2) image bounds — the camera's ground footprint must stay ON the
    //    image, so zooming/panning can never reveal the void past its
    //    edges. As the camera rises, the allowed offset shrinks, sliding
    //    the view back to center: max zoom-out == the full map view.
    const clamped = clampFocusPoint(t.x, t.z, camera.position.y);
    const nx0 = clamped.x, nz0 = clamped.z;
    if (nx0 !== t.x || nz0 !== t.z) {
      // move target and camera together — rigid pan, no rotation
      camera.position.x += nx0 - t.x;
      camera.position.z += nz0 - t.z;
      t.x = nx0;
      t.z = nz0;
    }
    // keep the flight system in sync with where the view REALLY is,
    // so the return flight starts from the actual framing (no swing)
    _look.set(t.x, 0, t.z);
  }
  renderer.render(scene, camera);
  updatePins();
});

/** Smooth GSAP camera fly (position + look target). The path is
    clamped continuously so the image always covers the viewport —
    no white/sea gap can flash in mid-flight, and the return flight
    stays glued to the same clamped corridor (no center-first swing). */
function flyTo(pos, target, duration = 1.7, onDone) {
  killTween();
  const startPos = camera.position.clone();
  const startTarget = _look.clone();
  const st = { t: 0 };
  activeTween = gsap.to(st, {
    t: 1,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.position.lerpVectors(startPos, pos, st.t);
      _look.lerpVectors(startTarget, target, st.t);
      // hold the frame on the image for the WHOLE flight
      const cl = clampFocusPoint(_look.x, _look.z, camera.position.y);
      camera.position.x += cl.x - _look.x;
      camera.position.z += cl.z - _look.z;
      _look.set(cl.x, _look.y, cl.z);
      camera.lookAt(_look);
    },
    onComplete: () => {
      if (controls) controls.target.copy(_look); // the CLAMPED final look
      if (onDone) onDone();
    },
  });
}

/* ---------- map mode: frozen still frame ---------- */
function toMap() {
  killTween();
  stopAutoTour();
  mode = "map";
  detailId = null;
  panBounds = null;                         // no drag area outside detail
  detailEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-detail");
  if (controls) {
    controls.enabled = false;               // NO drag / NO zoom on the map
    controls.enablePan = false;
  }
  const h = fitCameraHeight();
  flyTo(new THREE.Vector3(0, h, 0), new THREE.Vector3(0, 0, 0), 1.5, () => {
    camera.position.set(0, h, 0);           // land exactly on the still frame
    camera.lookAt(0, 0, 0);
    _look.set(0, 0, 0);
    if (controls) controls.target.set(0, 0, 0); // perfectly aligned state
    if (controls) controls.enabled = false;
  });
}

/* Detail view: hover straight ABOVE the spot, looking down.
   Zooming just changes the height — the image stays face-on and
   can never vanish, and rotation is disabled so no 3D swing.
   Edge spots: the hover height is lowered so the viewport stays
   filled by the image (the pin hugs the edge instead of centering
   with empty space beside it). */
function detailCamFor(loc) {
  const p = anchorFromUV(loc.u, loc.v);
  const hWanted = loc.dist ?? 28;   // hover height above the place
  const h = Math.min(hWanted, maxHeightForFocus(p.x, p.z));
  return {
    pos: new THREE.Vector3(p.x, h, p.z),
    target: new THREE.Vector3(p.x, 0, p.z),
  };
}

function enterDetail(id) {
  const loc = LOCATIONS.find((l) => l.id === id);
  if (!loc || !planeMesh) return;
  if (mode === "pano" || mode === "diving" || mode === "villa" || panoBusy || villaBusy) return; // 360° flow owns the screen
  killTween();
  stopAutoTour();
  mode = "detail";
  detailId = id;

  detailEyebrow.textContent = "Location";
  detailName.textContent = loc.name;
  detailDesc.textContent = loc.blurb;
  detailHighlights.textContent = loc.highlights;
  detailNearby.textContent = loc.nearby;
  detailEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-detail");
  detailEl.style.setProperty("--pin-color", loc.color);

  ensureControls();
  controls.enabled = false;                 // tween drives; controls after
  setPanBoundsFor(loc);                     // drag stays around THIS area

  const { pos, target } = detailCamFor(loc);
  flyTo(pos, target, 1.9, () => {
    controls.enablePan = true;              // NOW drag-pan + wheel zoom unlock
    controls.enabled = true;
    controls.target.copy(_look);            // the CLAMPED final look
  });
}

function exitDetail() {
  if (mode !== "detail") return;
  toMap();
}

/* ---------- guided tour (optional, button-triggered) ---------- */
function startAutoTour() {
  if (mode === "pano" || mode === "villa" || panoBusy || villaBusy) return;   // don't hijack the 360° / walk views
  killTween();
  mode = "tour";
  detailId = null;
  detailEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-detail");
  document.body.classList.add("tour-mode");
  if (controls) controls.enabled = false;

  const stops = LOCATIONS.filter((l) =>
    ["villas", "swimpool", "lakeview", "beach", "watersports"].includes(l.id)
  );
  const timeline = { p: 0 };
  const total = stops.length;
  autoTour = gsap.to(timeline, {
    p: total,
    duration: total * 5.5,
    ease: "none",
    onUpdate: () => {
      const idx = Math.min(Math.floor(timeline.p), total - 1);
      const frac = timeline.p - idx;
      const a = detailCamFor(stops[idx]);
      const b = detailCamFor(stops[(idx + 1) % total]);
      const e = frac * frac * (3 - 2 * frac);
      camera.position.lerpVectors(a.pos, b.pos, e);
      _look.lerpVectors(a.target, b.target, e);
      // same coverage clamp as flyTo — no ocean sliver mid-tour
      const cl = clampFocusPoint(_look.x, _look.z, camera.position.y);
      camera.position.x += cl.x - _look.x;
      camera.position.z += cl.z - _look.z;
      _look.set(cl.x, _look.y, cl.z);
      camera.lookAt(_look);
      tourFill.style.width = `${(timeline.p / total) * 100}%`;
    },
    onComplete: toMap,
  });
}

function stopAutoTour() {
  if (autoTour) { autoTour.kill(); autoTour = null; }
  document.body.classList.remove("tour-mode");
  tourFill.style.width = "0%";
}

/* ---------- buttons & keys ---------- */
btnTour.addEventListener("click", startAutoTour);
detailClose.addEventListener("click", exitDetail);
const panoBack = document.getElementById("pano-back");
const panoHudEl = document.getElementById("pano-hud");
if (panoBack) panoBack.addEventListener("click", exitPano);
const villaBack = document.getElementById("villa-back");
const villaHudEl = document.getElementById("villa-hud");
if (villaBack) villaBack.addEventListener("click", exitVilla);

function nextLocation() {
  const ids = LOCATIONS.map((l) => l.id);
  const i = ids.indexOf(detailId);
  const next = ids[(i + 1) % ids.length];
  const nextLoc = LOCATIONS.find((l) => l.id === next);
  if (nextLoc?.walk) { enterVilla(nextLoc); return; } // walk-through stop of the tour
  if (nextLoc?.pano) { enterPano(nextLoc); return; } // 360° stop of the tour
  enterDetail(next);
}
btnNext.addEventListener("click", nextLocation);

addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (mode === "pano") exitPano();
    else if (mode === "villa") exitVilla();
    else if (mode === "detail") exitDetail();
  }
  if ((e.key === "t" || e.key === "T") && mode !== "detail" && mode !== "pano" && mode !== "villa" && !panoBusy && !villaBusy) startAutoTour();
  if ((e.key === "m" || e.key === "M") && mode !== "map" && !panoBusy && !villaBusy) {
    if (mode === "pano") exitPano();
    else if (mode === "villa") exitVilla();
    else toMap();
  }
});

/* ---------- resize: rebuild plane to the new aspect, re-frame ---------- */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  panoCamera.aspect = innerWidth / innerHeight;
  panoCamera.updateProjectionMatrix();
  if (villaCanvas.style.display === "block") {
    sizeVillaCanvas();
    drawVillaFrameNow();
  }
  renderer.setSize(innerWidth, innerHeight);
  if (sourceCanvasRef && planeMesh) {
    buildPlane();                            // keep image filling the window
    pinMap.forEach((entry, id) => {
      const loc = LOCATIONS.find((l) => l.id === id);
      if (loc) entry.anchor = anchorFromUV(loc.u, loc.v);
    });
  }
  if (mode === "map" && !activeTween && planeMesh) snapToMapView();
  if (controls) {
    controls.maxDistance = fitCameraHeight();
    if (mode === "detail" && detailId) {
      const loc = LOCATIONS.find((l) => l.id === detailId);
      if (loc) {
        setPanBoundsFor(loc);
        // re-clamp the hover height so the view stays on the image
        const cam = detailCamFor(loc);
        camera.position.x = cam.pos.x;
        camera.position.z = cam.pos.z;
        camera.position.y = Math.min(camera.position.y, cam.pos.y);
        controls.target.set(cam.target.x, 0, cam.target.z);
        _look.copy(cam.target);
        camera.lookAt(_look);
      }
    }
  }
});

/* ============================================================
   7b. 360° panoramas — "Beach Club" / "Restaurant" skydive
   ------------------------------------------------------------
   A second Three.js scene (equirect sphere) in the SAME renderer:
   click Beach Club or Restaurant → cloud banks sweep in from the
   left & right → screen fully clouded → the 360° view fades in HIGH
   above the spot → the camera free-falls — starting staring up at
   the SKY, swinging down to the horizon as the ground rushes up
   (wind shake + FOV rush sell the speed) — then it FLARES like a
   parachute opening: the fall decelerates, the pitch eases to a
   gentle downward glance, and it touches down with a soft, short
   settle. No figure is ever shown; the fall is pure camera. Esc /
   ← Back to map climbs back out.
   ============================================================ */

/* Per-spot panorama config; spots declare `pano: true` in LOCATIONS
   and get an entry in PANO_SPOTS. Every value can be tuned per spot. */
const PANO_SPOTS = {
  beachclub:  { src: "./beach/beach_panorama.jpg" },
  restaurant: { src: "./restaurant/restaurant.png" },
};

const panoSpots = new Map(
  Object.entries(PANO_SPOTS).map(([id, cfg]) => [id, {
    src: cfg.src,
    tex: null,              // decoded texture once loaded
    entryYaw: cfg.entryYaw ?? Math.PI,            // face the sea/sunset
    entryPitch: cfg.entryPitch ?? THREE.MathUtils.degToRad(42),
    landingYaw: cfg.landingYaw ?? (cfg.entryYaw ?? Math.PI), // where the idle drift faces
    viewPitch: cfg.viewPitch ?? THREE.MathUtils.degToRad(-2),
    viewFov: cfg.viewFov ?? 75,
    landingAlt: cfg.landingAlt ?? 1.62,
    fallDur: cfg.fallDur ?? 4.2,
    fallFrom: cfg.fallFrom ?? 340,
  }])
);
let panoSpotId = null;      // which spot is active ("beachclub" | "restaurant")
let panoSpot = null;        // its config object (see panoSpots)
const panoScene = new THREE.Scene();
const panoCamera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1100);

let panoSphere = null;      // the 360° world (shared; texture swapped per spot)
let panoActive = false;     // sphere added to scene
let panoBusy = false;       // skydive/exit transition in flight
let panoTargetZoom = 75;    // wheel-zoom target (FOV degrees)
let panoSpinVel = 0;        // drag inertia, yaw
let panoSpinVelP = 0;       // drag inertia, pitch
let panoAutoT = 0;          // idle auto-look clock

/* Look state — yaw wraps, pitch is clamped. All pano code paths
   mutate these through applyPanoLook, never the camera directly. */
const panoLook = { yaw: 0, pitch: 0 };
const PANO_PITCH_LIM = THREE.MathUtils.degToRad(78);

function applyPanoLook() {
  panoLook.yaw = ((panoLook.yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  panoLook.pitch = THREE.MathUtils.clamp(panoLook.pitch, -PANO_PITCH_LIM, PANO_PITCH_LIM);
  camEuler.set(panoLook.pitch, panoLook.yaw, 0, "YXZ");
  panoCamera.quaternion.setFromEuler(camEuler);
}

/* Sphere with the equirect image on the INSIDE. X flipped so the
   image isn't mirrored (official three.js pano recipe). The negative
   scale reverses triangle winding, so the DEFAULT FrontSide material
   shows the inner surface. Do NOT add side: BackSide on top of the
   flip — it culls every triangle and renders a black screen. */
function buildPanoScene(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(500, 72, 44);
  geo.scale(-1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ map: texture });
  panoSphere = new THREE.Mesh(geo, mat);
  panoSphere.visible = false;
  panoScene.add(panoSphere);
  return panoSphere;
}

/* Swap the panorama texture on the shared sphere (per spot). The old
   texture is NOT disposed — each spot's texture is cached on its spot
   config and reused across visits. */
function setPanoTexture(texture) {
  panoSphere.material.map = texture;
  panoSphere.material.needsUpdate = true;
}

/* GPUs cap texture size (often 8192 or 16384) — a 16K equirect JPEG
   would silently fail to upload and render black. Downscale if needed. */
function preparePanoTexture(tex) {
  const max = renderer.capabilities.maxTextureSize || 8192;
  const img = tex.image;
  if (img && img.width > max) {
    const cv = document.createElement("canvas");
    cv.width = max;
    cv.height = Math.max(2, Math.round(img.height * (max / img.width)));
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    const t2 = new THREE.CanvasTexture(cv);
    tex.dispose();
    t2.colorSpace = THREE.SRGBColorSpace;
    t2.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t2;
  }
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function loadPanoTexture(url) {
  return new Promise((resolve, reject) => {
    const l = new THREE.TextureLoader();
    l.setCrossOrigin("anonymous");
    l.load(url, (tex) => resolve(preparePanoTexture(tex)), undefined, reject);
  });
}

/* ---------- pointer look (drag to look around, with inertia) ---------- */
let panoDragging = false;
let lastPX = 0, lastPY = 0;

function onPanoDown(e) {
  if (!e.isPrimary) return;           // ignore second finger / pen barrel
  panoDragging = true; lastPX = e.clientX; lastPY = e.clientY;
}
function onPanoMove(e) {
  if (!panoDragging || mode !== "pano" || !e.isPrimary) return;
  const dx = e.clientX - lastPX, dy = e.clientY - lastPY;
  lastPX = e.clientX; lastPY = e.clientY;
  const k = (panoCamera.fov / innerHeight) * (Math.PI / 180) * 1.9;
  // image follows the finger (Pannellum / Street-View convention):
  // drag right → the scene slides right → you end up looking left
  panoLook.yaw += dx * k;
  panoLook.pitch += dy * k;
  panoSpinVel = dx * k * 34;
  panoSpinVelP = dy * k * 34;
  panoAutoT = 0;                    // user grabbed → pause the idle drift
  applyPanoLook();
}
function onPanoUp() { panoDragging = false; }
function onPanoWheel(e) {
  if (mode !== "pano") return;
  e.preventDefault();
  panoTargetZoom = THREE.MathUtils.clamp(panoTargetZoom + Math.sign(e.deltaY) * 4, 42, 85);
}

function setPanoListeners(on) {
  const c = renderer.domElement;
  if (on) {
    c.addEventListener("pointerdown", onPanoDown);
    addEventListener("pointermove", onPanoMove);
    addEventListener("pointerup", onPanoUp);
    c.addEventListener("wheel", onPanoWheel, { passive: false });
  } else {
    c.removeEventListener("pointerdown", onPanoDown);
    removeEventListener("pointermove", onPanoMove);
    removeEventListener("pointerup", onPanoUp);
    c.removeEventListener("wheel", onPanoWheel);
  }
}

/* Per-frame pano update: drag inertia → idle drift → zoom easing. */
function updatePano(dt, now) {
  if (!panoActive) return;

  if (!panoBusy && !panoDragging) {
    // release inertia decays smoothly, then the idle drift takes over
    if (Math.abs(panoSpinVel) > 0.0001 || Math.abs(panoSpinVelP) > 0.0001) {
      panoLook.yaw += panoSpinVel * dt;
      panoLook.pitch += panoSpinVelP * dt;
      const d = Math.pow(0.02, dt); // exp decay ≈ 0.02^t
      panoSpinVel *= d; panoSpinVelP *= d;
      if (Math.abs(panoSpinVel) < 0.0001) panoSpinVel = 0;
      if (Math.abs(panoSpinVelP) < 0.0001) panoSpinVelP = 0;
    } else {
      panoAutoT += dt;
      if (panoAutoT > 3.5) {
        const w = Math.sin(now * 0.00012);
        panoLook.yaw += dt * 0.03 * (0.6 + 0.4 * Math.abs(w));
        panoLook.pitch += (Math.sin(now * 0.00009) * 0.06 - panoLook.pitch) * dt * 0.12;
      }
    }
    applyPanoLook();
  }

  panoCamera.fov += (panoTargetZoom - panoCamera.fov) * (1 - Math.pow(0.001, dt));
  panoCamera.updateProjectionMatrix();
}

/* ---------- DOM cloud banks (left & right sweep) ----------
   Real cloud PHOTOS from ./clouds/cloud-1..4.png when present; a rich
   painted-cumulus SVG (inline data URI) is generated as the fallback so
   the sweep always looks like actual clouds, never flat ellipses. */
const cloudBanks = [];
(function initClouds() {
  const layer = document.createElement("div");
  layer.id = "cloud-layer";
  layer.setAttribute("aria-hidden", "true");

  // Painted cumulus fallback (inline SVG data URI) — puffy multi-lobe
  // tops, soft shaded bases, like a photo of a cloud bank.
  const puff = (cx, cy, rx, ry, o = 1) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" fill-opacity="${o}"/>`;
  const cloudSVG = (flip) => {
    const puffs = [
      [150, 190, 130, 92], [330, 130, 165, 112], [540, 175, 150, 100],
      [720, 120, 175, 118], [930, 180, 160, 104], [1090, 145, 130, 92],
      [420, 235, 190, 86], [800, 240, 205, 88],
    ];
    const body = puffs.map(([cx, cy, rx, ry]) =>
      puff(cx, cy, rx, ry, 0.98) +
      puff(cx + rx * 0.30, cy + ry * 0.42, rx * 0.55, ry * 0.50, 0.5)
    ).join("");
    const base = [
      [200, 300, 150, 60], [560, 315, 190, 66], [950, 300, 165, 62],
    ].map(([cx, cy, rx, ry]) => puff(cx, cy, rx, ry, 0.94)).join("");
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 360" preserveAspectRatio="none">` +
      `<g ${flip ? 'transform="translate(1280,0) scale(-1,1)"' : ""}>${body}${base}</g></svg>`
    )}`;
  };
  const svgL = cloudSVG(false);
  const svgR = cloudSVG(true);

  // 8 banks: 4 rush in from the left, 4 mirrored from the right.
  // src: real photo (clouds/cloud-N.png) if present, painted cumulus
  // (clouds/cloud-N.svg) otherwise; inline data URI as final fallback.
  const defs = [
    { side: "left",  top: "-12%", delay: 0.00, dur: 0.72, scale: 1.35, n: 1 },
    { side: "left",  top: "22%",  delay: 0.10, dur: 0.80, scale: 1.10, n: 2 },
    { side: "left",  top: "56%",  delay: 0.04, dur: 0.68, scale: 1.55, n: 3 },
    { side: "left",  top: "84%",  delay: 0.16, dur: 0.84, scale: 1.20, n: 4 },
    { side: "right", top: "-8%",  delay: 0.07, dur: 0.76, scale: 1.45, n: 1 },
    { side: "right", top: "26%",  delay: 0.00, dur: 0.70, scale: 1.15, n: 2 },
    { side: "right", top: "60%",  delay: 0.12, dur: 0.82, scale: 1.30, n: 3 },
    { side: "right", top: "88%",  delay: 0.03, dur: 0.66, scale: 1.60, n: 4 },
  ];
  defs.forEach((d) => {
    const el = document.createElement("div");
    el.className = `cloud-bank cloud-${d.side}`;
    el.style.top = d.top;
    el.style.setProperty("--cb-scale", d.scale);
    el.style.backgroundImage = `url("${d.side === "left" ? svgL : svgR}")`;
    layer.appendChild(el);
    cloudBanks.push({ el, delay: d.delay, dur: d.dur, side: d.side, n: d.n });
  });
  document.body.appendChild(layer);

  // Promote each bank to a real image (silent on 404: the painted
  // cumulus stays). Prefer clouds/cloud-N.png (your own photos),
  // then clouds/cloud-N.svg (bundled painted clouds).
  cloudBanks.forEach(({ el, n }) => {
    const tryLoad = (candidates) => {
      if (!candidates.length) return;
      const probe = new Image();
      probe.onload = () => { el.style.backgroundImage = `url("${candidates[0]}")`; };
      probe.onerror = () => tryLoad(candidates.slice(1));
      probe.src = candidates[0];
    };
    tryLoad([`./clouds/cloud-${n}.png`, `./clouds/cloud-${n}.svg`]);
  });
})();

function cloudsIn() {
  cloudBanks.forEach(({ el, delay, dur }) => {
    // start offscreen on their own side, sweep to the middle, cover all
    const off = el.classList.contains("cloud-left") ? "translateX(-112%)" : "translateX(112%)";
    el.style.transition = "none";
    el.style.transform = `${off} scaleX(var(--cb-scale, 1))`;
    el.style.opacity = "1";
    void el.offsetWidth; // flush so the transition below always plays
    el.style.transition = `transform ${dur}s cubic-bezier(.6,.05,.35,1) ${delay}s, opacity .4s ease ${delay}s`;
    el.style.transform = "translateX(0) scaleX(var(--cb-scale, 1))";
  });
}

function cloudsOut() {
  cloudBanks.forEach(({ el, delay, dur }) => {
    // part back toward their own sides, revealing the pano/map
    const off = el.classList.contains("cloud-left") ? "translateX(-112%)" : "translateX(112%)";
    el.style.transition = `transform ${dur}s cubic-bezier(.55,.1,.3,1) ${delay}s, opacity .5s ease ${delay + 0.1}s`;
    el.style.transform = `${off} scaleX(var(--cb-scale, 1))`;
    el.style.opacity = "0";
  });
}

/* ---------- the skydive timeline (GSAP) ---------- */
const camEuler = new THREE.Euler(0, 0, 0, "YXZ");
const panoFlyState = { yaw: 0, pitch: 0.73, fov: 100, alt: 340, shake: 0, roll: 0 };

function enterPano(loc) {
  if (!planeMesh || panoBusy || villaBusy || mode === "pano") return;
  const spot = panoSpots.get(loc?.id);
  if (!spot) return;                        // unknown pano spot — ignore
  panoSpotId = loc.id;
  panoSpot = spot;
  panoBusy = true;
  killTween();
  stopAutoTour();

  const begin = () => {
    mode = "diving";                        // stops pins/HUD/map input
    if (controls) { controls.enabled = false; controls.enablePan = false; }
    detailEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-detail");
    document.body.classList.add("is-pano"); // hides pins + HUD via CSS

    const ready = (tex) => {
      if (!panoSphere) buildPanoScene(tex);
      else setPanoTexture(tex);
      spot.tex = tex;

      panoSphere.visible = false;
      panoActive = true;

      /* Phase 1 — clouds swallow the map (0.95s) */
      cloudsIn();

      /* Phase 2 — swap worlds behind the clouds, start high + falling */
      gsap.delayedCall(0.85, () => {
        panoLook.yaw = spot.entryYaw;
        panoLook.pitch = spot.entryPitch;
        applyPanoLook();
        panoSphere.visible = true;
        panoCamera.fov = 100;
        panoTargetZoom = spot.viewFov;
        applyPanoLook();
      });

      /* Phase 3 — clouds part left & right, revealing the sky-high pano */
      gsap.delayedCall(1.15, () => cloudsOut());

      /* Phase 4 — the fall: accelerate like gravity (wind shake + FOV
         rush), then FLARE — the last stretch decelerates like a chute
         opening. NO figure is ever shown — the fall is pure camera. */
      const FLARE = 0.30;                   // last 30% of the fall = flare
      panoFlyState.yaw = spot.entryYaw;
      panoFlyState.pitch = spot.entryPitch;
      panoFlyState.fov = 100;
      panoFlyState.alt = spot.fallFrom;
      panoFlyState.shake = 0;
      panoFlyState.roll = 0;

      // Altitude: smoothstep (accelerate from rest, fastest mid-fall,
      // then progressive deceleration to touchdown) — the natural
      // "chute opens" profile, continuous in speed so there is no jolt.
      gsap.to(panoFlyState, {
        alt: 2.2,
        duration: spot.fallDur,
        ease: (p) => p * p * (3 - 2 * p),
        onUpdate: applyDiveCamera,
        onComplete: landSequence,
      });

      // FOV rush: 100 → viewFov (widening = speed, then settle)
      gsap.to(panoFlyState, { fov: spot.viewFov, duration: spot.fallDur, ease: "power1.inOut" });
      // sky → ground: staring 42° up, swinging to a −24° glance by flare
      // start, then easing gently to the landing view — no abrupt snap
      gsap.to(panoFlyState, {
        pitch: THREE.MathUtils.degToRad(-24),
        duration: spot.fallDur * (1 - FLARE),
        ease: "power1.inOut",
      });
      gsap.to(panoFlyState, {
        pitch: spot.viewPitch,
        duration: spot.fallDur * FLARE,
        ease: "power2.out",
        delay: spot.fallDur * (1 - FLARE),
      });
      // gentle sway + wind shake rising mid-fall, gone on landing
      gsap.fromTo(panoFlyState, { shake: 0 },
        { shake: 1, duration: spot.fallDur * 0.5, ease: "power1.in", delay: spot.fallDur * 0.18 });
      gsap.fromTo(panoFlyState, { roll: 0 },
        { roll: THREE.MathUtils.degToRad(7), duration: spot.fallDur * 0.45, ease: "sine.inOut", yoyo: true, repeat: 1 });
    };

    (spot.tex
      ? Promise.resolve(spot.tex)
      : loadPanoTexture(spot.src).then((tex) => { spot.tex = tex; return tex; })
    ).then(ready).catch(() => {
      panoBusy = false;
      mode = "map";                     // never strand the user in diving
      document.body.classList.remove("is-pano");
      cloudsOut();
      snapToMapView();
      panoToast("Panorama not found: " + spot.src);
    });
  };

  // Pre-dive dive-in: zoom toward the PIN — the clicked place stays
  // centered while the world scales up — and go deeper than before so
  // the pull-in reads clearly before the clouds take over.
  const p = (pinMap.get(loc.id)?.anchor) ?? anchorFromUV(loc.u, loc.v);
  const endPos = new THREE.Vector3(p.x, Math.max(6, fitCameraHeight() * 0.34), p.z);
  const endTgt = new THREE.Vector3(p.x, 0, p.z);
  const startPos = camera.position.clone();
  const startTgt = _look.clone();
  const st = { t: 0 };
  killTween();
  activeTween = gsap.to(st, {
    t: 1,
    duration: 0.7,
    ease: "power2.in",
    onUpdate: () => {
      camera.position.lerpVectors(startPos, endPos, st.t);
      _look.lerpVectors(startTgt, endTgt, st.t);
      // keep the image covering the viewport for the whole dive-in
      const cl = clampFocusPoint(_look.x, _look.z, camera.position.y);
      camera.position.x += cl.x - _look.x;
      camera.position.z += cl.z - _look.z;
      _look.set(cl.x, _look.y, cl.z);
      camera.lookAt(_look);
      updatePins();
    },
    onComplete: begin,
  });
}

/* during the fall the camera altitude drives position + shake; look
   angles are tweened on panoFlyState — mirror them onto panoLook */
function applyDiveCamera() {
  const s = panoFlyState;
  const t = performance.now() * 0.001;
  const sh = s.shake;
  const yawJit = Math.sin(t * 21.0) * 0.010 * sh + Math.sin(t * 7.3) * 0.004 * sh;
  const pitJit = Math.sin(t * 17.7) * 0.009 * sh + Math.cos(t * 5.1) * 0.004 * sh;
  panoLook.yaw = s.yaw + yawJit;
  panoLook.pitch = THREE.MathUtils.clamp(s.pitch + pitJit, -PANO_PITCH_LIM, PANO_PITCH_LIM);
  camEuler.set(panoLook.pitch, panoLook.yaw, s.roll, "YXZ");
  panoCamera.quaternion.setFromEuler(camEuler);
  panoCamera.position.set(0, Math.max(s.alt, 1.6), 0.0001);
  panoCamera.fov = s.fov;
  panoCamera.updateProjectionMatrix();
}

/* landed: dust puff, one short soft settle, then hand back to pano
   mode. The flare already killed the speed, so the touchdown is a
   gentle knee-bend — no elastic spring, no jolt. */
function landSequence() {
  puffDust();
  panoCamera.position.y = 2.2;
  gsap.to(panoFlyState, {
    shake: 0,
    roll: 0,
    duration: 0.35,
    ease: "power2.out",
    onUpdate: applyDiveCamera,
  });
  gsap.to(panoCamera.position, {
    keyframes: { y: [2.2, 1.98, 2.2] },
    duration: 0.8,
    delay: 0.35,          // after the shake/roll tween stops driving the camera
    ease: "sine.inOut",
    onComplete: () => {
      panoCamera.position.y = 2.2;
      panoCamera.rotation.set(0, 0, 0);
      panoCamera.quaternion.setFromEuler(new THREE.Euler(panoLook.pitch, panoLook.yaw, 0, "YXZ"));
      panoCamera.fov = panoTargetZoom = panoSpot?.viewFov ?? 75;
      panoSpinVel = panoSpinVelP = 0;
      panoAutoT = 0;
      panoBusy = false;                 // dive fully done — pano is interactive
      mode = "pano";                    // per-frame updatePano takes over
      setPanoListeners(true);
      panoHudEl?.classList.add("active");
      panoHudEl?.setAttribute("aria-hidden", "false");
    },
  });
}

/* small on-screen notice (e.g. missing panorama image) */
function panoToast(msg) {
  const t = document.createElement("div");
  t.className = "pano-toast";
  t.textContent = msg;
  document.body.appendChild(t);
  gsap.fromTo(t, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35 });
  gsap.to(t, { opacity: 0, duration: 0.5, delay: 3.4, onComplete: () => t.remove() });
}

/* little sand dust that kicks up at touchdown */
function puffDust() {
  const dust = document.createElement("div");
  dust.className = "pano-dust";
  document.body.appendChild(dust);
  gsap.fromTo(dust, { opacity: 0.75, scale: 0.35 }, {
    opacity: 0,
    scale: 2.4,
    duration: 1.1,
    ease: "power2.out",
    onComplete: () => dust.remove(),
  });
}

/* ---------- leaving the 360°: climb back into the clouds → map ---------- */
function exitPano() {
  if (mode !== "pano" || panoBusy) return;
  panoBusy = true;
  setPanoListeners(false);
  document.body.classList.add("is-pano");
  panoHudEl?.classList.remove("active");
  panoHudEl?.setAttribute("aria-hidden", "true");
  panoFlyState.alt = panoCamera.position.y;  // lift off from the exact height
  panoFlyState.fov = panoCamera.fov;
  panoTargetZoom = 95;             // keep updatePano's FOV easing in sync

  // camera pulls up fast — "lifting off" from the spot
  gsap.to(panoFlyState, {
    alt: 300,
    fov: 95,
    shake: 0,
    roll: 0,
    duration: 1.05,
    ease: "power2.in",
    onUpdate: () => {
      panoCamera.position.y = panoFlyState.alt;
      panoCamera.fov = panoFlyState.fov;
      panoCamera.updateProjectionMatrix();
      panoLook.pitch = THREE.MathUtils.clamp(
        panoLook.pitch + (THREE.MathUtils.degToRad(-32) - panoLook.pitch) * 0.12,
        -PANO_PITCH_LIM, PANO_PITCH_LIM);
      applyPanoLook();
    },
    onComplete: () => {
      cloudsIn();
      gsap.delayedCall(0.9, () => {
        panoSphere.visible = false;
        panoActive = false;
        mode = "map";
        detailId = null;
        panoSpotId = null;
        panoSpot = null;
        document.body.classList.remove("is-pano");
        snapToMapView();
        _look.set(0, 0, 0);            // return flight starts from the map view
        cloudsOut();
        gsap.delayedCall(1.6, () => { panoBusy = false; });
      });
    },
  });
}

/* ============================================================
   7c. Villas walk-through — frame-sequence Google-Maps tour
   ------------------------------------------------------------
   The extracted frames (villas/frames/frame_0001.jpg … 0775) ARE
   the world. The view is a frame player: "moving" = playing the
   right stretch of frames.
     · arrives with the SAME skydive as Beach Club (clouds →
       free-fall with wind shake → flare → touchdown)
     · DIRECTION POINTS — Google-Maps-style chips with arrows;
       click one and the walk plays point-to-point to it, with a
       big marching navigation arrow + progress bar
     · DOORS — waypoints marked door:true swing OPEN as you pass
     · drag peeks around · wheel zooms the current view
     · Esc / ← Back — clouds return → map
   Tune VILLA_WAYPOINTS to the real footage: `at` = frame index.
   ============================================================ */

const VILLA_FRAME_COUNT = 775;
const VILLA_FRAMES = Array.from({ length: VILLA_FRAME_COUNT }, (_, i) =>
  `./villas/frames/frame_${String(i + 1).padStart(4, "0")}.jpg`);

/* Direction points — EDIT to match the footage.
   at: frame index of the spot · arrow: which way the walk heads ·
   door: true → the point swings open when you arrive / pass it. */
const VILLA_WAYPOINTS = [
  { at: 1,   name: "Entrance",     arrow: "forward" },
  { at: 130, name: "Garden path",  arrow: "forward" },
  { at: 270, name: "Villa door",   arrow: "right",  door: true },
  { at: 400, name: "Living room",  arrow: "forward" },
  { at: 545, name: "Bedroom",      arrow: "left",   door: true },
  { at: 700, name: "Private pool", arrow: "forward" },
];

const villaHud = document.getElementById("villa-hud");
const villaCanvas = document.createElement("canvas");
villaCanvas.id = "villa-canvas";
villaCanvas.style.cssText =
  "position:fixed;inset:0;width:100vw;height:100vh;z-index:30;display:none;touch-action:none;";
document.body.appendChild(villaCanvas);
const villaCtx = villaCanvas.getContext("2d");
let villaDpr = 1;

function sizeVillaCanvas() {
  villaDpr = Math.min(devicePixelRatio, 2);
  villaCanvas.width = Math.round(innerWidth * villaDpr);
  villaCanvas.height = Math.round(innerHeight * villaDpr);
}

/* ---------- state ---------- */
let villaMode = false;     // walk-through interactive
let villaBusy = false;     // entry/exit transition in flight
let villaPos = 1;          // current frame index = "you are here"
let villaTravel = null;    // { from, to, wp, tween, passed }
let villaZoom = 1;         // wheel zoom on the current view
let villaPanX = 0, villaPanY = 0; // drag-peek offset (px)
let villaDragging = false;
let villaLastPX = 0, villaLastPY = 0;
let villaBreathT = 0;      // idle breathing clock

/* ---------- frame cache + preload ---------- */
const frameCache = new Map();          // idx → HTMLImageElement (LRU-capped)
function loadVillaFrame(idx) {
  idx = THREE.MathUtils.clamp(Math.round(idx), 1, VILLA_FRAME_COUNT);
  let img = frameCache.get(idx);
  if (img) return img;
  img = new Image();
  img.src = VILLA_FRAMES[idx - 1];
  frameCache.set(idx, img);
  if (frameCache.size > 56) {
    const oldest = frameCache.keys().next().value;
    if (oldest !== idx) frameCache.delete(oldest);
  }
  return img;
}
let villaPrefetch = 1;
function prefetchVillaFrames() {       // creep ahead while standing still
  const ahead = Math.min(villaPos + 14, VILLA_FRAME_COUNT);
  while (villaPrefetch < ahead) { villaPrefetch++; loadVillaFrame(villaPrefetch); }
}

/* Draw the current frame, cover-fit, with zoom/pan and the optional
   skydive transform (scale / offY / rot / blur). */
function drawVillaView(t = {}) {
  const w = innerWidth, h = innerHeight;
  villaCtx.setTransform(villaDpr, 0, 0, villaDpr, 0, 0);
  villaCtx.save();
  villaCtx.fillStyle = "#0d1f14";
  villaCtx.fillRect(0, 0, w, h);
  const img = loadVillaFrame(villaPos);
  if (img.complete && img.naturalWidth) {
    const s0 = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = s0 * villaZoom * (t.scale ?? 1);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const maxOffX = Math.max(0, (dw - w) / 2), maxOffY = Math.max(0, (dh - h) / 2);
    // pan + dive offset clamp TOGETHER, so the frame always covers the screen
    const ox = THREE.MathUtils.clamp(villaPanX, -maxOffX, maxOffX);
    const oy = THREE.MathUtils.clamp(villaPanY + (t.offY ?? 0), -maxOffY, maxOffY);
    villaCtx.translate(w / 2, h / 2);
    if (t.rot) villaCtx.rotate(t.rot);
    if (t.blur) villaCtx.filter = `blur(${t.blur}px)`;
    villaCtx.drawImage(img, -dw / 2 + ox, -dh / 2 + oy, dw, dh);
  }
  villaCtx.restore();
}
function drawVillaFrameNow() { drawVillaView({ scale: 1 }); }

/* per-frame: stand still with a gentle Earth-style hover breathing */
function updateVilla(dt) {
  if (!villaMode) return;
  villaBreathT += dt;
  prefetchVillaFrames();
  drawVillaView({ scale: 1 + Math.sin(villaBreathT * 0.4) * 0.012 });
}

/* ---------- point-to-point travel (the Google-Maps move) ---------- */
const VILLA_WALK_FPS = 84;   // frame playback speed of the walk (fast-forward glide)

function killVillaTravel() {
  if (villaTravel?.tween) villaTravel.tween.kill();
  villaTravel = null;
}

function travelTo(wp) {
  if (villaTravel || !villaMode) return;
  const from = villaPos;
  const to = THREE.MathUtils.clamp(wp.at, 1, VILLA_FRAME_COUNT);
  if (from === to) { if (wp.door) openVillaDoor(); return; }

  const dur = THREE.MathUtils.clamp(Math.abs(to - from) / VILLA_WALK_FPS, 2.2, 9);
  villaTravel = { from, to, wp, passed: new Set(), tween: null };
  showVillaNav(wp);
  hideVillaChips();

  const st = { p: from };
  villaTravel.tween = gsap.to(st, {
    p: to, duration: dur, ease: "power1.inOut",   // push off + settle, like steps
    onUpdate: () => {
      const prev = villaPos;
      villaPos = Math.round(st.p);
      if (villaPos !== prev) {
        drawVillaFrameNow();
        checkVillaDoors(prev, villaPos);
        updateVillaNavProgress(Math.abs(villaPos - from) / Math.abs(to - from));
        // keep frames ahead of the walk preloaded
        const dir = to > from ? 1 : -1;
        for (let k = 1; k <= 10; k++) {
          loadVillaFrame(THREE.MathUtils.clamp(villaPos + k * dir, 1, VILLA_FRAME_COUNT));
        }
      }
    },
    onComplete: () => {
      villaPos = to;
      drawVillaFrameNow();
      hideVillaNav();
      if (wp.door) openVillaDoor();       // the door opens on arrival
      villaTravel = null;
      refreshVillaChips();
    },
  });
}

/* ---------- doors swing open as you pass ---------- */
function checkVillaDoors(prev, cur) {
  if (!villaTravel) return;
  const lo = Math.min(prev, cur), hi = Math.max(prev, cur);
  VILLA_WAYPOINTS.forEach((w) => {
    if (w.door && !villaTravel.passed.has(w.at) && w.at > lo && w.at <= hi) {
      villaTravel.passed.add(w.at);
      openVillaDoor();
    }
  });
}

function openVillaDoor() {
  if (document.querySelector(".villa-door.open")) return;
  const d = document.createElement("div");
  d.className = "villa-door";
  d.innerHTML = `<span class="villa-door-panel left"></span><span class="villa-door-panel right"></span>`;
  document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add("open"));
  gsap.delayedCall(1.25, () => d.remove());
}

/* ---------- direction-point chips (Google-Maps-style) ---------- */
const villaChipLayer = document.createElement("div");
villaChipLayer.id = "villa-chips";
document.body.appendChild(villaChipLayer);
const ARROW_GLYPH = { forward: "▲", left: "◀", right: "▶", back: "▼" };

function refreshVillaChips() {
  villaChipLayer.innerHTML = "";
  if (!villaMode) return;
  // like a Google-Maps route: offer the NEAREST few steps from here,
  // laid out left → center → right along the bottom of the view
  const next = VILLA_WAYPOINTS
    .filter((w) => Math.abs(w.at - villaPos) >= 6)
    .sort((a, b) => Math.abs(a.at - villaPos) - Math.abs(b.at - villaPos))
    .slice(0, 3)
    .sort((a, b) => a.at - b.at);
  next.forEach((w, i) => {
    const el = document.createElement("button");
    el.className = `villa-chip arrow-${w.arrow ?? "forward"}` + (w.door ? " is-door" : "");
    el.style.left = `${34 + i * 16}%`;
    el.style.bottom = "9%";
    el.style.animationDelay = `${i * 0.08}s`;
    el.innerHTML =
      `<span class="villa-chip-arrow">${ARROW_GLYPH[w.arrow] ?? "▲"}</span>` +
      `<span class="villa-chip-label">${w.name}</span>` +
      (w.door ? `<span class="villa-chip-door">🚪</span>` : "");
    el.addEventListener("click", (e) => { e.stopPropagation(); travelTo(w); });
    villaChipLayer.appendChild(el);
  });
}
function hideVillaChips() { villaChipLayer.innerHTML = ""; }

/* ---------- the big marching navigation arrow ---------- */
const villaNav = document.createElement("div");
villaNav.id = "villa-nav";
villaNav.innerHTML =
  `<div class="villa-nav-arrow"><span></span><span></span><span></span></div>` +
  `<p class="villa-nav-label"></p>` +
  `<div class="villa-nav-progress"><span></span></div>`;
document.body.appendChild(villaNav);

function showVillaNav(wp) {
  villaNav.className = `active dir-${wp.arrow ?? "forward"}`;
  villaNav.querySelector(".villa-nav-label").textContent =
    `${wp.door ? "Opening the way to" : "Walking to"} ${wp.name}`;
  const bar = villaNav.querySelector(".villa-nav-progress span");
  bar.style.transition = "none";
  bar.style.width = "0%";
}
function updateVillaNavProgress(p) {
  const bar = villaNav.querySelector(".villa-nav-progress span");
  bar.style.transition = "width .18s linear";
  bar.style.width = `${Math.round(THREE.MathUtils.clamp(p, 0, 1) * 100)}%`;
}
function hideVillaNav() { villaNav.className = ""; }





/* ---------- the Beach-Club-style skydive, played over the frames ---------- */
const villaDive = { active: false, state: { scale: 1, offY: 0, rot: 0, blur: 0, shake: 0 } };

function enterVilla(loc) {
  if (!planeMesh || villaBusy || panoBusy || mode === "villa") return;
  villaBusy = true;
  killTween();
  stopAutoTour();
  hideVillaChips();
  hideVillaNav();
  detailEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-detail");

  /* 1 · dive toward the Villas pin (same pre-dive as the beach) */
  const p = (pinMap.get(loc.id)?.anchor) ?? anchorFromUV(loc.u, loc.v);
  const endPos = new THREE.Vector3(p.x, Math.max(6, fitCameraHeight() * 0.34), p.z);
  const endTgt = new THREE.Vector3(p.x, 0, p.z);
  const startPos = camera.position.clone();
  const startTgt = _look.clone();
  const st = { t: 0 };
  activeTween = gsap.to(st, {
    t: 1, duration: 0.7, ease: "power2.in",
    onUpdate: () => {
      camera.position.lerpVectors(startPos, endPos, st.t);
      _look.lerpVectors(startTgt, endTgt, st.t);
      const cl = clampFocusPoint(_look.x, _look.z, camera.position.y);
      camera.position.x += cl.x - _look.x;
      camera.position.z += cl.z - _look.z;
      _look.set(cl.x, _look.y, cl.z);
      camera.lookAt(_look);
      updatePins();
    },
    onComplete: () => {
      /* 2 · clouds swallow the map — identical to the beach arrival */
      mode = "villa";
      if (controls) { controls.enabled = false; controls.enablePan = false; }
      document.body.classList.add("is-pano");   // hides pins + HUD via CSS
      cloudsIn();

      /* 3 · stage the first frame behind the clouds */
      sizeVillaCanvas();
      villaPos = 1;
      villaZoom = 1; villaPanX = 0; villaPanY = 0; villaBreathT = 0;
      loadVillaFrame(1);
      villaCanvas.style.display = "block";

      /* 4 · high above: the first frame zoomed way in, looking up */
      const s = villaDive.state;
      gsap.delayedCall(0.85, () => {
        villaDive.active = true;
        s.scale = 3.4; s.offY = innerHeight * 0.35; s.rot = 0; s.blur = 6; s.shake = 0;
        drawVillaView({ scale: s.scale, offY: s.offY, blur: s.blur });
      });

      /* 5 · clouds part, revealing the sky-high view */
      gsap.delayedCall(1.15, () => cloudsOut());

      /* 6 · THE FALL — same profile as the Beach Club dive:
         accelerate from rest → fastest mid-fall → chute-open flare.
         Wind shake + slight roll + blur rush sell the speed. */
      const FALL = 3.4, FLARE = 0.30;          // last 30% = chute flare
      gsap.delayedCall(1.3, () => {
        gsap.to(s, {
          scale: 1, duration: FALL,
          ease: (p) => p * p * (3 - 2 * p),    // smoothstep fall profile
          onUpdate: () => {
            const t = performance.now() * 0.001;
            const jx = (Math.sin(t * 21.0) * 0.010 + Math.sin(t * 7.3) * 0.004) * s.shake;
            const jy = (Math.sin(t * 17.7) * 0.009 + Math.cos(t * 5.1) * 0.004) * s.shake;
            drawVillaView({
              scale: s.scale * (1 + s.shake * 0.04),
              offY: s.offY + jy * innerHeight * 0.12,
              rot: s.rot + jx * 0.35,
              blur: s.blur,
            });
          },
          onComplete: landVilla,
        });
        // focus catches the ground: blur rushes away through the fall
        gsap.to(s, { blur: 0, duration: FALL * 0.8, ease: "power1.in" });
        // staring up → slight down-glance by flare start → level out
        gsap.to(s, { offY: -innerHeight * 0.10, duration: FALL * (1 - FLARE), ease: "power1.inOut" });
        gsap.to(s, { offY: 0, duration: FALL * FLARE, ease: "power2.out", delay: FALL * (1 - FLARE) });
        // wind shake rising mid-fall (killed on landing)
        gsap.fromTo(s, { shake: 0 },
          { shake: 1, duration: FALL * 0.5, ease: "power1.in", delay: FALL * 0.18 });
        // gentle roll sway
        gsap.fromTo(s, { rot: 0 },
          { rot: THREE.MathUtils.degToRad(5), duration: FALL * 0.45, ease: "sine.inOut", yoyo: true, repeat: 1 });
      });
    },
  });
}

/* landed: dust puff + one short soft settle, then hand over to the
   walk-through — same gentle knee-bend as the beach touchdown */
function landVilla() {
  villaDive.active = false;
  puffVillaDust();
  const s = villaDive.state;
  gsap.to(s, {
    shake: 0, rot: 0, blur: 0, duration: 0.35, ease: "power2.out",
    onUpdate: () => drawVillaView({ scale: s.scale, rot: s.rot, blur: s.blur }),
  });
  const settle = { sc: 1 };
  gsap.to(settle, {
    keyframes: { sc: [1, 1.045, 1] }, duration: 0.8, delay: 0.3, ease: "sine.inOut",
    onUpdate: () => drawVillaView({ scale: settle.sc }),
    onComplete: () => {
      villaMode = true;
      villaBusy = false;
      villaBreathT = 0;
      drawVillaFrameNow();
      refreshVillaChips();
      villaHud?.classList.add("active");
      villaHud?.setAttribute("aria-hidden", "false");
      setVillaListeners(true);
    },
  });
}

/* ---------- interaction: peek around · zoom · direction chips ---------- */
function setVillaListeners(on) {
  if (on) {
    villaCanvas.addEventListener("pointerdown", onVillaDown);
    addEventListener("pointermove", onVillaMove);
    addEventListener("pointerup", onVillaUp);
    villaCanvas.addEventListener("wheel", onVillaWheel, { passive: false });
    villaCanvas.addEventListener("dblclick", onVillaDblClick);
  } else {
    villaCanvas.removeEventListener("pointerdown", onVillaDown);
    removeEventListener("pointermove", onVillaMove);
    removeEventListener("pointerup", onVillaUp);
    villaCanvas.removeEventListener("wheel", onVillaWheel);
    villaCanvas.removeEventListener("dblclick", onVillaDblClick);
  }
}

function onVillaDown(e) {
  if (!villaMode || !e.isPrimary) return;
  villaDragging = true;
  villaLastPX = e.clientX; villaLastPY = e.clientY;
}
function onVillaMove(e) {
  if (!villaDragging || !villaMode || !e.isPrimary) return;
  const dx = e.clientX - villaLastPX, dy = e.clientY - villaLastPY;
  villaLastPX = e.clientX; villaLastPY = e.clientY;
  villaPanX -= dx; villaPanY -= dy;         // peek around the current view
  drawVillaFrameNow();
}
function onVillaUp() {
  if (!villaDragging) return;
  villaDragging = false;
  // the walk always looks ahead again — ease the peek back to center
  const back = { x: villaPanX, y: villaPanY };
  gsap.to(back, {
    x: 0, y: 0, duration: 0.7, ease: "power2.out",
    onUpdate: () => { villaPanX = back.x; villaPanY = back.y; drawVillaFrameNow(); },
  });
}
function onVillaWheel(e) {
  if (!villaMode) return;
  e.preventDefault();
  villaZoom = THREE.MathUtils.clamp(villaZoom + (e.deltaY > 0 ? -0.08 : 0.08), 1, 2.4);
  drawVillaFrameNow();
}
function onVillaDblClick() {
  if (!villaMode) return;
  const s = { z: villaZoom };
  gsap.to(s, {
    z: villaZoom > 1.3 ? 1 : 1.8, duration: 0.7, ease: "power2.out",
    onUpdate: () => { villaZoom = s.z; drawVillaFrameNow(); },
  });
}

/* small dust puff on touchdown (green tint for the gardens) */
function puffVillaDust() {
  const dust = document.createElement("div");
  dust.className = "pano-dust villa";
  document.body.appendChild(dust);
  gsap.fromTo(dust, { opacity: 0.75, scale: 0.35 }, {
    opacity: 0,
    scale: 2.4,
    duration: 1.1,
    ease: "power2.out",
    onComplete: () => dust.remove(),
  });
}

/* --- leave the villas: lift into the sky → clouds → map --- */
function exitVilla() {
  if (mode !== "villa" || villaBusy) return;
  villaBusy = true;
  villaMode = false;
  setVillaListeners(false);
  killVillaTravel();
  hideVillaChips();
  hideVillaNav();
  villaHud?.classList.remove("active");
  villaHud?.setAttribute("aria-hidden", "true");

  // climb away: the view shrinks back into the sky, blurred, and the
  // clouds close over it — then the map is back
  const s = villaDive.state;
  villaDive.active = true;
  gsap.to(s, {
    scale: 2.6, blur: 4, duration: 1.0, ease: "power2.in",
    onUpdate: () => drawVillaView({ scale: s.scale, blur: s.blur }),
    onComplete: () => {
      villaDive.active = false;
      cloudsIn();
      gsap.delayedCall(0.9, () => {
        villaCanvas.style.display = "none";
        mode = "map";
        detailId = null;
        document.body.classList.remove("is-pano");
        snapToMapView();
        _look.set(0, 0, 0);
        cloudsOut();
        gsap.delayedCall(1.6, () => { villaBusy = false; });
      });
    },
  });
}

/* ============================================================
   8. Boot
   ============================================================ */
setLoad(15, "Preparing the resort");
loadResortImage()
  .then((img) => {
    buildWorld(cleanImage(img)); // cleanImage is now a no-op pass-through
    buildPins();
    snapToMapView();          // fullscreen still view of the resort image
    setLoad(100, "Welcome");
    // warm the 360° textures in the background (silent on failure —
    // enterPano() retries the load itself)
    Object.values(PANO_SPOTS).forEach(({ src }) => {
      loadPanoTexture(src).then((tex) => {
        const spot = [...panoSpots.values()].find((s) => s.src === src);
        if (spot && !spot.tex) spot.tex = tex;
        if (!panoSphere) buildPanoScene(tex);   // sphere ready for either spot
      }).catch(() => {});
    });
    setTimeout(() => {
      loaderEl.classList.add("hidden");
      gsap.from("#hud", { y: -14, opacity: 0, duration: 0.9, ease: "power2.out" });
    }, 400);
  })
  .catch(() => {
    setLoad(null, "resort-new.webp / resort.png / resort.webp not found next to index.html");
  });

/* ============================================================
   9. Cleanup
   ============================================================ */
export function disposeScene() {
  renderer.setAnimationLoop(null);
  killTween();
  stopAutoTour();
  if (controls) controls.dispose();
  if (planeMesh) {
    planeMesh.geometry.dispose();
    planeMesh.material.map?.dispose?.();
    planeMesh.material.dispose();
  }
  if (oceanMesh) {
    oceanMesh.geometry.dispose();
    oceanMesh.material.dispose();
  }
  if (panoSphere) {
    panoSphere.geometry.dispose();
    panoSphere.material.map?.dispose?.();
    panoSphere.material.dispose();
  }
  renderer.dispose();
}
window.disposeScene = disposeScene;
