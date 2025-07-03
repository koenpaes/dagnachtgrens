import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { createArcAroundAxis, drawVector2D, drawLine2D } from './helperFunctions.js';


let canvas, ctx, earthImg, canvas2, ctx2;
let scene, camera, renderer, globe, arrow, controls;
let sunDir = [1, 0.4, 1.5];
let isDragging = false;
let animationFrameId;
let onMouseDown, onMouseMove, onMouseUp, onWindowResize, resizeObserver, resizeObserver2;
let mapWidth=0, mapHeight=0, w=0, h=0;


export function init() {
  canvas = document.getElementById("mapCanvas");
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  
  canvas2 = document.createElement("canvas");
  canvas2.id = "mapLeftCanvas";
  document.getElementById("globeContainer").appendChild(canvas2);
  ctx2 = canvas2.getContext("2d", { willReadFrequently: true });



  function render() {
    animationFrameId = requestAnimationFrame(render);
  }

  render();

  earthImg = new Image();
  earthImg.onload = () => {
    resizeMapCanvas();
    drawShadedMap();
  };
  earthImg.src = "earth.jpg";

  if (earthImg.complete) {
    resizeMapCanvas();
    drawShadedMap();
  }

  setupCanvasEvents();
  resizeMapCanvas();
  drawLeftMap();
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
  window.addEventListener('resize', resizeMapCanvas); // Handles window growing

  const container2 = canvas2.parentElement;

  resizeObserver2 = new ResizeObserver(() => {
  const width = container2.clientWidth;
  const height = container2.clientHeight;

  const dpr = window.devicePixelRatio || 1;
  canvas2.style.width = `${width}px`;
  canvas2.style.height = `${height}px`;
  canvas2.width = width * dpr;
  canvas2.height = height * dpr;

  ctx2.setTransform(1, 0, 0, 1, 0, 0);
  ctx2.scale(dpr, dpr);

  drawLeftMap();
});

resizeObserver2.observe(container2);



  // resizeObserver2 = new ResizeObserver(() => {
  //   resizeLeftMapCanvas();
  // });
  // resizeObserver2.observe(canvas2.parentElement);
  // window.addEventListener('resize', resizeLeftMapCanvas); // Handles window growing

}

function resizeMapCanvas() {
  const container = document.getElementById("mapContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Set canvas size and style (visual and internal size)
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;

  requestAnimationFrame(() => {
    if (earthImg.complete) drawShadedMap();
  });
}

function resizeLeftMapCanvas() {
  const container = canvas2.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Set canvas size and style (visual and internal size)
  canvas2.style.width = `${width}px`;
  canvas2.style.height = `${height}px`;
  canvas2.width = width;
  canvas2.height = height;

  requestAnimationFrame(() => {
    drawLeftMap();
  });
}

function updateSunDirectionFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const offsetX = (w - mapWidth) / 2;
  const offsetY = (h - mapHeight) / 2;

  const lon = ((x-offsetX) / mapWidth) * 360 - 180;
  const lat = 90 - ((y-offsetY) / mapHeight) * 180;

  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);

  

  sunDir = sphericalToDirection(theta, phi);

  drawShadedMap();
  drawLeftMap();
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

  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  
  w = canvas.width;
  h = canvas.height;

  // Calculate map drawing area with 2:1 aspect ratio, centered
  mapWidth = w;
  mapHeight = Math.floor(w / 2);
  if (mapHeight > h) {
    mapHeight = h;
    mapWidth = h * 2;
  }

  const offsetX = (w - mapWidth) / 2;
  const offsetY = (h - mapHeight) / 2;

  // Fill entire canvas with a background color or pattern (for the "black" areas)
  ctx.fillStyle = "black";  
  ctx.fillRect(0, 0, w, h);

  // Draw the earth image inside the centered rectangle with 2:1 aspect
  ctx.drawImage(earthImg, offsetX, offsetY, mapWidth, mapHeight);

  // Now adjust the shading calculations to use the map drawing area coordinates and dimensions
  const imgData = ctx.getImageData(offsetX, offsetY, mapWidth, mapHeight);
  const data = imgData.data;

  for (let j = 0; j < mapHeight; j++) {
    const lat = (90 - (j / (mapHeight-1)) * 180) * (Math.PI / 180);
    for (let i = 0; i < mapWidth; i++) {
      const lon = ((i / (mapWidth-1)) * 360 - 180) * (Math.PI / 180);
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);

      const dot = x * sunDir[0] + y * sunDir[1] + z * sunDir[2];
      let shade = Math.min(0.5,Math.max(dot, 0.0));
      const index = (j * mapWidth + i) * 4;
      data[index] *= shade;
      data[index + 1] *= shade;
      data[index + 2] *= shade;
    }
  }

  ctx.putImageData(imgData, offsetX, offsetY);
  drawLine2D(ctx,offsetX,offsetY + mapHeight,offsetX+mapWidth,offsetY+mapHeight,{color:"black",lineWidth:2});
  drawLine2D(ctx,canvas.width,0,canvas.width,canvas.height,{color:"black",lineWidth:1});



  //draw coordinate axes
  drawVector2D(ctx,0, h/2,w,h/2);
  drawVector2D(ctx,w/2, h,w/2,0);

  ctx.fillStyle = "white";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText('\u03B8', canvas.width - 15, canvas.height/2 - 25);
  //ctx.fillText('\u03C6', canvas.width/2+25, 30);


  // Draw sun indicator on map
  const sunLon = Math.atan2(sunDir[2], sunDir[0]) * 180 / Math.PI;
  const sunLat = Math.asin(sunDir[1]) * 180 / Math.PI;
  const sunX = offsetX + ((sunLon + 180) / 360) * mapWidth;
  const sunY = offsetY + ((90 - sunLat) / 180) * mapHeight;

  ctx.beginPath();
  ctx.arc(sunX, sunY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();

   ctx.save();
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 1;

  // Horizontal line to Y-axis
  // ctx.beginPath();
  // ctx.moveTo(canvas.width/2, sunY);
  // ctx.lineTo(sunX, sunY);
  // ctx.stroke();

  // Vertical line to X-axis
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(sunX, canvas.height/2);
  ctx.lineTo(sunX, sunY);
  ctx.stroke();

  ctx.restore(); 
  
    //labels
    ctx.save();
    ctx.font = "italic 28px Arial"; // italic style
    ctx.fillStyle = "#yellow"	;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText('\u03B8', sunX, canvas.height/2 +35);
    //ctx.fillText('\u03C6', canvas.width/2 - 35, sunY);
    ctx.font = "italic 16px Arial"; // italic style
    ctx.fillText('Z', sunX+15, canvas.height/2 +40);
    //ctx.fillText('Z', canvas.width/2 - 20, sunY+5);
    ctx.restore();

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


  function cosineShift(xNorm) {
    const theta = xNorm*2*Math.PI - Math.PI;
    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const phi_Z = Math.asin(sunDir[1]);
    const k = -1/Math.tan(phi_Z);

    return -k*Math.cos(theta-theta_Z)
  }
  
  
    // Draw red function curve y = f(x) over the map
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    const width = mapWidth;
    const height = mapHeight;

    for (let i = 0; i <= width; i++) {
      let xNorm = offsetX + i / width;
      let yNorm = f(xNorm);  // y between 0 and 1
      let y = offsetY + height* yNorm;

      if (i === 0) {
        ctx.moveTo(offsetX+i, y);
      } else {
        ctx.lineTo(offsetX+i, y);
      }
    }
    ctx.stroke();



     // Draw shifted cosine-function over the map
    ctx.beginPath();
    ctx.strokeStyle = 'lightgreen';
    ctx.lineWidth = 2;

    for (let i = 0; i <= width; i++) {
      let xNorm = offsetX + i / width;
      let yNorm = cosineShift(xNorm);  // y between -1 and 1
      let y = h/2 + height/Math.PI * yNorm;

      if (i === 0) {
        ctx.moveTo(offsetX+i, y);
      } else {
        ctx.lineTo(offsetX+i, y);
      }
    }
    ctx.stroke();

    
}


function drawLeftMap(){
   ctx2.clearRect(0, 0, canvas2.width, canvas2.height); 
  
  const w = canvas2.width;
  const h = canvas2.height;


  // Fill entire canvas with a background color or pattern (for the "black" areas)
  ctx2.fillStyle = "black";  
  ctx2.fillRect(0, 0, w, h);

  //draw coordinate axes
  drawVector2D(ctx2,20, h/2,w-20,h/2);
  drawVector2D(ctx2,w/2, h-20,w/2,20);
  ctx2.fillStyle = "white";
  ctx2.font = "32px Arial";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText('\u03B8', canvas2.width - 15, canvas2.height/2 - 25);
  //ctx2.fillText('\u03C6', canvas.width/2+25, 30);

  function cosine(xNorm) {
    const theta = xNorm*2*Math.PI - Math.PI;
    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const phi_Z = Math.asin(sunDir[1]);
    const k = -1/Math.tan(phi_Z);

    return -Math.cos(theta)
  }

  function cosineShift(xNorm) {
    const theta = xNorm*2*Math.PI - Math.PI;
    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const phi_Z = Math.asin(sunDir[1]);
    const k = -1/Math.tan(phi_Z);

    return -Math.cos(theta-theta_Z)
  }


   function cosineExpandShift(xNorm) {
    const theta = xNorm*2*Math.PI - Math.PI;
    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const phi_Z = Math.asin(sunDir[1]);
    const k = -1/Math.tan(phi_Z);

    return -k*Math.cos(theta-theta_Z)
  }

     // Draw shifted and expanded cosine-function over the map
    ctx2.beginPath();
    ctx2.strokeStyle = 'lightgreen';
    ctx2.lineWidth = 2;

    for (let i = 20; i <= w-20; i++) {
      let xNorm = i / w;
      let yNorm = cosineExpandShift(xNorm);  // y between -1 and 1
      let y = h/2 + w/(2*Math.PI)* yNorm;

      if (i === 20) {
        ctx2.moveTo(i, y);
      } else {
        ctx2.lineTo(i, y);
      }
    }
    ctx2.stroke();

 // Draw cosine-function over the map
    ctx2.beginPath();
    ctx2.strokeStyle = 'lightblue';
    ctx2.lineWidth = 2;

    for (let i = 20; i <= w-20; i++) {
      let xNorm = i / w;
      let yNorm = cosine(xNorm);  // y between -1 and 1
      let y = h/2 + w/(2*Math.PI)* yNorm;

      if (i === 20) {
        ctx2.moveTo(i, y);
      } else {
        ctx2.lineTo(i, y);
      }
    }
    ctx2.stroke();

    ctx2.fillStyle = "lightblue";
    ctx2.font = "20px Arial";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText('cos(\u03B8)', w/2 -30, h/2 -w/(2*Math.PI)-15);

     // Draw shifted cosine-function over the map
    ctx2.beginPath();
    ctx2.strokeStyle = 'orange';
    ctx2.lineWidth = 2;

    for (let i = 20; i <= w-20; i++) {
      let xNorm = i / w;
      let yNorm = cosineShift(xNorm);  // y between -1 and 1
      let y = h/2 + w/(2*Math.PI)* yNorm;

      if (i === 20) {
        ctx2.moveTo(i, y);
      } else {
        ctx2.lineTo(i, y);
      }
    }
    ctx2.stroke();

    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const phi_Z = Math.asin(sunDir[1]);
    const x_Norm = (theta_Z + Math.PI)/(2*Math.PI)

    ctx2.fillStyle = "orange";
    ctx2.font = "20px Arial";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText('cos(\u03B8 - \u03B8  )',x_Norm*w,h/2 -w/(2*Math.PI)+20);
    ctx2.font = "14px Arial";
    ctx2.fillText('Z',x_Norm*w+36,h/2 -w/(2*Math.PI)+25);

    ctx2.fillStyle = "lightgreen";
    ctx2.font = "20px Arial";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText('k.cos(\u03B8 - \u03B8  )',(x_Norm-1/4)*w+30,h/2 + 40);
    ctx2.font = "14px Arial";
    ctx2.fillText('Z',(x_Norm-1/4)*w+74,h/2 + 45);





}


function cleanup() {
  canvas.removeEventListener("click", updateSunDirectionFromMouse);
  canvas.removeEventListener("mousedown", onMouseDown);
  canvas.removeEventListener("mousemove", onMouseMove);
  canvas.removeEventListener("mouseup", onMouseUp);
  canvas.removeEventListener("mouseleave", onMouseUp);

  if (resizeObserver) resizeObserver.disconnect();
  if (resizeObserver2) resizeObserver2.disconnect();

  cancelAnimationFrame(animationFrameId);

  if (renderer) {
    renderer.dispose();
  }

  if (controls) {
    controls.dispose();
  }

  const container = document.getElementById("globeContainer");

  // Remove canvas2 if it's still in the DOM
  if (canvas2 && container.contains(canvas2)) {
    container.removeChild(canvas2);
    canvas2 = null;
    ctx2 = null;
  }

  // // Also optionally clear canvas1
  // if (ctx) {
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  // }

  scene = camera = renderer = globe = arrow = controls = null;
}


export default { init, cleanup };
