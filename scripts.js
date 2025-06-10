import { Canvas } from "../canvas/canvas.js";
import { SiteManager } from "../site/site.js";
import { HilbertBallManager } from "../hilbert-ball/hilbert-ball.js";
import { BisectorManager } from "../bisector/bisector.js";
import { HilbertDistanceManager } from "../hilbert-distance/hilbert-distance.js";
import { SpaceManager } from "../space/space.js";

import { 
    initializeDropdowns, 
    initializeAddSiteListener, 
    initCollapsibleAnimation,
} from "./scripts-events.js";
import { initializeJsonHandlers, isAnyModalOpen } from "./scripts-json-events.js";

let canvasElement = document.getElementById('canvas');
let canvas = new Canvas(canvasElement);

let hilbertDistanceManager = new HilbertDistanceManager(canvas);
let bisectorManager = new BisectorManager(canvas);
let siteManager = new SiteManager(canvas, hilbertDistanceManager, bisectorManager);
let spaceManager = new SpaceManager(canvas);

canvas.setHilbertDistanceManager(hilbertDistanceManager);
bisectorManager.setSiteManager(siteManager);

let managers = [
    new HilbertBallManager(canvas, hilbertDistanceManager, bisectorManager),
    siteManager,
    hilbertDistanceManager,
    bisectorManager,
    spaceManager
];

document.addEventListener('DOMContentLoaded', () => {
    initializeDropdowns(managers, canvas.mode, canvas);
    initCollapsibleAnimation();
    initializeAddSiteListener(canvasElement, managers, canvas);
    initializeJsonHandlers(canvas, hilbertDistanceManager, managers);
});

export { canvas, spaceManager };