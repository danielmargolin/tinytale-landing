/**
 * Standalone 3D book demo — port of components/BookSimulator (demo layout).
 * No Expo / React / RN Web. Loads baked page textures from manifest.json.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.min.js";

const PAGE_WIDTH = 2.1;
const PAGE_HEIGHT = 2.0;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const EASING = 0.5;
const EASING_FOLD = 0.3;
const INSIDE_CURVE = 0.18;
const OUTSIDE_CURVE = 0.01;
const TURNING_CURVE = 0.01;

const DEMO_CLOSED_SCALE = 1.55;
const DEMO_OPEN_SCALE = 1;
const BOOK_SCALE_Z = 0.8;
const CLOSED_CENTER_OFFSET = (PAGE_WIDTH / 2) * DEMO_CLOSED_SCALE;

const CONTROLS_INSET = 0;
/** Canvas height as a fraction of width — tighter than the in-app 1.05 for embeds. */
const BOOK_PANEL_HEIGHT_RATIO = 0.78;

function isMobileLayout() {
  return (
    window.innerWidth <= 800 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

const white = new THREE.Color("white");
const emissive = new THREE.Color("orange");

function dampAngle(current, target, smoothTime, delta) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * (1 - Math.exp(-delta / Math.max(smoothTime, 1e-4)));
}

function buildPageGeometry() {
  const geo = new THREE.BoxGeometry(
    PAGE_WIDTH,
    PAGE_HEIGHT,
    PAGE_DEPTH,
    PAGE_SEGMENTS,
    2
  );
  geo.translate(PAGE_WIDTH / 2, 0, 0);

  const pos = geo.attributes.position;
  const skinIndexes = [];
  const skinWeights = [];
  const vertex = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const x = vertex.x;
    const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
    const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
  }

  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndexes, 4));
  geo.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4)
  );
  return geo;
}

function buildPagesFromImages(images) {
  const pages = [];
  const contentSpreadCount = Math.floor((images.length - 1) / 2);
  for (let i = 0; i <= contentSpreadCount; i++) {
    pages.push({
      front: images[2 * i],
      back: images[2 * i + 1] ?? images[2 * i],
    });
  }
  return pages;
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

class PageSheet {
  constructor({ number, frontTex, backTex, geometry, baseMaterials, onClick }) {
    this.number = number;
    this.onClick = onClick;
    this.opened = false;
    this.bookClosed = true;
    this.page = 0;
    this.highlighted = false;
    this.turnedAt = 0;
    this.lastOpened = false;

    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new THREE.Bone();
      bones.push(bone);
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) bones[i - 1].add(bone);
    }
    const skeleton = new THREE.Skeleton(bones);

    const materials = [
      ...baseMaterials.map((m) => m.clone()),
      new THREE.MeshStandardMaterial({
        color: white,
        map: frontTex,
        roughness: 0.1,
        emissive,
        emissiveIntensity: 0,
      }),
      new THREE.MeshStandardMaterial({
        color: white,
        map: backTex,
        roughness: 0.1,
        emissive,
        emissiveIntensity: 0,
      }),
    ];

    this.mesh = new THREE.SkinnedMesh(geometry, materials);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.add(skeleton.bones[0]);
    this.mesh.bind(skeleton);

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.userData.pageSheet = this;

    this.group.traverse((obj) => {
      obj.userData.pageSheet = this;
    });
  }

  setState({ page, opened, bookClosed }) {
    if (opened !== this.lastOpened) {
      this.turnedAt = Date.now();
      this.lastOpened = opened;
    }
    this.page = page;
    this.opened = opened;
    this.bookClosed = bookClosed;
    this.mesh.position.z = -this.number * PAGE_DEPTH + page * PAGE_DEPTH;
  }

  update(delta) {
    const materials = this.mesh.material;
    const emissiveIntensity = this.highlighted ? 0.22 : 0;
    materials[4].emissiveIntensity = materials[5].emissiveIntensity =
      THREE.MathUtils.lerp(
        materials[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    let turningTime = Math.min(400, Date.now() - this.turnedAt) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = this.opened ? -Math.PI / 2 : Math.PI / 2;
    if (!this.bookClosed) {
      targetRotation += degToRad(this.number * 0.8);
    }

    const bones = this.mesh.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? this.group : bones[i];
      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

      let rotationAngle =
        INSIDE_CURVE * insideCurveIntensity * targetRotation -
        OUTSIDE_CURVE * outsideCurveIntensity * targetRotation +
        TURNING_CURVE * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);

      if (this.bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      target.rotation.y = dampAngle(
        target.rotation.y,
        rotationAngle,
        EASING,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      target.rotation.x = dampAngle(
        target.rotation.x,
        foldRotationAngle * foldIntensity,
        EASING_FOLD,
        delta
      );
    }
  }
}

async function resolveAssetBase() {
  const candidates = [
    new URL("./", import.meta.url),
    // Live Server / editing from demo-book-simulation/src/
    new URL("../../public/demo-book-simulation/", import.meta.url),
  ];
  for (const base of candidates) {
    try {
      const res = await fetch(new URL("manifest.json", base), {
        cache: "no-cache",
      });
      if (res.ok) {
        return { base, manifest: await res.json() };
      }
    } catch {
      /* try next */
    }
  }
  throw new Error("Failed to load manifest.json");
}

function loadTexture(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

function setupUI({ rtl, totalSheets, getPage, setPage }) {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const prevIcon = document.getElementById("prev-icon");
  const nextIcon = document.getElementById("next-icon");

  // Match app/demoBookSimulation.tsx RTL control icons (arrow directions).
  const leftPath =
    'M19 12H5M5 12l6 6M5 12l6-6';
  const rightPath =
    'M5 12h14M13 6l6 6-6 6';
  const prevPath = prevIcon.querySelector("path");
  const nextPath = nextIcon.querySelector("path");
  if (prevPath && nextPath) {
    if (rtl) {
      prevPath.setAttribute("d", leftPath);
      nextPath.setAttribute("d", rightPath);
    } else {
      prevPath.setAttribute("d", rightPath);
      nextPath.setAttribute("d", leftPath);
    }
  }

  const refresh = () => {
    const page = getPage();
    prevBtn.disabled = page <= 0;
    nextBtn.disabled = page >= totalSheets;
  };

  prevBtn.addEventListener("click", () => {
    setPage(Math.max(0, getPage() - 1));
    refresh();
  });
  nextBtn.addEventListener("click", () => {
    setPage(Math.min(totalSheets, getPage() + 1));
    refresh();
  });

  return refresh;
}

async function main() {
  const loading = document.getElementById("loading");
  const canvasHost = document.getElementById("canvas-host");
  const panel = document.getElementById("book-panel");

  const { base: assetBase, manifest } = await resolveAssetBase();
  const rtl = !!manifest.rtl;
  let imageUrls = manifest.pages.map((p) => new URL(p, assetBase).href);
  if (rtl) imageUrls = imageUrls.reverse();

  const sheetDefs = buildPagesFromImages(imageUrls);
  const totalSheets = sheetDefs.length;

  // Hebrew demo starts on the back cover (closed), matching Book.tsx.
  let page = rtl ? totalSheets : 0;
  let delayedPage = page;

  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(
    imageUrls.map((url) => loadTexture(loader, url))
  );
  const texByUrl = Object.fromEntries(
    imageUrls.map((url, i) => [url, textures[i]])
  );

  const geometry = buildPageGeometry();
  const baseMaterials = [
    new THREE.MeshStandardMaterial({ color: white }),
    new THREE.MeshStandardMaterial({ color: "#111" }),
    new THREE.MeshStandardMaterial({ color: white }),
    new THREE.MeshStandardMaterial({ color: white }),
  ];

  const sheets = sheetDefs.map((def, index) => {
    const sheet = new PageSheet({
      number: index,
      frontTex: texByUrl[def.front],
      backTex: texByUrl[def.back],
      geometry,
      baseMaterials,
      onClick: () => {},
    });
    return sheet;
  });

  const scene = new THREE.Scene();
  const isDesktop = !isMobileLayout();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  // Match BookSimulator Canvas + OrbitControls (target 0,0,0).
  camera.position.set(0, -0.35, isDesktop ? 3.2 : 3);
  camera.zoom = isDesktop ? 0.55 : 0.65;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasHost.appendChild(renderer.domElement);

  const bookRoot = new THREE.Group();
  bookRoot.rotation.x = Math.PI / 18;
  const bookScaleGroup = new THREE.Group();
  const bookYaw = new THREE.Group();
  bookYaw.rotation.y = -Math.PI / 2;
  sheets.forEach((s) => bookYaw.add(s.group));
  bookScaleGroup.add(bookYaw);
  bookRoot.add(bookScaleGroup);
  scene.add(bookRoot);

  scene.add(new THREE.AmbientLight(0xffffff, 1.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.5);
  dir.position.set(2, 2, 2);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.bias = -0.0001;
  scene.add(dir);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ transparent: true, opacity: 0.2 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.5;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function applyDemoLayout() {
    const isOpen = totalSheets > 0 && page > 0 && page < totalSheets;
    const scale = isOpen ? DEMO_OPEN_SCALE : DEMO_CLOSED_SCALE;
    bookScaleGroup.scale.set(scale, scale, BOOK_SCALE_Z);

    let offsetX = 0;
    if (page <= 0) offsetX = -CLOSED_CENTER_OFFSET;
    else if (page >= totalSheets) offsetX = CLOSED_CENTER_OFFSET;
    bookScaleGroup.position.x = offsetX;
  }

  function syncSheets() {
    sheets.forEach((sheet, index) => {
      sheet.setState({
        page: delayedPage,
        opened: delayedPage > index,
        bookClosed: delayedPage === 0 || delayedPage === totalSheets,
      });
    });
    applyDemoLayout();
  }

  let flipTimer = null;
  function goTowardTarget() {
    if (page === delayedPage) return;
    delayedPage += page > delayedPage ? 1 : -1;
    syncSheets();
    const delay = Math.abs(page - delayedPage) > 2 ? 50 : 150;
    flipTimer = setTimeout(goTowardTarget, delay);
  }

  function setPage(next) {
    page = next;
    clearTimeout(flipTimer);
    goTowardTarget();
    refreshUI();
  }

  const refreshUI = setupUI({
    rtl,
    totalSheets,
    getPage: () => page,
    setPage,
  });

  function resize() {
    if (isMobileLayout()) {
      sheets.forEach((s) => {
        s.highlighted = false;
      });
      renderer.domElement.style.cursor = "default";
    }

    const w = panel.clientWidth || window.innerWidth;
    const h = Math.max(
      0,
      Math.min(
        w * BOOK_PANEL_HEIGHT_RATIO,
        window.innerHeight - CONTROLS_INSET
      )
    );
    panel.style.height = `${h}px`;
    camera.aspect = w / Math.max(h, 1);
    // Re-apply lookAt after projection changes so framing stays centered.
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  window.addEventListener("resize", resize);
  resize();
  syncSheets();
  refreshUI();

  renderer.domElement.addEventListener("pointermove", (e) => {
    if (isMobileLayout()) {
      sheets.forEach((s) => {
        s.highlighted = false;
      });
      renderer.domElement.style.cursor = "default";
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    sheets.forEach((s) => {
      s.highlighted = false;
    });
    const hit = hits.find((h) => h.object.userData.pageSheet);
    if (hit) {
      hit.object.userData.pageSheet.highlighted = true;
      renderer.domElement.style.cursor = "pointer";
    } else {
      renderer.domElement.style.cursor = "default";
    }
  });

  renderer.domElement.addEventListener("click", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    const hit = hits.find((h) => h.object.userData.pageSheet);
    if (!hit) return;
    const sheet = hit.object.userData.pageSheet;
    setPage(sheet.opened ? sheet.number : sheet.number + 1);
  });

  loading.hidden = true;

  const clock = new THREE.Clock();
  function frame() {
    const delta = Math.min(clock.getDelta(), 0.05);
    sheets.forEach((s) => s.update(delta));
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main().catch((err) => {
  console.error(err);
  const loading = document.getElementById("loading");
  if (loading) {
    loading.textContent = "שגיאה בטעינת הדמו";
  }
});
