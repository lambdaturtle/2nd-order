import { canvas } from "./scripts.js";
import { Star, Point, HilbertBall, Site } from "./default-objects.js";
import { spaceManager } from "./scripts.js";
import { centroid } from "./default-functions.js";

export let flameIntensity = 0;

const sprite = {
    x: 0,
    y: 0,
    prevDisplacement: { x: 0, y: 0 },
    rotation: 0,
    image: new Image(),
};

sprite.image.src = "../../ROCKET.png";

function getIncenter(polygon) {
    const n = polygon.vertices.length;
    if (n < 3) return null;
  
    let perimeter = 0;
    let incenterX = 0;
    let incenterY = 0;
  
    for (let i = 0; i < n; i++) {
      const vCurr = polygon.vertices[i];
      const vNext = polygon.vertices[(i + 1) % n];
      
      const sideLength = distance(vCurr, vNext);
      perimeter += sideLength;
      
      incenterX += sideLength * vCurr.x;
      incenterY += sideLength * vCurr.y;
    }
  
    incenterX /= perimeter;
    incenterY /= perimeter;
  
    return new Point(incenterX, incenterY);
  }
  
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

function updateStarsPositions(dx, dy) {
    const canvasEl = document.getElementById("canvas");
    const width = canvasEl.width;
    const height = canvasEl.height;
    const parallaxFactor = 30;
  
    canvas.stars.forEach(star => {
      star.x += dx * parallaxFactor;
      star.y += dy * parallaxFactor;
  

      if (star.x < 0) {
        star.x += width;
      } else if (star.x > width) {
        star.x -= width;
      }

      if (star.y < 0) {
        star.y += height;
      } else if (star.y > height) {
        star.y -= height;
      }
    });
  }

  function generateStars(numStars) {
    canvas.stars = [];
    const canvasEl = document.getElementById("canvas");
    const canvasWidth = canvasEl.width;
    const canvasHeight = canvasEl.height;
  
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      canvas.stars.push(new Star(x, y, Math.random() * 2 + 1));
    }
}

function hasOverlap(candidate, asteroids) {
    for (let other of asteroids) {
      const inter = candidate.polygon.intersectWithPolygon(other.polygon);
      if (inter && inter.length > 0) {
        return true;
      }
      if (candidate.polygon.contains(other) || other.polygon.contains(candidate)) {
        return true;
      }
    }
    return false;
  }
  
  function randomPointNearPolygonEdge(polygon, offset = 0.0001) {
    let offsetFactor = offset + Math.random() * 0.3;
    const segments = polygon.segments;
    const seg = segments[Math.floor(Math.random() * segments.length)];
    
    const t = Math.random();
    const edgePoint = {
      x: seg.start.x + t * (seg.end.x - seg.start.x),
      y: seg.start.y + t * (seg.end.y - seg.start.y)
    };
  
    const center = centroid(polygon.vertices);
    
    const dx = center.x - edgePoint.x;
    const dy = center.y - edgePoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const offsetX = (dx / dist) * (offsetFactor * dist);
    const offsetY = (dy / dist) * (offsetFactor * dist);
    
    return {
      x: edgePoint.x + offsetX,
      y: edgePoint.y + offsetY
    };
  }
    
  export function generateHilbertAsteroids(numAsteroids) {
    canvas.asteroids = [];
    let attempts = 0;
    const maxAttempts = numAsteroids * 10; 
    
    while (canvas.asteroids.length < numAsteroids && attempts < maxAttempts) {
      attempts++;
      const { x, y } = randomPointNearPolygonEdge(canvas.polygon);
      const centerSite = new Site(x, y, canvas.polygon, "gray");
      centerSite.setDrawSpokes(false);
    
      const radius = 0.05 + Math.random() * 0.1; 
      const candidate = new HilbertBall(centerSite, radius, 1, "gray");
      
      if (hasOverlap(candidate, canvas.asteroids)) {
        continue;
      }
      
      canvas.asteroids.push(candidate);
    }
  }
  
document.getElementById("spriteModeButton").addEventListener("click", () => {
  canvas.spriteMode = !canvas.spriteMode;
  
  if (canvas.spriteMode) {
    
    canvas.initialPolygon = canvas.polygon;
    spaceManager.storeOriginalOriginalGeometry();
    
  
    if (window.canvas) {
      canvas.selectionOrder = [];
      canvas.segments = [];
      canvas.bisectors = [];
      canvas.thompsonBisectors = [];
    }
  
    generateHilbertAsteroids(25);
    
    generateStars(2000);
    if (window.canvas && canvas.polygon) {
      canvas.polygon.setFill("black");
    }
  
    updateSpriteToCentroid();
    sprite.prevDisplacement = { x: 0, y: 0 };
    canvas.sprite = sprite;

    flameLoop();
  

    document.getElementById("toggleAsteroidsButton").style.display = "inline-block";
    document.getElementById("toggleBackgroundButton").style.display = "inline-block";
    canvas.drawAll();
  } else {
    canvas.polygon = canvas.initialPolygon;
    document.getElementById("toggleAsteroidsButton").style.display = "none";
    document.getElementById("toggleBackgroundButton").style.display = "none";
    canvas.drawAll();
  }
});
  
function updateSpriteToCentroid() {
    const center = getIncenter(canvas.polygon) || centroid(canvas.polygon.vertices);
    sprite.x = center.x;
    sprite.y = center.y;
}
  
let spriteSpeed = 0.005; 
let isMoving = false;
let keysPressed = {};

function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    return a + diff * t;
  }


function flameLoop() {
    const targetFlameIntensity = isMoving ? 1 : 0;
    const flameLerpFactor = 0.1;
    flameIntensity = flameIntensity + (targetFlameIntensity - flameIntensity) * flameLerpFactor;
    canvas.drawAll();
    requestAnimationFrame(flameLoop);
}
  
function updateSpritePosition() {

    
  if (!canvas.spriteMode) return;


  spaceManager.storeOriginalGeometry();
  
  let dx = 0, dy = 0;
  
  if (keysPressed["ArrowUp"])    dy += spriteSpeed;
  if (keysPressed["ArrowDown"])  dy -= spriteSpeed;
  if (keysPressed["ArrowLeft"])  dx += spriteSpeed;
  if (keysPressed["ArrowRight"]) dx -= spriteSpeed;
  
  if (dx !== 0 && (dx * sprite.prevDisplacement.x < 0)) {
      sprite.prevDisplacement.x = 0;
  }
  if (dy !== 0 && (dy * sprite.prevDisplacement.y < 0)) {
      sprite.prevDisplacement.y = 0;
  }
  
  let displacement = { x: dx, y: dy };
  

  updateStarsPositions(dx, dy);

  let velocityVector = {
      x: sprite.prevDisplacement.x + displacement.x,
      y: sprite.prevDisplacement.y + displacement.y,
  };
  
  spaceManager.projectPoints(velocityVector);
  
  sprite.prevDisplacement = velocityVector;
  
  let newCentroid = centroid(canvas.polygon.vertices);
  sprite.x = newCentroid.x;
  sprite.y = newCentroid.y;
  
  if (dx !== 0 || dy !== 0) {
    const targetRotation = Math.atan2(dy, dx) - Math.PI / 2;
      const smoothingFactor = 0.1;
      sprite.rotation = lerpAngle(sprite.rotation, targetRotation, smoothingFactor);
  }

  canvas.sprite = sprite;
  canvas.drawAll();

 if (isMoving) {
    requestAnimationFrame(updateSpritePosition);
 }
  
}
  
document.addEventListener("keydown", (event) => {
    if (!canvas.spriteMode) return;
  
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        keysPressed[event.key] = true;
        
        if (!isMoving) {
            isMoving = true;
            updateSpritePosition();
        }
    }

    canvas.keyPressed = true;
    canvas.drawAll();
});
  
document.addEventListener("keyup", (event) => {
    if (keysPressed[event.key]) {
        delete keysPressed[event.key];
        if (Object.keys(keysPressed).length === 0) {
            isMoving = false;
            canvas.keyPressed = false;
        }
    }
    
    canvas.drawAll();
});

const toggleButton = document.getElementById("toggleAsteroidsButton");

toggleButton.addEventListener("click", () => {
  canvas.showAsteroids = !canvas.showAsteroids;
  if (!canvas.showAsteroids && canvas.asteroids.length > 0) {
    canvas.asteroids = [];
    toggleButton.textContent = "Turn On Asteroids";
  } else {
    generateHilbertAsteroids(30);
    toggleButton.textContent = "Turn Off Asteroids";
  }
  canvas.drawAll();
});

const toggleBackgroundButton = document.getElementById("toggleBackgroundButton");

toggleBackgroundButton.addEventListener("click", () => {
  canvas.showBackground = !canvas.showBackground;
  if (!canvas.showBackground) {
    toggleBackgroundButton.textContent = "Turn On Background";
  } else {
    toggleBackgroundButton.textContent = "Turn Off Background";
  }
  canvas.drawAll();
});
