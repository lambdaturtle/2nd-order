// canvas/canvas.js
import { ConvexPolygon, Point, SelectableSegment, HilbertBall,Site } from "./default-objects.js";
import { drawInfoBox, clearInfoBoxes, renderAllKaTeX, hidePiGradientBar, createPiMap, createScatterPlot, centroid } from "./default-functions.js";
import { initEvents } from "./canvas-events.js";
import { flameIntensity } from "./space/sprite.js";

export class Canvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        const dpr = window.devicePixelRatio;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.dpr = dpr;

        this.polygon = new ConvexPolygon();
        this.mode = 'Convex';
        this.selectedProgram = 'Site';
        initEvents(this);
        this.activeManager = 'SiteManager';
        this.hilbertDistanceManager = null;

        this.polygonType = 'freeDraw';
        this.canvasWidth = 1500;
        this.canvasHeight = 850;

        this.customNgonInput = document.getElementById('customNgonInput');
        this.createCustomNgonButton = document.getElementById('createCustomNgon');

        this.ngonVertices = [];

        this.sites = [];
        this.selectionOrder = [];
        this.segments = [];
        this.bisectors = [];
        this.thompsonBisectors = [];

        this.globalScale = 1.0;

        this.showCentroid = false;
        
        this.spriteMode = false;
        this.stars = [];
        this.asteroids = [];
        this.sprite = null;
        
        this.showAsteroids = false;
        this.showBackground = true;

    }
    
    setPolygonType(type) {
        this.polygonType = type;
        if (type === 'customNgon') {
            const n = parseInt(this.customNgonInput.value);
            if (n >= 3) {
                this.createNgon(n);
            } else {
                alert('Please enter a number greater than or equal to 3.');
                return;
            }
        } else if (type !== 'freeDraw') {
            this.createNgon(parseInt(type));
        } else {
            this.resetCanvas();
        }
        this.sites = this.sites.filter(site => this.polygon.contains(site));
        this.sites.forEach(site => {
            site.setPolygon(this.polygon);
            site.computeSpokes();
            site.computeHilbertBall?.();
        });
        this.drawAll();
    }
    
    createNgon(n) {
        const canvasCenterX = this.canvas.width / (2 * this.dpr);
        const canvasCenterY = this.canvas.height / (2 * this.dpr);
        
        const radius = Math.min(this.canvas.width, this.canvas.height) / (2.5 * this.dpr);
        
        this.polygon = new ConvexPolygon();
        
        const tempVertices = [];
        for (let i = 0; i < n; i++) {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            tempVertices.push({x, y});
        }
        
        const centroidX = tempVertices.reduce((sum, v) => sum + v.x, 0) / n;
        const centroidY = tempVertices.reduce((sum, v) => sum + v.y, 0) / n;
        
        for (const vertex of tempVertices) {
            const adjustedX = canvasCenterX + (vertex.x - centroidX);
            const adjustedY = canvasCenterY + (vertex.y - centroidY);
            this.polygon.addVertex(new Point(adjustedX, adjustedY));
        }
    }

    setHilbertDistanceManager(hilbertDistanceManager) {
        this.hilbertDistanceManager = hilbertDistanceManager;
    }

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const rawX = event.clientX - rect.left;
        const rawY = event.clientY - rect.top;
      

        let sceneX = rawX;
        let sceneY = rawY;
    
        sceneX /= this.globalScale;
        sceneY /= this.globalScale;
      
        return { x: sceneX, y: sceneY };
    }

    addPolygonPoint(event) {
        if (this.polygonType === 'freeDraw') {
            const { x, y } = this.getMousePos(event);
            this.polygon.addVertex(new Point(x, y));
            this.polygon.showInfo = document.getElementById('polygonShowInfo').checked;
            this.drawAll();
        }
    }
    
    calculateCenter(points) {
        const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        return new Point(x, y);
    }
    
    calculateRadius(center, points) {
        return Math.max(...points.map(p => 
            Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2))
        ));
    }

    setPolygonColor(event) {
        this.polygon.setColor(event.target.value);
        this.drawAll();
    }

    setPolygonShowInfo(event) {
        this.polygon.setShowInfo(event.target.checked);
        this.drawAll();
    }

    setPolygonShowCentroid() {
        this.showCentroid = true;
        this.drawAll();
    }

    setPolygonShowDiagonals(event) {
        this.polygon.setShowDiagonals(event.target.checked);
        this.drawAll();
    }

    addBisector(bisector) {
        this.bisectors.push(bisector);
        this.drawAll();
    }

    drawPiMap() {
        if (this.polygon.vertices.length > 2) {
            let stepSize;
            let isValidInput = false;
    
            while (!isValidInput) {
                stepSize = prompt("Enter a step size for level curves or 0 for the full heat map");
    
                if (stepSize === null) {
                    return;
                } else if (stepSize === "" || isNaN(Number(stepSize))) {
                    alert("Please enter a valid number.");
                } else {
                    isValidInput = true;
                    stepSize = Number(stepSize);
                }
            }

            let radius = prompt("Enter a Hilbert Ball Radius");
            if (radius === null) {
                return;
            } else if (radius === "" || isNaN(Number(radius))) {
                alert("Please enter a valid number.");
            } else {
                if (Number(radius > 0)) {
                    isValidInput = true;
                    radius = Number(radius);
                } else {
                    alert("Please enter a valid radius.");
                }
            }
    
            if (stepSize > 0) {
                createPiMap(this.ctx, 1, this.polygon, stepSize, radius);
            } else {
                createPiMap(this.ctx, 1, this.polygon, -1, radius);
            }
        } else {
            alert('Polygon must have 3 or more vertices');
        }
    }

    drawSegments() {
        this.segments.forEach(segment => {
            segment.draw(this.ctx);
        });
    }   

    deselectAllSites() {
        this.sites.forEach(site => {
            site.setSelected(false);
        });
        this.drawAll();
    }

    drawTeardropFlame(
        ctx,
        x,
        y,
        rotation,
        flameHeight,
        topWidth,
        bottomWidth,
        flickerStrength = 0,
        colorStart = "white",
        colorMiddle = "lightblue",
        colorEnd = "transparent"
      ) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
      
        const rocketHalfHeight = 40;
        ctx.translate(0, rocketHalfHeight);
      
        const flicker = (Math.random() - 0.5) * flickerStrength;
      
        const gradient = ctx.createLinearGradient(
          0,
          0,
          0,
          flameHeight + flicker
        );
        gradient.addColorStop(0, colorStart);   
        gradient.addColorStop(0.5, colorMiddle);  
        gradient.addColorStop(1, colorEnd);     
      
        ctx.shadowColor = "rgba(63, 182, 255, 0.5)";
        ctx.shadowBlur = 20;                   
      
        ctx.fillStyle = gradient;
      

        ctx.beginPath();
        ctx.moveTo(0, 0);
      
        ctx.bezierCurveTo(
          -bottomWidth * 0.5, flameHeight * 0.3, 
          -bottomWidth * 0.5, flameHeight * 0.7, 
          0, flameHeight + flicker              
        );
      
        ctx.bezierCurveTo(
          bottomWidth * 0.5, flameHeight * 0.7,  
          bottomWidth * 0.5, flameHeight * 0.3,  
          0, 0                                   
        );
        ctx.closePath();
      
        const scaleX = topWidth / bottomWidth;
        ctx.save();
        ctx.scale(scaleX, 1);
        ctx.fill();
        ctx.restore();
      
        ctx.restore();
      }

    drawSprite(ctx) {
        if (!this.spriteMode || !this.sprite) return;
    
        const { x, y, rotation, image } = this.sprite;
        const width = 50;
        const height = 80;
    
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.shadowColor = "rgba(255, 200, 0, 0.8)";
        ctx.shadowBlur = 20;
        ctx.restore();
    }

    drawAll() {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.polygon.draw(this.ctx);
        
    
        if (this.spriteMode) {
            
            if (this.showBackground) {
                this.polygon.fill(this.ctx);
                this.stars.forEach(star => {
                    if (this.polygon.contains({ x: star.x, y: star.y })) {
                        star.draw(this.ctx);
                    }
                });
            }
            
            
            if (this.showAsteroids) {
                this.asteroids.forEach(asteroid => {
                    asteroid.setDraw(false);
                    asteroid.setTextureEnabled(true);
                    asteroid.draw(this.ctx);
                });
            }
            
            this.drawSprite(this.ctx);
            
            if (flameIntensity > 0.01) {
                this.drawTeardropFlame(
                    this.ctx,
                    this.sprite.x,
                    this.sprite.y,
                    this.sprite.rotation,
                    40 * flameIntensity,      
                    10 * flameIntensity, 
                    20 * flameIntensity, 
                    10 * flameIntensity,
                    "white",
                    "lightblue",
                    "transparent"
                );
            }

            if (this.polygon && this.showCentroid) {
                this.centroid = centroid(this.polygon.vertices);
                this.drawXMarker(this.centroid, 'red', 10);
            }

            this.sites.forEach(site => {
                site.draw(this.ctx);
            });
            
        } else {    
            this.thompsonBisectors = this.thompsonBisectors.filter(thompBobj => {
                if (this.sites.includes(thompBobj.site1) && this.sites.includes(thompBobj.site2)) {
                    thompBobj.draw(this.ctx);
                    return true;
                }
                return false;
            })
    
            this.sites.forEach(site => {
                site.computeSpokes();
                site.computeHilbertBall?.();
                site.computeMultiBall?.();
                site.draw(this.ctx);
            });
    
            this.bisectors.forEach(bisector => {
                bisector.computeBisector(bisector.s1, bisector.s2);
                bisector.draw(this.ctx);
            }); 
    
            this.drawSegments();
    
            if (this.polygon && this.showCentroid) {
                this.centroid = centroid(this.polygon.vertices);
                this.drawXMarker(this.centroid, 'red', 10);
            }
    
            clearInfoBoxes();
    
            if (this.polygon.showInfo) {
                this.polygon.vertices.forEach(vertex => {
                    if (vertex.showInfo) drawInfoBox(vertex, this.canvas, this.dpr);
                });
            }
    
            this.sites.forEach(site => { if (site.showInfo) drawInfoBox(site, this.canvas, this.dpr); });
    
            renderAllKaTeX();
        }

        
    }

    drawXMarker(point, color = 'red', size = 10) {
        if (!point) return; 
    
        const ctx = this.ctx;
        ctx.save();
    
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
    
        const x1 = point.x - size / 2;
        const x2 = point.x + size / 2;
        const y1 = point.y - size / 2;
        const y2 = point.y + size / 2;
    
        ctx.beginPath();
        ctx.moveTo(x1, y1); 
        ctx.lineTo(x2, y2);
        ctx.moveTo(x1, y2);
        ctx.lineTo(x2, y1);
        ctx.stroke();
    
        ctx.restore();
    }

    resetCanvas() {
        this.sites = [];
        this.segments = [];
        this.bisectors = [];
        this.ngonVertices = [];
        this.polygon = new ConvexPolygon([], this.polygon.color, this.polygon.penWidth, this.polygon.showInfo, this.polygon.showVertices, this.polygon.vertexRadius);
        this.thompsonBisectors = [];

        if (this.hilbertDistanceManager) {
            this.hilbertDistanceManager.resetLabels();
        }
        
        hidePiGradientBar();

        this.polygonType = 'freeDraw';
        document.querySelector('input[name="polygonType"][value="freeDraw"]').checked = true;

        this.drawAll();
    }
}

