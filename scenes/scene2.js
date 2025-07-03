import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { createArcAroundAxis } from './helperFunctions.js';


let canvas, ctx, earthImg;
let scene, camera, renderer, globe, controls;
let animationFrameId;
let clickListener;
let onWindowResize, resizeObserverCanvas, resizeObserverGlobe, onMouseDown, onMouseMove, onMouseUp;
let redDot = { x: 60, y: 100 };  // Initial position
let isDragging = false;
const redDotRadius = 6;
let redDotCoord3D = new THREE.Vector3(0,0,0);
let thetaLabel = null, phiLabel=null, posLabel = null;



export function init() {
  canvas = document.getElementById("mapCanvas");
  ctx = canvas.getContext("2d", { willReadFrequently: true });



   // Attach listener
   clickListener = (e) => { /* handle click */ };
   canvas.addEventListener("click", clickListener);

   function render() {
    // draw something
    animationFrameId = requestAnimationFrame(render);
  }

  render();

  earthImg = new Image();
  earthImg.src = "earth.jpg";
  earthImg.onload = () => {
    resizeCanvasToDisplaySize(canvas);
    drawMapOnly();
  };
  if (earthImg.complete) {
    // Already loaded from cache
    drawMapOnly();
  }

  setupCanvasEvents();
  resizeMapCanvas();
  // Set redDot based on current canvas size
  redDot.x = 0.62;
  redDot.y = 0.3;

  resizeObserverCanvas = new ResizeObserver(() => {
  resizeMapCanvas();
  drawMapOnly(); // Ensures the map image and overlays reappear correctly
  });
  resizeObserverCanvas.observe(canvas);


  init3D();
}

function setupCanvasEvents() {
    onMouseDown = (e) => {
      isDragging = true;
      updateRedDot(e);
    };
    onMouseMove = (e) => {
      if (isDragging) updateRedDot(e);
    };
    onMouseUp = () => {
      isDragging = false;
    };
    onWindowResize = () => {
        resizeMapCanvas();
        drawMapOnly();
      };

      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("mouseleave", onMouseUp);
      window.addEventListener("resize", onWindowResize);
      
      resizeObserverCanvas = new ResizeObserver(resizeMapCanvas);
      resizeObserverCanvas.observe(canvas);
      
}

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const { width, height } = rect;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
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
}

function drawMapOnly() {
    ctx.drawImage(earthImg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // 0.3 = 30% black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw2DAxes();
    drawLines();


    // Draw red dot
    ctx.beginPath();
    ctx.arc(redDot.x*canvas.width, redDot.y*canvas.height, redDotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();

    

    //labels
    ctx.save();
    ctx.font = "italic 28px Arial"; // italic style
    ctx.fillStyle = "#ADD8E6"	;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText('\u03B8', redDot.x*canvas.width, canvas.height/2 +35);
    ctx.fillStyle = "#90EE90"
    ctx.fillText('\u03C6', canvas.width/2 - 35, redDot.y*canvas.height);
    ctx.restore();
  

    }
  

function redDotTo3D(x, y, radius = 1.01) {
  const phi = y*Math.PI;
  const theta = -x*2*Math.PI+Math.PI;

  const u = radius * Math.sin(phi) * Math.cos(theta);
  const v = radius * Math.cos(phi);
  const w = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(u,v,w);
}


function updateRedDot(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y= e.clientY - rect.top;
  redDot.x = x/canvas.width;
  redDot.y = y/canvas.height;
  drawMapOnly();
}

function drawLines(){
  ctx.save();
  ctx.strokeStyle = "#90EE90";
  ctx.lineWidth = 1;

  // Horizontal line to Y-axis
  ctx.beginPath();
  ctx.moveTo(0, redDot.y*canvas.height);
  ctx.lineTo(canvas.width, redDot.y*canvas.height);
  ctx.stroke();

  // Vertical line to X-axis
  ctx.strokeStyle = "#ADD8E6";
  ctx.beginPath();
  ctx.moveTo(redDot.x*canvas.width, 0);
  ctx.lineTo(redDot.x*canvas.width, canvas.height);
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
  

function init3D() {
  const container = document.getElementById("globeContainer");
  container.innerHTML = ""; // Clear previous renderers

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(3.5, 1, -0.6);

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
  const axesLength = 3;

  // Axes:
  const origin = new THREE.Vector3(0, 0, 0);
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

  // Arrows
  const lengthRed = 1.01;
  const colorRed = 0xff0000
  redDotCoord3D = redDotTo3D(redDot.x, redDot.y);
  const direction = redDotCoord3D.normalize();
  const redArrow = new THREE.ArrowHelper(
  direction, 
  origin,
  lengthRed,
  colorRed,
  0.1,
  0.05
  );
  scene.add(redArrow);
  globe.userData.redArrow = redArrow; // in order to update the position

  const lengthYellow = redDotCoord3D.y;
  const colorYellow = "yellow"
  const directionYellow = new THREE.Vector3(0,1,0);
  const yellowArrow = new THREE.ArrowHelper(
  directionYellow, 
  origin,
  lengthYellow,
  colorYellow,
  0.1,
  0.2
  );
  scene.add(yellowArrow);
  globe.userData.yellowArrow = yellowArrow; // in order to update the position

  
  const colorBlue = '#FFA500'
  const directionBlue = new THREE.Vector3(redDotCoord3D.x,0,redDotCoord3D.z);
  const originBlue = new THREE.Vector3(0,redDotCoord3D.y,0)
  const lengthBlue = directionBlue.length();
  const blueArrow = new THREE.ArrowHelper(
  directionBlue, 
  originBlue,
  lengthBlue,
  colorBlue,
  0.1,
  0.2
  );
  scene.add(blueArrow);
  globe.userData.blueArrow = blueArrow; // in order to update the position

  // Labels  
  const xLabel = makeTextSprite("x", new THREE.Vector3(1.6, 0, 0), "white","60px Arial");
  const yLabel = makeTextSprite("z", new THREE.Vector3(0, 1.3, 0.1), "white","60px Arial");
  const zLabel = makeTextSprite("y", new THREE.Vector3(0, 0, -1.6),"white","60px Arial");

  scene.add(xLabel, yLabel, zLabel);

  thetaLabel = makeTextSprite('\u03B8', new THREE.Vector3(1, 0,0),"#ADD8E6", "70px Arial, sans-serif");
  scene.add(thetaLabel);
  phiLabel = makeTextSprite('\u03C6', new THREE.Vector3(0,1,0),"#90EE90", "70px Arial, sans-serif");
  scene.add(phiLabel);
  posLabel = makeTextSprite("(x,y,z)", redDotCoord3D.clone().multiplyScalar(1.15) ,"red", "50px Arial, sans-serif");
  scene.add(posLabel);

  


  // Red Dot
  const redDot3D = new THREE.Mesh(
  new THREE.SphereGeometry(0.02, 16, 16),
  new THREE.MeshBasicMaterial({ color: 'red' })
  );
  scene.add(redDot3D);
  globe.userData.redDot3D = redDot3D; // Keep reference

  // Dotted lines
  const dotmaterial = new THREE.LineDashedMaterial({
  color: 0xff0000,       // Red color
  dashSize: 0.05,        // Length of dash
  gapSize: 0.025,        // Space between dashes
  linewidth: 2,          // (ignored in most browsers unless using special renderer)
  });
  const end1 = new THREE.Vector3(redDotCoord3D.x, 0, redDotCoord3D.z);
  const line1 = new THREE.BufferGeometry().setFromPoints([redDotCoord3D, end1]);
  const dottedLine1 = new THREE.Line(line1, dotmaterial);
  dottedLine1.computeLineDistances();  // Required for dashes to show
  const end2 = new THREE.Vector3(0, redDotCoord3D.y,0);
  // const line2 = new THREE.BufferGeometry().setFromPoints([redDotCoord3D, end2]);
  // const dottedLine2 = new THREE.Line(line2, dotmaterial);
  // dottedLine2.computeLineDistances();  // Required for dashes to show
  const end3 = new THREE.Vector3( redDotCoord3D.x,0,0);
  const line3 = new THREE.BufferGeometry().setFromPoints([end1, end3]);
  const dottedLine3 = new THREE.Line(line3, dotmaterial);
  dottedLine3.computeLineDistances();  // Required for dashes to show
  const end4 = new THREE.Vector3(0,0, redDotCoord3D.z);
  const line4 = new THREE.BufferGeometry().setFromPoints([end1, end4]);
  const dottedLine4 = new THREE.Line(line4, dotmaterial);
  dottedLine4.computeLineDistances();  // Required for dashes to show
  const line5 = new THREE.BufferGeometry().setFromPoints([end1, origin]);
  const dottedLine5 = new THREE.Line(line5, dotmaterial);
  dottedLine5.computeLineDistances();  // Required for dashes to show
  
  scene.add(dottedLine1);
  //scene.add(dottedLine2);
  scene.add(dottedLine3);
  scene.add(dottedLine4);
  scene.add(dottedLine5)


  globe.userData.dottedLine1 = dottedLine1; 
  //globe.userData.dottedLine2 = dottedLine2; 
  globe.userData.dottedLine3 = dottedLine3; 
  globe.userData.dottedLine4 = dottedLine4; 
  globe.userData.dottedLine5 = dottedLine5; 

  //arcs
  globe.userData.arc1 = null;
  globe.userData.arc2 = null;
  globe.userData.arc3 = null;
  globe.userData.arc4 = null;


  const light = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(light);
  globe.userData.light = light; 


  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  const resizeRenderer = () => {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  resizeObserverGlobe = new ResizeObserver(resizeRenderer);
  resizeObserverGlobe.observe(container);
  

  resizeRenderer();
  animate();
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

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
  globe.userData.light.position.copy(camera.position).normalize();
  const pos = redDotTo3D(redDot.x, redDot.y);
  const pos1 = new THREE.Vector3(pos.x, 0 ,pos.z);
  const pos2 = new THREE.Vector3(0,pos.y,0);

  globe.userData.redDot3D?.position.copy(pos);
  const direction = pos.clone().normalize();
  globe.userData.redArrow?.setDirection(direction);
  globe.userData.yellowArrow?.setLength(pos.y);
  globe.userData.blueArrow?.setLength(pos1.length());
  globe.userData.blueArrow?.setDirection(pos1);
  globe.userData.blueArrow?.position.copy(pos2);

  
  
  //update dotted lines

  const pos3 = new THREE.Vector3(pos.x,0,0);
  const pos4 = new THREE.Vector3(0,0,pos.z);
  const pos5 = new THREE.Vector3(0,0,0);

  function updateLine(line, newStart, newEnd) {
  const positions = new Float32Array([
    newStart.x, newStart.y, newStart.z,
    newEnd.x, newEnd.y, newEnd.z
  ]);


  line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  line.geometry.attributes.position.needsUpdate = true;
  line.geometry.computeBoundingSphere();


  if (line.computeLineDistances) {
    line.computeLineDistances();
  }
  }

  if (globe.userData.dottedLine1) {
    updateLine(globe.userData.dottedLine1, pos, pos1);
  }
  // if (globe.userData.dottedLine2) {
  //   updateLine(globe.userData.dottedLine2, pos, pos2);
  // }
  if (globe.userData.dottedLine3) {
    updateLine(globe.userData.dottedLine3, pos1, pos3);
  }
  if (globe.userData.dottedLine4) {
    updateLine(globe.userData.dottedLine4, pos1, pos4);
  }
  if (globe.userData.dottedLine5) {
    updateLine(globe.userData.dottedLine5, pos1, pos5);
  }

  //arcs
  const axis = new THREE.Vector3(0, 1, 0); 
  const startAngle = 0;
  const endAngle = redDot.x * 2 * Math.PI - Math.PI;
  const radius = 0.3*pos1.length();

  // Remove old arc
  if (globe.userData.arc1) {
    scene.remove(globe.userData.arc1);
    globe.userData.arc1.geometry.dispose();
    globe.userData.arc1.material.dispose();
  }
  if (globe.userData.arc2) {
    scene.remove(globe.userData.arc2);
    globe.userData.arc2.geometry.dispose();
    globe.userData.arc2.material.dispose();
  }
  if (globe.userData.arc3) {
    scene.remove(globe.userData.arc3);
    globe.userData.arc3.geometry.dispose();
    globe.userData.arc3.material.dispose();
  }
  if (globe.userData.arc4) {
    scene.remove(globe.userData.arc4);
    globe.userData.arc4.geometry.dispose();
    globe.userData.arc4.material.dispose();
  }

  // Create and add new arc
  const newArc = createArcAroundAxis(radius, startAngle, endAngle, 64, axis, new THREE.Vector3(1,0,0),"white");
  scene.add(newArc);
  globe.userData.arc1 = newArc;


  // Create and add new arc2
  const angle2 = Math.PI/2 - redDot.y * Math.PI;
  const axis2 = new THREE.Vector3(-pos1.z, 0, pos1.x).normalize();
  const newArc2 = createArcAroundAxis(1.5*radius, 0, angle2, 64, axis2, pos1.clone().normalize(),"white");
  scene.add(newArc2);
  globe.userData.arc2 = newArc2;

    // Create and add new arc3
  const newArc3 = createArcAroundAxis(pos.length(), 0, 2*Math.PI, 64, axis2, pos,"#ADD8E6");
  scene.add(newArc3);
  globe.userData.arc3 = newArc3;

    // Create and add new arc3
  const newArc4 = createArcAroundAxis(pos.length(), 0, 2*Math.PI, 64, axis, pos,"#90EE90");
  scene.add(newArc4);
  globe.userData.arc4 = newArc4;

  //labels
  const theta = Math.atan2(pos1.z,pos1.x);
  const phi = Math.asin(pos2.y);
  const thetaPosition = new THREE.Vector3(1.5*radius*Math.cos(theta/3),0,1.5*radius*Math.sin(theta/3));
  const phiPosition = new THREE.Vector3(2*radius*Math.cos(theta), 2*radius*Math.sin(phi/2),2*radius*Math.sin(theta));
  if(thetaLabel) thetaLabel.position.set(thetaPosition.x, thetaPosition.y, thetaPosition.z);
  if(phiLabel) {
    phiLabel.position.set(phiPosition.x,phiPosition.y,phiPosition.z);
  }
  if(posLabel) {
    posLabel.position.set(1.15*pos.x,1.15*pos.y,1.15*pos.z);
  }

}

function cleanup() {
    console.log("Cleaning up scene 2");
  
    if (clickListener) {
      canvas.removeEventListener("click", clickListener);
      clickListener = null;
    }
  
    window.removeEventListener("resize", onWindowResize);
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseup", onMouseUp);
    canvas.removeEventListener("mouseleave", onMouseUp);
    if (resizeObserverCanvas) resizeObserverCanvas.disconnect();
    if (resizeObserverGlobe) resizeObserverGlobe.disconnect();
  
    cancelAnimationFrame(animationFrameId);
  
    if (controls) controls.dispose();
    if (renderer) renderer.dispose();
  
    const container = document.getElementById("globeContainer");
    if (renderer?.domElement && container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  
    scene = camera = renderer = globe = controls = null;
  }
  
  
  export default { init, cleanup };
