//Include this statement in the beginning of your document:
//
//    import { createArcAroundAxis drawVector2D drawLine2D } from './helperFunctions.js';
//



import * as THREE from 'three';


/**
 * Creates a 3D arc (line) around a specified axis in a Three.js scene.
 *
 * @param {number} radius - The radius of the arc (distance from origin).
 * @param {number} startAngle - The starting angle of the arc in radians.
 * @param {number} endAngle - The ending angle of the arc in radians.
 * @param {number} segments - The number of line segments to approximate the arc.
 * @param {THREE.Vector3} axis - The axis vector around which the arc is rotated (normalized internally).
 * @param {THREE.Vector3} startDir - The initial direction vector from which rotation starts (should be perpendicular to axis).
 * @param {number} color - The color of the arc line in hexadecimal (e.g., 0xff0000 for red).
 * @returns {THREE.Line} - A Three.js Line object representing the arc.
 *
 * The function works by:
 * 1. Normalizing the axis of rotation.
 * 2. Normalizing and scaling the start direction vector to the given radius.
 * 3. Iteratively rotating the start vector around the axis by incremental angles from startAngle to endAngle.
 * 4. Collecting the rotated points into a geometry.
 * 5. Creating a line material with the specified color.
 * 6. Returning a THREE.Line object that can be added to the scene.
 */
export function createArcAroundAxis(
  radius = 1.1,
  startAngle = 0,
  endAngle = Math.PI * 2,
  segments = 128,
  axis = new THREE.Vector3(0, 1, 0),
  startDir = new THREE.Vector3(1, 0, 0),
  color = 0xff0000
) {
  // Normalize the axis vector to ensure proper rotation
  const normAxis = axis.clone().normalize();

  // Normalize and scale the starting direction vector by the radius
  const baseVec = startDir.clone().normalize().multiplyScalar(radius);

  // Array to hold points of the arc
  const points = [];

  // Calculate points along the arc by rotating the base vector incrementally around the axis
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // interpolation factor from 0 to 1
    const angle = startAngle + t * (endAngle - startAngle); // current rotation angle

    // Create a quaternion representing rotation around the normalized axis by the current angle
    const quat = new THREE.Quaternion().setFromAxisAngle(normAxis, angle);

    // Apply the quaternion rotation to the base vector to get the new point on the arc
    const rotated = baseVec.clone().applyQuaternion(quat);

    // Store the rotated point
    points.push(rotated);
  }

  // Create a BufferGeometry from the points array
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Create a basic line material with the specified color
  const material = new THREE.LineBasicMaterial({ color });

  // Create and return a THREE.Line object representing the arc
  return new THREE.Line(geometry, material);
}



/**
 * Draw a line on a 2D canvas context.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
 * @param {number} fromX - Starting X coordinate.
 * @param {number} fromY - Starting Y coordinate.
 * @param {number} toX - Ending X coordinate (tip of the arrow).
 * @param {number} toY - Ending Y coordinate (tip of the arrow).
 * @param {object} [options] - Optional styling parameters:
 *   - color: stroke/fill color (default: 'white')
 *   - lineWidth: line width (default: 2)
 *   - dotted: boolean to make the line dotted (default: false)
 */
export function drawLine2D(ctx, fromX, fromY, toX, toY, options = {}) {
  const {
    color = 'white',
    lineWidth = 2,
    dotted = false,
  } = options;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  // Apply dotted line pattern if needed
  if (dotted) {
    ctx.setLineDash([2, 4]); // 2px dash, 4px gap
  } else {
    ctx.setLineDash([]); // solid line
  }

  // Draw main line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.closePath();

  // Optional fill (not usually needed for lines)
  // ctx.fill(); // remove this unless you're drawing a shape

  // Reset line dash so it doesn't affect other drawings
  ctx.setLineDash([]);
}




/**
 * Draw a vector (line + arrowhead) on a 2D canvas context.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
 * @param {number} fromX - Starting X coordinate.
 * @param {number} fromY - Starting Y coordinate.
 * @param {number} toX - Ending X coordinate (tip of the arrow).
 * @param {number} toY - Ending Y coordinate (tip of the arrow).
 * @param {object} [options] - Optional styling parameters:
 *   - color: stroke/fill color (default: 'white')
 *   - lineWidth: line width (default: 2)
 *   - arrowLength: length of the arrowhead (default: 10)
 *   - arrowAngle: angle between arrowhead sides in radians (default: Math.PI / 8)
 */
export function drawVector2D(ctx, fromX, fromY, toX, toY, options = {}) {
  const {
    color = 'white',
    lineWidth = 2,
    arrowLength = 10,
    arrowAngle = Math.PI / 8,
  } = options;

  // Calculate vector direction
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  // Draw main line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle - arrowAngle),
    toY - arrowLength * Math.sin(angle - arrowAngle)
  );
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle + arrowAngle),
    toY - arrowLength * Math.sin(angle + arrowAngle)
  );
  ctx.closePath();
  ctx.fill();
}
