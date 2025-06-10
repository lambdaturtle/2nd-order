// scripts-events.js
import { HilbertDistanceManager } from "../hilbert-distance/hilbert-distance.js";
import { SiteManager } from "../site/site.js";

function setDisplay(element, display) {
    element.style.display = display;
}

function updateCollapsibleVisibility(selectedProgram, managers, canvas) {
    const siteCollapsible = document.getElementById('siteCollapsible');
    const hilbertCollapsible = document.getElementById('hilbertBallCollapsible');
    const ffunkCollapsible = document.getElementById('ffunkBallCollapsible');
    const rfunkCollapsible = document.getElementById('rfunkBallCollapsible');
    const thompsonCollapsible = document.getElementById('thompsonBallCollapsible');
    const savedDistancesContainer = document.getElementById('savedDistancesContainer');
    const savedBisectorsContainer = document.getElementById('savedBisectorsContainer');
    const metricBallSelectionCard = document.getElementById('metricBallSelectionCard'); // New card
    const settingsLabel = document.getElementById('general-settings');
    const siteColorInput = document.getElementById('colorContainer');
    const multiBallRadiusContainer = document.getElementById('multiBallRadiusContainer');
    const spriteModeButton = document.getElementById('spriteModeButton');

    const setDisplay = (element, display) => {
        if (element) element.style.display = display;
    };

    const displayMap = {
        'Metric Balls': () => {
            setDisplay(siteCollapsible, 'block');
            setDisplay(hilbertCollapsible, 'block');
            setDisplay(ffunkCollapsible, 'block');
            setDisplay(rfunkCollapsible, 'block');
            setDisplay(thompsonCollapsible, 'block');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'block'); // Show the card
            setDisplay(settingsLabel, 'block'); 
            setDisplay(siteColorInput, 'none'); 
            setDisplay(multiBallRadiusContainer, 'block');
            setDisplay(spriteModeButton, 'none');

            managers.forEach(manager => {
                if (manager.name === 'HilbertBallManager') {
                    manager.activate();
                    manager.toggleMultiBallSliderVisibility();
                } else manager.deactivate();
            });

            canvas.activeManager = 'HilbertBallManager';
        },
        'Site': () => {
            setDisplay(siteCollapsible, 'block');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none'); 
            setDisplay(settingsLabel, 'block'); 
            setDisplay(siteColorInput, 'block');
            setDisplay(multiBallRadiusContainer, 'none');
            setDisplay(spriteModeButton, 'none');

            managers.forEach(manager => {
                if (manager.name === 'SiteManager') manager.activate();
                else manager.deactivate();
            });

            canvas.activeManager = 'SiteManager';
        },
        'Hilbert Distance': () => {
            setDisplay(siteCollapsible, 'block');
            setDisplay(savedDistancesContainer, 'block');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none'); 
            setDisplay(settingsLabel, 'none'); 
            setDisplay(siteColorInput, 'none'); 
            setDisplay(multiBallRadiusContainer, 'none');
            setDisplay(spriteModeButton, 'none');

            managers.forEach(manager => {
                if (manager.name === 'SiteManager' || manager.name === 'HilbertDistanceManager') {
                    manager.activate();

                    if (manager.name == 'SiteManager') {
                        manager.hilbertDistanceManager.updateSavedDistances();
                    }

                } else {
                    manager.deactivate();
                }
            });

            canvas.activeManager = 'HilbertDistanceManager';
        },
        'Bisector': () => {
            setDisplay(siteCollapsible, 'none');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'block');
            setDisplay(metricBallSelectionCard, 'none');
            setDisplay(siteColorInput, 'none'); 
            setDisplay(multiBallRadiusContainer, 'none');
            setDisplay(spriteModeButton, 'none');

            setDisplay(settingsLabel, 'none'); 

            managers.forEach(manager => {
                if (manager.name === 'SiteManager' || manager.name === 'BisectorManager') {
                    manager.activate();
                } else {
                    manager.deactivate();
                }
            });

            canvas.activeManager = 'BisectorManager';
        },
        'Hilbert Metric Space': () => {
            setDisplay(siteCollapsible, 'none');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none');
            setDisplay(siteColorInput, 'none'); 
            setDisplay(settingsLabel, 'none'); 
            setDisplay(multiBallRadiusContainer, 'none');
            setDisplay(spriteModeButton, 'block');

            managers.forEach(manager => {
                if (manager.name === 'SpaceManager') {
                    manager.activate();
                } else {
                    manager.deactivate();
                }
            });

            canvas.activeManager = 'SpaceManager';
            canvas.deselectAllSites();
        },
        'default': () => {
            setDisplay(siteCollapsible, 'none');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none'); 
            setDisplay(siteColorInput, 'none'); 
            setDisplay(multiBallRadiusContainer, 'none');
            setDisplay(spriteModeButton, 'none');
        }
    };

    (displayMap[selectedProgram] || displayMap['default'])();
}

function initializeDefaultVisibility(mode) {
    const hilbertContainer = document.getElementById('hilbertContainer');
    if (mode === 'Convex') {
        hilbertContainer.style.display = 'none';
    } else {
        hilbertContainer.style.display = 'block';
    }
}

export function initializeDropdowns(managers, mode, canvas) {
    initializeDefaultVisibility(mode);
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const select = dropdown.querySelector('.select');
        const menu = dropdown.querySelector('.menu');
        const options = dropdown.querySelectorAll('.menu li');
        const selected = dropdown.querySelector('.selected');

        select.addEventListener('click', () => {
            menu.classList.toggle('menu-open');
            select.classList.toggle('select-clicked');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                selected.innerText = option.innerText;
                menu.classList.remove('menu-open');
                select.classList.remove('select-clicked');

                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                updateCollapsibleVisibility(option.innerText, managers, canvas);
            });
        });

        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                menu.classList.remove('menu-open');
                select.classList.remove('select-clicked');
            }
        });

        updateCollapsibleVisibility(selected.innerText, managers, canvas); // Initial visibility update
    });
}

export function initializeAddSiteListener(canvasElement, managers, canvas) {
    canvasElement.addEventListener('dblclick', (event) => {
        if (canvas.mode === 'Hilbert') {
            managers.find(manager => {
                if (manager.active && (manager.name === 'SiteManager' || manager.name === 'HilbertBallManager')) {
                    manager.addSite(event);
                    return true;
                }
                return false;
            });
        }
    });
}

export function initCollapsibleAnimation() {
    const collapsibles = document.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
        header.addEventListener('click', function () {
            const collapsible = this.parentElement;
            collapsible.classList.toggle('active');
            const content = collapsible.querySelector('.content');
            content.style.display = content.style.display === "block" ? "none" : "block";
        });
    });
}

const inputs = document.querySelectorAll('.radius-input-style');

inputs.forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Delete' || event.keyCode === 46) {
      event.stopPropagation();
    }
  });
});

