# The Palace Luxury Resort — Interactive Resort Map

The resort image (`resort-new.webp`, label-free) **is** the world:
shown fullscreen (cover-fit) and perfectly still until you choose a
destination. Labels sit on every point.

Vanilla JS · Three.js · GSAP. No build step.

## Run

```bash
python -m http.server 5173
# or
npx serve .
```

Open <http://localhost:5173>. (`file://` won't work — CDN modules need HTTP.)

## Controls

| Mode | How | Result |
| --- | --- | --- |
| **Map** | completely static — no drag, no zoom | labels show; click one → |
| **Detail** | camera dives smoothly to that exact spot | here **drag pans around that area only** (bounds clamp to the pin's neighborhood), wheel = zoom; **← Back to map** / **Esc** returns |
| **360° skydive** | click **Beach Club** or **Restaurant** | cloud banks sweep in → camera falls from the sky (accelerates, then flares like a parachute) → lands softly inside a 360° panorama; drag to look, wheel to zoom, **Esc** returns |
| **Tour** | `▶ Play guided tour` / `T` | autoplaying flythrough of the highlights; `M` exits |

## Where pins come from

Each entry in `LOCATIONS` (`app.js`) places a pin at world coordinates
matching the reference layout:

```js
{ id: "tennis", name: "Tennis Court", color: "#2e7d32", icon: "🎾",
  x: -10, z: -2,                       // 3D position on the island
  view: { dist: 13, pitch: 0.6 },      // camera framing for the fly-in
  blurb: "…", highlights: "…", nearby: "…" }
```

Move a pin by changing `x`/`z`; adjust the fly-in via `dist`/`pitch`.

## How the view works

- The image loads as an unlit texture on a plane (`MeshBasicMaterial`),
  so its colors render exactly — HD source first (`resort.png`),
  `resort.webp` as fallback.
- **Drag-pan bounds**: `setPanBoundsFor()` computes a reach box around
  the clicked pin (~1.4× the visible ground extent at the hover
  height); the render loop rejects any pan that would leave it, so
  exploring always stays on the chosen area.
- **Edge-aware framing (no white space, ever)**: the camera's ground
  footprint is clamped to the image at every height — while flying,
  while dragging, while zooming. Edge locations (Main Entrance,
  Parking, …) hover at a *lower* height and hug the edge instead of
  centering with empty space beside them; zooming out past that cap
  slides the view smoothly back toward center so the image always
  fills the viewport.
- **360° skydive spots**: any pin with `pano: true` in `LOCATIONS`
  needs an entry in `PANO_SPOTS` (`app.js`) pointing at its panorama
  texture. Beach Club → `beach/beach_panorama.jpg`, Restaurant →
  `restaurant/restaurant.png`. Before the clouds close in, the camera
  dives straight at the clicked pin so it stays centered.
- **Cloud banks**: the skydive transition uses real images from
  `clouds/` — drop your own `cloud-1..4.png` photos there to override
  the bundled painted-cumulus `cloud-1..4.svg` (an inline SVG fallback
  is built in too, so it never falls back to flat shapes).
- Pin positions are measured on `resort-new.webp` — nudge `u`/`v` in
  `LOCATIONS` if any label sits a few pixels off its building.
- The camera top-down view is cover-fit to the viewport, so the image
  fills 100vw × 100vh with no edges visible.
- In map mode OrbitControls are **disabled** — the scene is a still
  image with clickable labels. Controls unlock only inside a detail
  view (orbit + zoom), and re-lock on return.
- `disposeScene()` (window global) frees geometry, texture, material.

## Files

| File | Role |
| --- | --- |
| `index.html` | Single-viewport shell: loader, pins layer, HUD, detail card |
| `styles.css` | Pin pills, HUD, detail card, tour bar, cloud banks |
| `app.js` | Photo-slab diorama, pin projection, map/detail/tour modes, 360° skydive |
| `clouds/` | Skydive cloud images (`cloud-1..4.svg` bundled; `cloud-N.png` overrides) |
