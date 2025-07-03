import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { createArcAroundAxis } from './helperFunctions.js';


let canvas, ctx, earthImg;
let scene, camera, renderer, globe, arrow, controls;
let sunDir = [1, 0.5, 0.6], sunDirFlip=[0,0,0];
let isDragging = false;
let animationFrameId;
let clickListener;
let onMouseDown, onMouseMove, onMouseUp, onWindowResize, resizeObserver;
let x=0,y=0;


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

  resizeObserver = new ResizeObserver(() => {
    resizeMapCanvas();
  });
  resizeObserver.observe(canvas);
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

function drawLines(){
  ctx.save();
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 1;

  // Horizontal line to Y-axis
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, y);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Vertical line to X-axis
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(x, canvas.height/2);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.restore(); 

}

function draw2DAxes() {
    
  
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  
    // X-axis: rightward arrow
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();
  
    // Arrowhead for X
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height/2);
    ctx.lineTo(canvas.width - 8, canvas.height/2 - 5);
    ctx.lineTo(canvas.width - 8, canvas.height/2 + 5);
    ctx.closePath();
    ctx.fill();
  
    ctx.fillText('\u03B8', canvas.width - 15, canvas.height/2 - 25);
  
    // Y-axis: upward arrow
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
  
    // Arrowhead for Y
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2 - 5,  8);
    ctx.lineTo(canvas.width/2 + 5, 8);
    ctx.closePath();
    ctx.fill();
  
    ctx.fillText('\u03C6', canvas.width/2+25, 30);
  
    ctx.restore();
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
  x = ((sunLon + 180) / 360) * canvas.width;
  y = ((90 - sunLat) / 180) * canvas.height;

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();

  draw2DAxes();
  drawLines();

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
    //labels
    ctx.save();
    ctx.font = "italic 28px Arial"; // italic style
    ctx.fillStyle = "#yellow"	;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText('\u03B8', x, canvas.height/2 +35);
    ctx.fillText('\u03C6', canvas.width/2 - 35, y);
    ctx.font = "italic 16px Arial"; // italic style
    ctx.fillText('Z', x+15, canvas.height/2 +40);
    ctx.fillText('Z', canvas.width/2 - 20, y+5);
    ctx.restore();


}

function makeTextSprite(text, position, color, font) {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, size / 2, size / 2);
  
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.4, 0.4, 1); // Size in world units
    sprite.position.copy(position);
    sprite.material.depthTest = false;
    sprite.renderOrder = 999;
  
    return sprite;
  }

function init3D() {
  const container = document.getElementById("globeContainer");

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(3.5, 1, 1.5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const texture = new THREE.TextureLoader().load("earth.jpg");
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0.5, // tweak this as desired
    });  
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

// Yellow Dot
    const yellowDot3D = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 16, 16),
    new THREE.MeshBasicMaterial({ color: 'yellow' })
    );
    scene.add(yellowDot3D);
    globe.userData.yellowDot3D = yellowDot3D; // Keep reference

  // Axes:
    const axesLength = 3;
    const color = 0xffffff; // white
  
    const xArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), // direction: X-axis
    new THREE.Vector3(-axesLength/2,0,0),
    axesLength,
    color,
    0.2,
    0.05
    );
  
    const zArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), // direction: Y-axis
    new THREE.Vector3(0,-axesLength/2,0),
    axesLength,
    color,
    0.2,
    0.05
    );
  
    const yArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, -1), // direction: Z-axis
    new THREE.Vector3(0,0,axesLength/2),
    axesLength,
    color,
    0.2,
    0.05
    );
  
    scene.add(xArrow, yArrow, zArrow);

// Labels  
  const xLabel = makeTextSprite("x", new THREE.Vector3(1.6, 0, 0), "white","60px Arial");
  const yLabel = makeTextSprite("z", new THREE.Vector3(0, 1.3, 0.1), "white","60px Arial");
  const zLabel = makeTextSprite("y", new THREE.Vector3(0, 0, -1.6),"white","60px Arial");

  scene.add(xLabel, yLabel, zLabel);

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
  arrow = new THREE.ArrowHelper(direction, tip.clone().addScaledVector(direction, -0.5), 1, 0xffff00, 0.15, 0.05);
  scene.add(arrow);

  const resizeRenderer = () => {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(window.devicePixelRatio);
  };


  // plane through origin

    // 1. Create a plane geometry
    const size = 3; // Adjust to make the plane bigger/smaller
    const planeGeometry = new THREE.PlaneGeometry(size, size);

    // 2. Create a yellow material
    
    
    const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00, // yellow
    side: THREE.DoubleSide,
    opacity: 0.4,
    transparent: true,
    depthWrite: false
    });
    // if you want plane inside globe to be visible:
    //
    // const planeMaterial = new THREE.MeshBasicMaterial({
    //     color: 0xffff00,           // yellow
    //     side: THREE.DoubleSide,    // so both sides render
    //     opacity: 0.4,
    //     transparent: true,
    //     depthTest: false,          // disable depth test so it renders on top
    //     depthWrite: false          // don't write to depth buffer
    //     });


    // 3. Create the mesh
    const sunPlane = new THREE.Mesh(planeGeometry, planeMaterial);

    // 4. Align it perpendicular to sunVector
    const normal = new THREE.Vector3(...sunDirFlip).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal); // rotate Z-axis to sunDir
    sunPlane.quaternion.copy(quaternion);

    // 5. Position at the globe center (origin)
    sunPlane.position.set(0, 0, 0);

    // 6. Add to scene
    scene.add(sunPlane);

    // Optionally store reference for later updates
    globe.userData.sunPlane = sunPlane;


  new ResizeObserver(resizeRenderer).observe(container);
  window.addEventListener('resize', resizeRenderer);

  updateGlobeLight();
  resizeRenderer();
  animate();
}

function updateSunPlane() {
  const normal = new THREE.Vector3(...sunDirFlip).normalize();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  globe.userData.sunPlane.quaternion.copy(quaternion);
}


function updateGlobeLight() {
  const { theta, phi } = directionToSpherical(sunDir);
  const thetaFlip = -theta;
  sunDirFlip = sphericalToDirection(thetaFlip, phi);

  globe.userData.light.position.set(...sunDirFlip);



  const sunVector = new THREE.Vector3(...sunDirFlip).normalize();
  globe.userData.yellowDot3D.position.copy(sunVector);
  arrow.setDirection(sunVector);
  arrow.position.copy(new THREE.Vector3(0,0,0));
  updateSunPlane();

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
