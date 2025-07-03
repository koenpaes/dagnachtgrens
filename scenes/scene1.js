import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { createArcAroundAxis } from './helperFunctions.js';


let canvas, ctx, earthImg;
let scene, camera, renderer, globe, arrow, controls;
let sunDir = [1, 0.4, 0];
let isDragging = false;
let animationFrameId;
let clickListener;
let onMouseDown, onMouseMove, onMouseUp, onWindowResize, resizeObserver;


export function init() {
  canvas = document.getElementById("mapCanvas");
  ctx = canvas.getContext("2d", { willReadFrequently: true });

  clickListener = (e) => { /* handle click */ };
  canvas.addEventListener("click", clickListener);

  function render() {
    animationFrameId = requestAnimationFrame(render);
  }

  render();

  earthImg = new Image();
  earthImg.src = "earth.jpg";
  earthImg.onload = () => {
    drawShadedMap();
  };
  if (earthImg.complete) {
    drawShadedMap();
  }

  setupCanvasEvents();
  resizeMapCanvas();
  init3D();
}

function setupCanvasEvents() {
  onMouseDown = (e) => {
    isDragging = true;
    updateSunDirectionFromMouse(e);
  };
  onMouseMove = (e) => {
    if (isDragging) updateSunDirectionFromMouse(e);
  };
  onMouseUp = () => { isDragging = false; };

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mouseleave", onMouseUp);

  const container2 = document.getElementById("mapContainer");
  resizeObserver = new ResizeObserver(() => {
    resizeMapCanvas();
  });
  resizeObserver.observe(container2); 

  // resizeObserver = new ResizeObserver(() => {
  //   resizeMapCanvas();
  // });
  // resizeObserver.observe(canvas);
}

function resizeMapCanvas() {
  const container = document.getElementById("mapContainer");
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  let width = containerWidth;
  let height = width / 2;
  if (height > containerHeight) {
    height = containerHeight;
    width = height * 2;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;

  requestAnimationFrame(() => {
    if (earthImg.complete) drawShadedMap();
  });
}

function updateSunDirectionFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const lon = (x / canvas.width) * 360 - 180;
  const lat = 90 - (y / canvas.height) * 180;

  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);

  sunDir = sphericalToDirection(theta, phi);

  drawShadedMap();
  updateGlobeLight();
}

function sphericalToDirection(theta, phi) {
  const x = Math.sin(phi) * Math.cos(theta);
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

function directionToSpherical([x, y, z]) {
  const phi = Math.acos(y / Math.sqrt(x * x + y * y + z * z));
  const theta = Math.atan2(z, x);
  return { theta, phi };
}

function drawShadedMap() {
  ctx.drawImage(earthImg, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let j = 0; j < canvas.height; j++) {
    const lat = (90 - (j / canvas.height) * 180) * (Math.PI / 180);
    for (let i = 0; i < canvas.width; i++) {
      const lon = ((i / canvas.width) * 360 - 180) * (Math.PI / 180);
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);

      const dot = x * sunDir[0] + y * sunDir[1] + z * sunDir[2];
      const shade = Math.max(dot, 0.0);

      const index = (j * canvas.width + i) * 4;
      data[index] *= shade;
      data[index + 1] *= shade;
      data[index + 2] *= shade;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const sunLon = Math.atan2(sunDir[2], sunDir[0]) * 180 / Math.PI;
  const sunLat = Math.asin(sunDir[1]) * 180 / Math.PI;
  const x = ((sunLon + 180) / 360) * canvas.width;
  const y = ((90 - sunLat) / 180) * canvas.height;

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();

  // Define your function here (normalized to canvas coordinates)
  function f(xNorm) {
    // xNorm is between 0 and 1
    const theta = xNorm*2*Math.PI - Math.PI;
    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const phi_Z = Math.asin(sunDir[1]);
    const k = -1/Math.tan(phi_Z);
    const phi = Math.atan(k*Math.cos(theta-theta_Z));
    const yN = (Math.PI/2 - phi)/Math.PI;

    return yN;
  }
  
  if (Math.abs(y-canvas.height/2)<2){
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width,0);
    ctx.moveTo(0,canvas.height);
    ctx.lineTo(canvas.width,canvas.height);
    if(x > canvas.width/4 && x < canvas.width*3/4){
      ctx.moveTo(x-canvas.width/4, 0);
      ctx.lineTo(x-canvas.width/4, canvas.height);
      ctx.moveTo(x+canvas.width/4, 0);
      ctx.lineTo(x+canvas.width/4, canvas.height);
    }
    if(x <= canvas.width/4){
      ctx.moveTo(x+canvas.width/4, 0);
      ctx.lineTo(x+canvas.width/4, canvas.height);
      ctx.moveTo(x+3*canvas.width/4, 0);
      ctx.lineTo(x+3*canvas.width/4, canvas.height);
    }
    if(x >= 3*canvas.width/4){
      ctx.moveTo(x-3*canvas.width/4, 0);
      ctx.lineTo(x-3*canvas.width/4, canvas.height);
      ctx.moveTo(x-canvas.width/4, 0);
      ctx.lineTo(x-canvas.width/4, canvas.height);
    }
    ctx.stroke()  
    }
  else{
    // Draw red function curve y = f(x) over the map
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0; i <= width; i++) {
      let xNorm = i / width;
      let yNorm = f(xNorm);  // y between 0 and 1
      let y = height * yNorm;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();
}
}

function init3D() {
  const container = document.getElementById("globeContainer");

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(3.5, -1, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const texture = new THREE.TextureLoader().load("earth.jpg");
  const material = new THREE.MeshStandardMaterial({ map: texture });
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(...sunDir);
  scene.add(light);
  globe.userData.light = light;

  const sunVector = new THREE.Vector3(...sunDir).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const axis = sunVector.clone().normalize();
  const startDir = new THREE.Vector3().crossVectors(up, sunVector).normalize();

  const arc = createArcAroundAxis(1.01, 0, Math.PI * 2, 128, axis, startDir, 0xff0000);
  globe.userData.terminator = arc;
  scene.add(arc);

  const tip = sunVector.clone().multiplyScalar(1.4);
  const direction = sunVector.clone().negate();
  arrow = new THREE.ArrowHelper(direction, tip.clone().addScaledVector(direction, -0.5), 0.5, 0xffff00, 0.15, 0.05);
  scene.add(arrow);

  const resizeRenderer = () => {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  new ResizeObserver(resizeRenderer).observe(container);
  window.addEventListener('resize', resizeRenderer);

  updateGlobeLight();
  resizeRenderer();
  animate();
}

function updateGlobeLight() {
  const { theta, phi } = directionToSpherical(sunDir);
  const thetaFlip = -theta;
  const sunDirFlip = sphericalToDirection(thetaFlip, phi);

  globe.userData.light.position.set(...sunDirFlip);

  const sunVector = new THREE.Vector3(...sunDirFlip).normalize();
  const direction = sunVector.clone().negate();
  arrow.setDirection(direction);
  const tip = sunVector.clone().multiplyScalar(1.4);
  arrow.position.copy(tip.clone().addScaledVector(direction, -0.5));

  const up = new THREE.Vector3(0, 1, 0);
  const axis = sunVector.clone().normalize();
  const startDir = new THREE.Vector3().crossVectors(up, sunVector).normalize();

  const newArc = createArcAroundAxis(1.01, 0, Math.PI * 2, 128, axis, startDir, 0xff0000);
  scene.remove(globe.userData.terminator);
  globe.userData.terminator = newArc;
  scene.add(newArc);
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}


function cleanup() {
  if (clickListener) {
    canvas.removeEventListener("click", clickListener);
    clickListener = null;
  }

  canvas.removeEventListener("click", updateSunDirectionFromMouse);
  canvas.removeEventListener("mousedown", onMouseDown);
  canvas.removeEventListener("mousemove", onMouseMove);
  canvas.removeEventListener("mouseup", onMouseUp);
  canvas.removeEventListener("mouseleave", onMouseUp);

  if (resizeObserver) resizeObserver.disconnect();
  cancelAnimationFrame(animationFrameId);

  renderer.dispose();
  controls.dispose();

  const container = document.getElementById("globeContainer");
  if (renderer.domElement && container.contains(renderer.domElement)) {
    container.removeChild(renderer.domElement);
  }

  scene = camera = renderer = globe = arrow = controls = null;
}

export default { init, cleanup };
