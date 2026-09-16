/**
 * 3D-Gebärden-Avatar auf Basis von Three.js (Open Source, MIT-Lizenz,
 * https://threejs.org/). Der Avatar ist ein einfach gebauter,
 * stilisierter Körper (keine fertigen Fremd-Assets nötig), dessen rechte
 * Hand die Fingeralphabet-Konfigurationen aus fingeralphabet.js animiert.
 *
 * Wie die 2D-Piktogramme ist auch dieser Avatar eine vereinfachte
 * Demo-Darstellung – keine geprüfte DGS-Referenz. Siehe README.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

const SKIN = 0xf0c8a2;
const SHIRT = 0x2f5fb5;
const HAIR = 0x2c2620;

const CURL = 1.7; // Radiant: eingerollter Finger
const CURVE = 0.85; // Radiant: leicht gewölbte Hand (C/O)

const SPREAD_Z = [-0.22, -0.07, 0.09, 0.24];

function buildAvatar() {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.1, 4, 12), shirtMat);
  torso.position.set(0, 0.35, 0);
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 16), skinMat);
  head.position.set(0, 1.35, 0);
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.375, 20, 12, 0, Math.PI * 2, 0, 1.7), hairMat);
  hair.position.set(0, 1.42, 0);
  root.add(hair);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.75, 4, 8), skinMat);
  leftArm.position.set(-0.62, 0.05, 0);
  leftArm.rotation.z = 0.12;
  root.add(leftArm);

  const shoulder = new THREE.Group();
  shoulder.position.set(0.5, 0.68, 0);
  root.add(shoulder);

  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.4, 4, 8), skinMat);
  upperArm.position.set(0, -0.22, 0);
  shoulder.add(upperArm);

  const forearmPivot = new THREE.Group();
  forearmPivot.position.set(0, -0.42, 0);
  shoulder.add(forearmPivot);

  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 8), skinMat);
  forearm.position.set(0, -0.2, 0);
  forearmPivot.add(forearm);

  const wristGroup = new THREE.Group();
  wristGroup.position.set(0, -0.42, 0);
  forearmPivot.add(wristGroup);

  const handGroup = new THREE.Group();
  wristGroup.add(handGroup);

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.08), skinMat);
  palm.position.set(0, -0.1, 0);
  handGroup.add(palm);

  const fingerPivots = [];
  const fingerXs = [-0.075, -0.025, 0.025, 0.075];
  const fingerLens = [0.19, 0.21, 0.19, 0.15];
  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group();
    pivot.position.set(fingerXs[i], -0.2, 0);
    handGroup.add(pivot);
    const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, fingerLens[i], 3, 6), skinMat);
    seg.position.set(0, -fingerLens[i] / 2, 0);
    pivot.add(seg);
    fingerPivots.push(pivot);
  }

  const thumbPivot = new THREE.Group();
  thumbPivot.position.set(-0.12, -0.03, 0.015);
  handGroup.add(thumbPivot);
  const thumbSeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 3, 6), skinMat);
  thumbSeg.position.set(0, -0.07, 0);
  thumbPivot.add(thumbSeg);

  const dotMat = new THREE.MeshStandardMaterial({ color: SHIRT });
  const dot1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), dotMat);
  const dot2 = dot1.clone();
  dot1.position.set(-0.05, 0.22, 0.04);
  dot2.position.set(0.05, 0.22, 0.04);
  dot1.visible = false;
  dot2.visible = false;
  handGroup.add(dot1, dot2);

  return { root, shoulder, forearmPivot, wristGroup, handGroup, fingerPivots, thumbPivot, umlautDots: [dot1, dot2] };
}

function neutralPose() {
  return {
    handZ: 0,
    fingers: [CURL * 0.5, CURL * 0.5, CURL * 0.5, CURL * 0.5],
    fingerZ: [0, 0, 0, 0],
    thumbX: -0.2,
    thumbZ: 0.3,
    umlaut: false,
  };
}

function poseFromConfig(cfg) {
  const pose = neutralPose();
  if (!cfg) return pose;

  if (cfg.shape === "curve") {
    pose.fingers = [CURVE, CURVE, CURVE, CURVE];
  } else if (cfg.crossed) {
    pose.fingers = [0.45, 0.45, CURL, CURL];
    pose.fingerZ = [0.32, -0.32, 0, 0];
  } else if (cfg.hook) {
    pose.fingers = [0.95, CURL, CURL, CURL];
    pose.fingerZ = [0.18, 0, 0, 0];
  } else {
    pose.fingers = cfg.fingers.map((extended) => (extended ? 0 : CURL));
    if (cfg.spread) pose.fingerZ = SPREAD_Z.slice();
  }

  if (cfg.thumb === "out") {
    pose.thumbX = -0.15;
    pose.thumbZ = -1.05;
  } else if (cfg.thumb === "loop") {
    pose.thumbX = -0.55;
    pose.thumbZ = -0.85;
  } else {
    pose.thumbX = -0.25;
    pose.thumbZ = 0.35;
  }

  pose.handZ = THREE.MathUtils.degToRad(-(cfg.rotate || 0));
  pose.umlaut = !!cfg.umlaut;
  return pose;
}

export function createSignAvatar(container) {
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0.35, 1.35, 2.6);
  camera.lookAt(0.3, 1.05, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.1));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2, 3, 2);
  scene.add(dir);

  const avatar = buildAvatar();
  scene.add(avatar.root);

  avatar.shoulder.rotation.x = -2.2;
  avatar.shoulder.rotation.z = -0.15;
  avatar.forearmPivot.rotation.x = 0.9;
  avatar.wristGroup.rotation.x = -1.2;

  let current = neutralPose();
  let target = neutralPose();
  let tweenStart = 0;
  let tweenDuration = 300;

  function applyPose(pose) {
    avatar.handGroup.rotation.z = pose.handZ;
    avatar.fingerPivots.forEach((pivot, i) => {
      pivot.rotation.x = pose.fingers[i];
      pivot.rotation.z = pose.fingerZ[i];
    });
    avatar.thumbPivot.rotation.x = pose.thumbX;
    avatar.thumbPivot.rotation.z = pose.thumbZ;
    avatar.umlautDots[0].visible = pose.umlaut;
    avatar.umlautDots[1].visible = pose.umlaut;
  }

  function lerpPose(a, b, t) {
    return {
      handZ: THREE.MathUtils.lerp(a.handZ, b.handZ, t),
      fingers: a.fingers.map((v, i) => THREE.MathUtils.lerp(v, b.fingers[i], t)),
      fingerZ: a.fingerZ.map((v, i) => THREE.MathUtils.lerp(v, b.fingerZ[i], t)),
      thumbX: THREE.MathUtils.lerp(a.thumbX, b.thumbX, t),
      thumbZ: THREE.MathUtils.lerp(a.thumbZ, b.thumbZ, t),
      umlaut: t > 0.5 ? b.umlaut : a.umlaut,
    };
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(container);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();

  let bobT = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    const t = tweenDuration > 0 ? Math.min(1, (now - tweenStart) / tweenDuration) : 1;
    applyPose(lerpPose(current, target, t));

    bobT += 0.015;
    avatar.root.position.y = Math.sin(bobT) * 0.01;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  return {
    /** Zeigt den Buchstaben (per Fingeralphabet-Konfiguration) am Avatar an. */
    showLetter(letter, durationMs) {
      const cfg = window.Fingeralphabet ? window.Fingeralphabet.getConfig(letter) : null;
      current = lerpPose(
        current,
        target,
        tweenDuration > 0 ? Math.min(1, (performance.now() - tweenStart) / tweenDuration) : 1
      );
      target = cfg ? poseFromConfig(cfg) : neutralPose();
      tweenStart = performance.now();
      tweenDuration = durationMs || 250;
    },
    reset() {
      this.showLetter(null, 400);
    },
  };
}

function init() {
  const container = document.getElementById("avatar-canvas");
  if (!container) return;
  window.SignAvatar = createSignAvatar(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
