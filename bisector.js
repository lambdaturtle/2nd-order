import { Bisector, ConvexPolygon, MiddleSector, Point, ThompsonBisector } from "../../default-objects.js";
import { drawPieceForIntersection, isIntersectionPixel, intersectTwoBisector, intersectThreeBisector, thompsonDistance } from "../../default-functions.js";

export class BisectorManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.name = 'BisectorManager';
        this.selectedSites = [];
        this.savedBisectors = [];
        this.initializeIntersectionButton();
    }

    setSiteManager(siteManager) {
        this.siteManager = siteManager;
    }   

    initializeIntersectionButton() {
        const button = document.getElementById('calculateIntersectionButton');
        if (button) {
            button.addEventListener('click', this.calculateIntersection.bind(this));
            button.style.display = 'none';
        }
    }

    test() {
        let ctx = this.canvas.ctx;
        let middleSector = new MiddleSector(this.s1, this.s2, this.canvas.polygon);
        let bisector = new Bisector(middleSector, ctx);
        bisector.draw(ctx);
    }

    createBisector(s1, s2) {
        let middleSector = new MiddleSector(s1, s2, this.canvas.polygon);
        let bisector = new Bisector(middleSector);

        this.canvas.addBisector(bisector);
        this.addSavedBisector([s1, s2], bisector);
    }

    addSavedBisector(selectedSites, bisector) {
        const [site1, site2] = selectedSites;
        
        this.savedBisectors.push({
            points: [site1.label, site2.label],
            colors: [site1.color, site2.color],
            bisectorObj: bisector,
        });
    
        this.updateSavedBisectorsList();
    }

    updateSavedBisectorsList() {
        const savedBisectorsContainer = document.getElementById('savedBisectorsContainer');
        const savedBisectorsList = document.getElementById('savedBisectorsList');
        savedBisectorsList.innerHTML = '';
    
        this.savedBisectors.forEach((bisector, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'saved-distance-item';
    
            const span = document.createElement('span');
            const formula = `Bisector(\\color{${bisector.colors[0]}}{${bisector.points[0]}}\\color{black}{, }\\color{${bisector.colors[1]}}{${bisector.points[1]}}\\color{black}{)}`;
    
            katex.render(formula, span, {
                throwOnError: false,
                displayMode: false
            });

            const iconsWrapper = document.createElement('div');
            iconsWrapper.className = 'icons-wrapper';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'bisector-checkbox';
            checkbox.dataset.index = index;
            checkbox.onchange = this.updateIntersectionButton.bind(this);
    
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-times delete-icon';
            deleteIcon.onclick = () => {

                checkbox.checked = false;
                this.updateIntersectionButton();
                this.savedBisectors = this.savedBisectors.filter(b => b !== bisector);
                this.canvas.bisectors = this.canvas.bisectors.filter(b => b !== bisector.bisectorObj);
                this.updateSavedBisectorsList();
                this.canvas.drawAll();
            };
    
            iconsWrapper.appendChild(deleteIcon);
            listItem.appendChild(span);
            listItem.appendChild(iconsWrapper);
    
            savedBisectorsList.appendChild(listItem);
        });
    
        if (this.savedBisectors.length === 0) {
            savedBisectorsContainer.classList.remove('has-items');
        } else {
            savedBisectorsContainer.classList.add('has-items');
        }
    }

    updateIntersectionButton() {
        const checkedBoxes = document.querySelectorAll('.bisector-checkbox:checked');
        const intersectionButton = document.getElementById('calculateIntersectionButton');
        
        if (intersectionButton) {
            intersectionButton.style.display = checkedBoxes.length > 1 ? 'block' : 'none';
        }
    }

    calculateIntersection() {
        const checkedBoxes = document.querySelectorAll('.bisector-checkbox:checked');
        const selectedBisectors = Array.from(checkedBoxes).map(checkbox => 
            this.savedBisectors[parseInt(checkbox.dataset.index)]
        );
        
        let bisector1, bisector2, bisector3;
        let intersection;

        if (selectedBisectors.length == 2) {
            bisector1 = selectedBisectors[0].bisectorObj;
            bisector2 = selectedBisectors[1].bisectorObj;
            intersection = intersectTwoBisector(bisector1, bisector2);
        } else if (selectedBisectors.length == 3) {
            bisector1 = selectedBisectors[0].bisectorObj;
            bisector2 = selectedBisectors[1].bisectorObj;
            bisector3 = selectedBisectors[2].bisectorObj;
            intersection = intersectThreeBisector(bisector1, bisector2, bisector3);
        }

        intersection.drawWithRing(this.canvas.ctx);
    }

    addSite(site) {
        if (this.selectedSites.length === 1) {
            this.selectedSites.push(site);
            this.createBisector();
            this.selectedSites = [];
        } else {
            this.selectedSites.push(site);
        }
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    createThompsonBisector(s1,s2) {
        const ctx = this.canvas.ctx;
    
        const minX = Math.min(...this.canvas.polygon.vertices.map(v => v.x));
        const maxX = Math.max(...this.canvas.polygon.vertices.map(v => v.x));
        const minY = Math.min(...this.canvas.polygon.vertices.map(v => v.y));
        const maxY = Math.max(...this.canvas.polygon.vertices.map(v => v.y));
    
        let resolution = prompt("Enter resolution (default is 1):");
        if (resolution === null || resolution.trim() === "") {
            resolution = 1;
        } else {
            resolution = parseFloat(resolution);
            if (isNaN(resolution) || resolution <= 0) {
                alert("Invalid input. Using default resolution of 1.");
                resolution = 1;
            }
        }
        let points = [];
    
        for (let x = minX; x <= maxX; x += resolution) {
            for (let y = minY; y <= maxY; y += resolution) {
                const point = new Point(x, y);
    
                if (this.canvas.polygon.contains(point)) {
                    try {
                        const d1 = thompsonDistance(s1, point, this.canvas.polygon);
                        const d2 = thompsonDistance(s2, point, this.canvas.polygon);
        

                        if (Math.abs(d1 - d2) < 1e-2) {
                            point.setRadius(1);
                            point.setColor('red');
                            point.draw(ctx);
                            points.push(point);
                        }
                    } catch (error) {}
                }
            }
        }

        this.canvas.thompsonBisectors.push(new ThompsonBisector(s1,s2,points));
    }
}