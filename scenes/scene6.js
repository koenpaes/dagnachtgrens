import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { createArcAroundAxis, drawVector2D, drawLine2D } from './helperFunctions.js';

const N = 80;
let xList = Array(N).fill(0), greenList = Array(N).fill(0), phiList = Array(N).fill(0);
let canvas, ctx, earthImg, canvas2, ctx2;
let scene, camera, renderer, globe, arrow, controls;
let sunDir = [1, 0.5, 1.5];
let isDragging = false;
let animationFrameId;
let onMouseDown, onMouseMove, onMouseUp, onWindowResize, resizeObserver, resizeObserver2;

// ✅ Animation control
let t = 0, t1=0, t2=0,t3=0,t4=0;
let isPlaying = false;
let tStep = 0.01;
let mapWidth=0, mapHeight=0, w=0,h=0;

export function init() {
  canvas = document.getElementById("mapCanvas");
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  
  canvas2 = document.createElement("canvas");
  canvas2.id = "mapLeftCanvas";
  document.getElementById("globeContainer").appendChild(canvas2);
  ctx2 = canvas2.getContext("2d", { willReadFrequently: true });

  function render() {
    animationFrameId = requestAnimationFrame(render);

    if (isPlaying) {
      t = Math.min(5,t+tStep);
      drawLeftMap();
      drawShadedMap();
    }
  }

  render();

  earthImg = new Image();
  earthImg.onload = () => {
    resizeMapCanvas();
    drawShadedMap();
    drawLeftMap();
  };
  earthImg.src = "earth.jpg";

  if (earthImg.complete) {
    resizeMapCanvas();
    drawShadedMap();
    drawLeftMap();
  }

  setupCanvasEvents();
  resizeMapCanvas();
  drawLeftMap();
  drawShadedMap();
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
  window.addEventListener('resize', resizeMapCanvas);

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

  // ✅ Add click handler for buttons
  canvas2.addEventListener("click", (e) => {
    const rect = canvas2.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!ctx2.buttons) return;

    for (let btn of ctx2.buttons) {
      if (
        x >= btn.x &&
        x <= btn.x + btn.width &&
        y >= btn.y &&
        y <= btn.y + btn.height
      ) {
        handleButtonAction(btn.action);
        break;
      }
    }
  });
}

function resizeMapCanvas() {
  const container = document.getElementById("mapContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;

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
  const offSetY = (h - mapHeight)/2

  const lon = ((x-offsetX) / mapWidth) * 360 - 180;
  const lat = 90 - ((y-offSetY) / mapHeight) * 180;

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
    const lat = (90 - (j / mapHeight) * 180) * (Math.PI / 180);
    for (let i = 0; i < mapWidth; i++) {
      const lon = ((i / mapWidth) * 360 - 180) * (Math.PI / 180);
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);

      const dot = x * sunDir[0] + y * sunDir[1] + z * sunDir[2];
      const shade = Math.min(0.5,Math.max(dot, 0.0));

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
      let xNorm = i / width;
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
      let xNorm =  i / width;
      let yNorm = cosineShift(xNorm); 
      let y = h/2 + h/Math.PI * yNorm;

      if (i === 0) {
        ctx.moveTo(offsetX+i, y);
      } else {
        ctx.lineTo(offsetX+i, y);
      }
    }
    ctx.stroke();


    // draw green dots  
    const theta_Z =  Math.atan2(sunDir[2], sunDir[0]);
    const x_ZNorm = (theta_Z + Math.PI)/(2*Math.PI);
    for (let i = 0; i < N; i++) {
      xList[i] = x_ZNorm - (N/2 - i)*1/32;
      greenList[i] = cosineShift(xList[i]);
      ctx.beginPath();
      const yGreen = h/2+h/Math.PI*greenList[i]
      ctx.arc(offsetX+xList[i]*width, yGreen , 5, 0, 2 * Math.PI);
      ctx.fillStyle = "lightgreen";
      ctx.fill();
      ctx.closePath();
      if (t>=4){
        drawLine2D(ctx,0,yGreen,w,yGreen,{color:"lightgreen",lineWidth:1,dotted:true});
      }
    }

    
    if (t>=4){
      for (let i = 0; i < N; i++) {
        const xGreen = offsetX+xList[i]*width;
        const yGreen = h/2+h/Math.PI*greenList[i]
        const yRed = offsetY + height* f(xList[i]);
        drawLine2D(ctx,xGreen,yGreen,xGreen,(1-t4)*yGreen+t4*yRed,{color:"white",lineWidth:1,dotted:true});
        ctx.beginPath();
        ctx.arc(xGreen, (1-t4)*yGreen + t4*yRed, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();
      }
    }
    

    
}


function drawLeftMap(){
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height); 
  
  const w = canvas2.width;
  const h = canvas2.height;

  ctx2.fillStyle = "black";  
  ctx2.fillRect(0, 0, w, h);

  drawVector2D(ctx2,w/2+20, h/4,w-20,h/4,{color:"lightgreen"});
  drawVector2D(ctx2,3*w/4, h/2-20,3*w/4,20,{color:"red"});

  //labels  
  ctx2.fillStyle = "lightgreen";
  ctx2.font = "24px Arial";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText('t', w-40, h/4 - 25);

  ctx2.fillStyle = "red";
  ctx2.fillText('\u03C6', 3*w/4+25, 40);

  ctx2.fillStyle = "lightblue";
  ctx2.fillText('\u03C6 = atan(t)', 7*w/8+25, 40);

  if (t3==1){
    ctx2.fillStyle = "lightgreen";
    ctx2.fillText('t', w/8 - 25, 25);
    ctx2.fillStyle = "red";
    ctx2.fillText('\u03C6', 3*w/8 + 25, 25);
    ctx2.fillStyle = "lightblue";
    ctx2.fillText('\u03C6 = atan(t)', 2*w/8, 25);
  }


  // Draw arctan(t)
  ctx2.beginPath();
  ctx2.strokeStyle = 'lightblue';
  ctx2.lineWidth = 4;

  for (let i = w/2+20; i <= w-20; i++) {
      let x = (i-3*w/4)*(Math.PI/2)/(h/6);
      let y = h/4 - h/6*Math.atan(x)/(Math.PI/2);

      if (i === w/2) {
      ctx2.moveTo(i, y);
      } else {
      ctx2.lineTo(i, y);
      }
  }
  ctx2.stroke();

  // //draw green dots
  for (let i = 0; i < N; i++) {
      const x = greenList[i]*(w/2-40)/Math.PI + 3*w/4;
       if (x > w/2+20 && x < w-20){
        ctx2.beginPath();
        ctx2.arc(x, h/4, 5, 0, 2 * Math.PI);
        ctx2.fillStyle = "lightgreen";
        ctx2.fill();
        ctx2.closePath();
       } 
      
    }

  // ctx2.fillStyle = "black";  
  // ctx2.fillRect(0, 0, w/2+20, h);

  //animate green to atan-graph
  t1 = Math.min(1,t);
  for (let i = 0; i < N; i++) {
      const x = greenList[i]*(w/2-40)/Math.PI + 3*w/4;
      const xNorm = (x-3*w/4)*(Math.PI/2)/(h/6);
      const y = h/4 - h/6*Math.atan(xNorm)/(Math.PI/2);
      if (x > w/2+20 && x < w-20){
        drawLine2D(ctx2,x,h/4,x,(1-t1)*h/4 + t1* y, {lineWidth:1})
      }

    }
  
  //animate atan-graph to red
  t2 = Math.max(0,Math.min(1,t-1));
  for (let i = 0; i < N; i++) {
      const x = greenList[i]*(w/2-40)/Math.PI + 3*w/4;
      const xNorm = (x-3*w/4)*(Math.PI/2)/(h/6);
      const y = h/4 - h/6*Math.atan(xNorm)/(Math.PI/2);
      if (x > w/2+20 && x < w-20){
        drawLine2D(ctx2,x,y,(1-t2)*x + t2*3*w/4,y, {lineWidth:1})
        if (t2 == 1){
          ctx2.beginPath();
          ctx2.arc(3*w/4, y, 5, 0, 2 * Math.PI);
          ctx2.fillStyle = "red";
          ctx2.fill();
          ctx2.closePath();
        }
      }
    }

  //animate axis-movement
  
  t3 = Math.max(0,Math.min(1,t-2.5));
  t4 = Math.max(0,Math.min(1,t-4));
  drawVector2D(ctx2,(1-t3)*(w/2+20) + t3*w/8, (1-t3)*h/4 + t3*h,(1-t3)*(w-20) + t3*w/8,(1-t3)*h/4+t3*0,{color:"lightgreen"});
  drawVector2D(ctx2,(1-t3)*3*w/4+t3*3*w/8, (1-t3)*(h/2-20) + t3*h,(1-t3)*3*w/4+t3*3*w/8,(1-t3)*20+t3*0,{color:"red"});
  for (let i = 0; i < N; i++) {
      const x = greenList[i]*(w/2-40)/Math.PI + 3*w/4;
      const xNorm = (x-3*w/4)*(Math.PI/2)/(h/6);
      const y = h/4 - h/6*Math.atan(xNorm)/(Math.PI/2);
      const xGreen = (1-t3)*x + t3*w/8;
      const yGreen = (1-t3)*h/4 + t3*(h/2-h/Math.PI*greenList[i]);
      const xRed = (1-t3)*3*w/4+t3*3*w/8;
      const yRed = (1-t3)*y + t3*(h/2-h/6*h/mapHeight*Math.atan(xNorm)/(Math.PI/2));
      const xMiddle = (1-t3)*x +  t3*w/4;
      const yMiddle = (1-t3)*y + t3*1/2*(h/2-h/Math.PI*greenList[i]+h/2-h/6*h/mapHeight*Math.atan(xNorm)/(Math.PI/2));
      if (x > w/2+20 && x < w-20 && t>2.5){
        
        ctx2.beginPath();
        ctx2.arc(xGreen, yGreen, 5, 0, 2 * Math.PI);
        ctx2.fillStyle = "lightgreen";
        ctx2.fill();
        ctx2.closePath();
        
        ctx2.beginPath();
        ctx2.arc(xRed, yRed, 5, 0, 2 * Math.PI);
        ctx2.fillStyle = "red";
        ctx2.fill();
        ctx2.closePath();
        drawLine2D(ctx2,xGreen, yGreen, xMiddle, yMiddle, {lineWidth:1});
        drawLine2D(ctx2, xMiddle, yMiddle, xRed, yRed, {lineWidth:1});
      }
      if (t3==1){
        drawLine2D(ctx2,xGreen, yGreen, xMiddle, yMiddle, {lineWidth:1});
        drawLine2D(ctx2, xMiddle, yMiddle, xRed, yRed, {lineWidth:1});
        ctx2.beginPath();
        ctx2.arc(xRed, yRed, 5, 0, 2 * Math.PI);
        ctx2.fillStyle = "red";
        ctx2.fill();
        ctx2.closePath();
        drawLine2D(ctx2,xGreen, yGreen, xMiddle, yMiddle, {lineWidth:1});
        drawLine2D(ctx2, xMiddle, yMiddle, xRed, yRed, {lineWidth:1});

        if (t>=4){
          drawLine2D(ctx2,0,yGreen,xGreen,yGreen,{color:"lightgreen",lineWidth:1,dotted:true});
          ctx2.beginPath();
          ctx2.arc((1-t4)*xGreen + t4*xRed, (1-t4)*yGreen + t4*yRed, 5, 0, 2 * Math.PI);
          ctx2.fillStyle = "red";
          ctx2.fill();
          ctx2.closePath();
        }

        
      }



    }
    
  
  






  // ✅ Draw buttons
  const buttonWidth = Math.round(0.07*w);
  const buttonHeight = Math.round(0.07*w);
  const padding = 10;
  const startX = w/2;
  const startY = h/2 - buttonHeight + 0.15*h;

  const buttons = [
    { label: '⏯️', action: 'togglePlay' },
    { label: '🔄', action: 'reset' },
  ];

  const fontSize = Math.round(buttonHeight * 0.6);  // Or tweak the 0.6 factor
  ctx2.font = `${fontSize}px Arial`;
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";

  buttons.forEach((btn, index) => {
    const x = startX + index * (buttonWidth + padding);
    const y = startY;

    btn.x = x;
    btn.y = y;
    btn.width = buttonWidth;
    btn.height = buttonHeight;

    ctx2.fillStyle = "black";
    ctx2.fillRect(x, y, buttonWidth, buttonHeight);
    ctx2.fillStyle = "white";
    ctx2.fillText(btn.label, x + buttonWidth / 2, y + buttonHeight / 2);
  });

  ctx2.buttons = buttons;
}

// ✅ Control logic for buttons
function handleButtonAction(action) {
  switch (action) {
    case "togglePlay":
      isPlaying = !isPlaying;
      break;
    case "pause":
      isPlaying = false;
      break;
    case "reset":
      t = 0;
      isPlaying = false;
      drawShadedMap();
      drawLeftMap();
      break;
  }
  drawLeftMap();
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

  if (canvas2 && container.contains(canvas2)) {
    container.removeChild(canvas2);
    canvas2 = null;
    ctx2 = null;
  }

  scene = camera = renderer = globe = arrow = controls = null;
}

export default { init, cleanup };
