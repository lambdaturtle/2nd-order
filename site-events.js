import { Bisector, HilbertBall, MiddleSector, Point, Site } from "./default-objects.js";
import { createHilbertMinimumEnclosingRadiusBall, hilbertDistance, createScatterPlot, findHilbertCircumCenter, drawBisectorsOfHilbertCircumcenter } from "../../default-functions.js";
import { SiteManager } from "./site.js";
import { isAnyModalOpen } from "./scripts-json-events.js";
import { hilbertMidpoint } from "./default-functions.js";
import { BisectorManager } from "./bisector.js";

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


export function initMouseActions(siteManager) {
    const canvasElement = siteManager.canvas.canvas;

    if (siteManager._listenersAttached) {
        destroyMouseActions(siteManager);
    }
    siteManager._mouseDownHandler = (event) => {
        if (event.shiftKey) {
            siteManager.startDragSelect(event);
        } else {
            siteManager.startDragging(event);
        }
    };

    siteManager._mouseMoveHandler = (event) => {
        if (siteManager.isDragSelecting) {
            siteManager.updateDragSelect(event);
        } else {
            siteManager.dragSite(event);
            if (siteManager.hilbertDistanceManager.active) {
                siteManager.hilbertDistanceManager.updateSavedDistances();
            }
        }
    };

    siteManager._mouseUpHandler = (event) => {
        if (siteManager.isDragSelecting) {
            siteManager.endDragSelect(event);
        } else {
            siteManager.stopDragging();
        }
    };

    siteManager._clickHandler = (event) => {
        const { x, y } = siteManager.canvas.getMousePos(event);
        const point = new Point(x, y);
        if (event.shiftKey) {
            siteManager.selectSite(event, true);
        } else {
            siteManager.selectSite(event);
            siteManager.selectSegment(point);
        }
    };

    siteManager._keyDownHandler = (event) => {
        if (!isAnyModalOpen() && (event.key === 'Delete' || event.key === 'Backspace')) {
            siteManager.removeSelectedSegment();
        }
    };

    // Add event listeners
    canvasElement.addEventListener('mousedown', siteManager._mouseDownHandler);
    canvasElement.addEventListener('mousemove', siteManager._mouseMoveHandler);
    canvasElement.addEventListener('mouseup', siteManager._mouseUpHandler);
    canvasElement.addEventListener('click', siteManager._clickHandler);
    document.addEventListener('keydown', siteManager._keyDownHandler);

    siteManager._listenersAttached = true;
}

export function destroyMouseActions(siteManager) {
    const canvasElement = siteManager.canvas.canvas;
    
    if (siteManager._listenersAttached) {
        canvasElement.removeEventListener('mousedown', siteManager._mouseDownHandler);
        canvasElement.removeEventListener('mousemove', siteManager._mouseMoveHandler);
        canvasElement.removeEventListener('mouseup', siteManager._mouseUpHandler);
        canvasElement.removeEventListener('click', siteManager._clickHandler);
        document.removeEventListener('keydown', siteManager._keyDownHandler);
        
        delete siteManager._mouseDownHandler;
        delete siteManager._mouseMoveHandler;
        delete siteManager._mouseUpHandler;
        delete siteManager._clickHandler;
        delete siteManager._keyDownHandler;
        
        siteManager._listenersAttached = false;
    }
}

function getChangedProperties() {
    const changedProperties = {};
    const siteColor = document.getElementById('siteColor');
    const siteShowInfo = document.getElementById('siteShowInfo');
    const siteDrawSpokes = document.getElementById('siteDrawSpokes');
    const labelInput = document.getElementById('labelInput');

    if (siteColor.value !== siteColor.defaultValue) {
        changedProperties.color = true;
    }
    if (siteShowInfo.checked !== siteShowInfo.defaultChecked) {
        changedProperties.showInfo = true;
    }
    if (siteDrawSpokes.checked !== siteDrawSpokes.defaultChecked) {
        changedProperties.drawSpokes = true;
    }
    if (labelInput.value !== labelInput.defaultValue) {
        changedProperties.label = true;
    }
    return changedProperties;
}

function updateSiteProperties(manager) {
    const changedProperties = getChangedProperties();
    const selectedSites = manager.canvas.sites.filter(site => site.selected);

    if (selectedSites.length === 1) {
        const site = selectedSites[0];
        site.color = document.getElementById('siteColor').value;
        site.showInfo = document.getElementById('siteShowInfo').checked;
        site.drawSpokes = document.getElementById('siteDrawSpokes').checked;
        site.label = document.getElementById('labelInput').value;
    } else if (selectedSites.length > 1) {

        manager.canvas.sites.forEach(site => {
            if (site.selected) {
                if (changedProperties.color && document.getElementById('siteColor').value !== '') {
                    site.color = document.getElementById('siteColor').value;
                    document.getElementById('siteColor').defaultValue = site.color; 
                }
                if (changedProperties.showInfo) {
                    site.showInfo = document.getElementById('siteShowInfo').checked;
                    document.getElementById('siteShowInfo').defaultChecked = site.showInfo; 
                }
                if (changedProperties.drawSpokes) {
                    site.drawSpokes = document.getElementById('siteDrawSpokes').checked;
                    document.getElementById('siteDrawSpokes').defaultChecked = site.drawSpokes;
                }
                if (changedProperties.label) {
                    site.label = document.getElementById('labelInput').value;
                    document.getElementById('labelInput').defaultValue = site.label;
                }
            }
        });
    }

    manager.canvas.drawAll();
}

export function initProperties(siteManager) {
    const debouncedUpdateSiteProperties = debounce(() => updateSiteProperties(siteManager), 0);
    document.getElementById('siteColor').addEventListener('input', debouncedUpdateSiteProperties);
    document.getElementById('siteShowInfo').addEventListener('change', debouncedUpdateSiteProperties);
    document.getElementById('siteDrawSpokes').addEventListener('change', debouncedUpdateSiteProperties);
    document.getElementById('labelInput').addEventListener('input', debouncedUpdateSiteProperties);
    document.getElementById('labelInput').addEventListener('blur', debouncedUpdateSiteProperties);
}

export function initShortcuts(siteManager) {
  document.addEventListener('keydown', (event) => {
    if (siteManager.active && (event.key === 'Delete' || event.key === 'Backspace')) {
      siteManager.removeSite();
    }
  });
}

export function initLabelInput() {
    const labelInput = document.getElementById('labelInput');
    labelInput.addEventListener('input', function() {
        this.style.width = (this.value.length + 1) + 'ch';
    });

    labelInput.style.width = (labelInput.placeholder.length + 1) + 'ch';

    labelInput.addEventListener('keydown', function(event) {
        if (event.key === 'Delete' || event.key === 'Backspace' || event.key === 't') {
            event.stopPropagation();
        }
    });
}

export function initContextMenu(siteManager) {

    const contextMenu = document.getElementById('contextMenu');
    const calculateHilbertDistanceItem = document.getElementById('calculateHilbertDistance');
    const saveHilbertDistanceItem = document.getElementById('saveHilbertDistance');
    const drawBisector = document.getElementById('drawBisector');
    const drawThompsonBisector = document.getElementById('drawThompsonBisector');

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    siteManager.canvas.canvas.addEventListener('contextmenu', (event) => {
        if (siteManager.checkTwoSitesSelected()) {

            event.preventDefault();
            const { clientX: mouseX, clientY: mouseY } = event;
            contextMenu.style.top = `${mouseY}px`;
            contextMenu.style.left = `${mouseX}px`;
            contextMenu.style.display = 'block';

            if (siteManager.canvas.activeManager === 'HilbertDistanceManager') {
                saveHilbertDistanceItem.style.display = 'block';
                calculateHilbertDistanceItem.style.display = 'block';
            } else {
                calculateHilbertDistanceItem.style.display = 'block';
                saveHilbertDistanceItem.style.display = 'none';
            }

            drawBisector.style.display = 'block';
            drawThompsonBisector.style.display = 'block';

        } else {
            contextMenu.style.display = 'none';
        }
    });

    if (!calculateHilbertDistanceItem.dataset.initialized) {

        calculateHilbertDistanceItem.addEventListener('click', () => {
            console.log('Calculate Hilbert Distance selected');
            console.log(siteManager.getSelectedSites());
            const selectedSites = siteManager.getSelectedSites();

            if (selectedSites.length === 2) {
                siteManager.hilbertDistanceManager.onTwoSitesSelected(selectedSites);
            }
            contextMenu.style.display = 'none';
        });

        drawThompsonBisector.addEventListener('click', () => {
            console.log('Draw Bisector Selected');
            const selectedSites = siteManager.getSelectedSites();
            siteManager.hilbertDistanceManager.ensureLabels(selectedSites);
            if (selectedSites.length === 2) {
                siteManager.bisectorManager.createThompsonBisector(selectedSites[0], selectedSites[1]);
            }
            contextMenu.style.display = 'none';
        });

        saveHilbertDistanceItem.addEventListener('click', () => {
            console.log('Save Hilbert Distance selected');
            const selectedSites = siteManager.getSelectedSites();
            if (selectedSites.length === 2) {
                siteManager.hilbertDistanceManager.addSavedDistance(selectedSites);
            }
            contextMenu.style.display = 'none';
        });

        drawBisector.addEventListener('click', () => {
            console.log('Draw Bisector Selected');
            const selectedSites = siteManager.getSelectedSites();
            siteManager.hilbertDistanceManager.ensureLabels(selectedSites);
            if (selectedSites.length === 2) {
                siteManager.bisectorManager.createBisector(selectedSites[0], selectedSites[1]);
            }
            contextMenu.style.display = 'none';
        });

        calculateHilbertDistanceItem.dataset.initialized = true;
        saveHilbertDistanceItem.dataset.initialized = true;
        drawBisector.dataset.initialized = true;
    }
}
