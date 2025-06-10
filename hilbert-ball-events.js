import { initProperties as initSiteProperties } from "../site/site-events.js";
import { HilbertBall, ForwardFunkBall, ReverseFunkBall, ThompsonBall,MultiBall } from "../../default-objects.js";

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function initMouseActions(hilbertBallManager) {
    const events = ['mousedown', 'mousemove', 'mouseup', 'click'];
    const handlers = {
        mousedown: (event) => hilbertBallManager.startDragging(event),
        mousemove: (event) => hilbertBallManager.dragSite(event),
        mouseup: () => hilbertBallManager.stopDragging(),
        click: (event) => {
            if (event.shiftKey) {
                hilbertBallManager.selectHilbertBall(event, true);
            } else {
                hilbertBallManager.selectHilbertBall(event);
            }
        }
    };

    events.forEach(eventType => {
        hilbertBallManager.canvas.canvas.addEventListener(eventType, (event) => {
            if (hilbertBallManager.active) handlers[eventType](event);
        });
    });
}

function getChangedBallAndSiteProperties() {
    const changedProperties = {};
    const inputs = [
        { id: 'siteColor', name: 'color' },
        { id: 'siteShowInfo', name: 'showInfo', type: 'checkbox' },
        { id: 'siteDrawSpokes', name: 'drawSpokes', type: 'checkbox' },
        { id: 'labelInput', name: 'label' },
        { id: 'ballColor', name: 'boundaryColor' },
        { id: 'radiusInput', name: 'ballRadius' },
        { id: 'ffunkBallColor', name: 'boundaryColor' },
        { id: 'ffunkRadiusInput', name: 'ballRadius' },
        { id: 'rfunkBallColor', name: 'boundaryColor' },
        { id: 'rfunkRadiusInput', name: 'ballRadius' },
        { id: 'thompsonBallColor', name: 'boundaryColor' },
        { id: 'thompsonRadiusInput', name: 'ballRadius' }
    ];

    inputs.forEach(({ id, name, type }) => {
        const input = document.getElementById(id);
        if (input) {  // Check if the element exists
            const value = type === 'checkbox' ? input.checked : input.value;
            const defaultValue = type === 'checkbox' ? input.defaultChecked : input.defaultValue;

            if (value !== defaultValue) {
                changedProperties[name] = true;
            }
        }
    });

    return changedProperties;
}

function assignBallAndSiteProperties(manager, forceUpdate = false) {
    const changedProperties = getChangedBallAndSiteProperties();

    manager.canvas.sites.forEach(site => {
        if (site.selected) {
            if (site instanceof MultiBall) {
                site.balls.forEach(({ type, ball }) => {
                    updateBallProperties(ball, type, changedProperties, forceUpdate);
                });
            } else if (isMetricBall(site)) {
                const type = site.constructor.name;
                updateBallProperties(site, type, changedProperties, forceUpdate);
            }

            if (forceUpdate) {
                site.showInfo = getElementChecked('siteShowInfo');
                site.drawSpokes = getElementChecked('siteDrawSpokes');
                site.label = getElementValue('labelInput');
            }
        }
    });

    manager.drawAll(); 
}

function updateBallProperties(ball, type, changedProperties, forceUpdate) {
    const { colorInputId, radiusInputId } = getPropertyElements(type);

    if (changedProperties.boundaryColor || forceUpdate) {
        const boundaryColor = getElementValue(colorInputId);
        ball.setBoundaryColor(boundaryColor);
        ball.setColor(boundaryColor);

        document.getElementById('siteColor').value = boundaryColor;
        document.getElementById('siteColor').defaultValue = boundaryColor;
    }

    if (changedProperties.ballRadius || forceUpdate) {
        ball.setBallRadius(parseFloat(getElementValue(radiusInputId)));
    }
}

function getPropertyElements(type) {
    switch (type) {
        case "HilbertBall":
            return { colorInputId: "ballColor", radiusInputId: "radiusInput" };
        case "ForwardFunkBall":
            return { colorInputId: "ffunkBallColor", radiusInputId: "ffunkRadiusInput" };
        case "ReverseFunkBall":
            return { colorInputId: "rfunkBallColor", radiusInputId: "rfunkRadiusInput" };
        case "ThompsonBall":
            return { colorInputId: "thompsonBallColor", radiusInputId: "thompsonRadiusInput" };
        default:
            console.warn(`Unknown ball type: ${type}`);
            return {};
    }
}

function getElementValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function getElementChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function isMetricBall(site) {
    return site instanceof HilbertBall || site instanceof ForwardFunkBall ||
           site instanceof ReverseFunkBall || site instanceof ThompsonBall;
}

export function initProperties(hilbertBallManager) {
    initSiteProperties(hilbertBallManager);

    const debouncedAssignBallAndSiteProperties = debounce(() => assignBallAndSiteProperties(hilbertBallManager), 0);

    const inputs = [
        { sliderId: 'radius', inputId: 'radiusInput', resetId: 'resetRadius' },
        { sliderId: 'ffunkRadius', inputId: 'ffunkRadiusInput', resetId: 'ffunkResetRadius' },
        { sliderId: 'rfunkRadius', inputId: 'rfunkRadiusInput', resetId: 'rfunkResetRadius' },
        { sliderId: 'thompsonRadius', inputId: 'thompsonRadiusInput', resetId: 'thompsonResetRadius' }
    ];

    const defaultColors = {
        HilbertBall: '#0000FF', 
        ForwardFunkBall: '#228B22',
        ReverseFunkBall: '#FF0000',
        ThompsonBall: '#800080'
    };

    Object.entries(defaultColors).forEach(([type, color]) => {
        const { colorInputId } = hilbertBallManager.getPropertyElements(type);
        const colorInput = document.getElementById(colorInputId);

        if (colorInput) {
            colorInput.value = color; 
            colorInput.defaultValue = color;
        }
    });

    inputs.forEach(({ sliderId, inputId, resetId }) => {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        const resetIcon = document.getElementById(resetId);

        if (slider && input && resetIcon) {
            slider.addEventListener('input', (event) => {
                input.value = event.target.value;
                debouncedAssignBallAndSiteProperties();
            });

            input.addEventListener('input', (event) => {
                slider.value = event.target.value;
                debouncedAssignBallAndSiteProperties();
            });

            resetIcon.addEventListener('click', () => {
                slider.value = 1;
                input.value = 1;
                assignBallAndSiteProperties(hilbertBallManager, true);
            });
        }
    });

    document.querySelectorAll('[id$="Color"]').forEach(colorInput => {
        colorInput.addEventListener('input', debouncedAssignBallAndSiteProperties);
    });

    const multiBallSlider = document.getElementById('multiBallRadius');
    const multiBallInput = document.getElementById('multiBallRadiusInput');
    const multiBallContainer = document.getElementById('multiBallRadiusContainer');

    function updateMultiBallRadius(value) {
        hilbertBallManager.canvas.sites.forEach(site => {
            if (site instanceof MultiBall && site.selected) {
                site.balls.forEach(({ ball }) => {
                    ball.setBallRadius(parseFloat(value));
                    hilbertBallManager.updateHilbertBallProperties(ball);
                });
                
            }
        });
        hilbertBallManager.drawAll();
    }

    if (multiBallSlider && multiBallInput) {
        multiBallSlider.addEventListener('input', (event) => {
            multiBallInput.value = event.target.value;
            updateMultiBallRadius(event.target.value);
        });

        multiBallInput.addEventListener('input', (event) => {
            multiBallSlider.value = event.target.value;
            updateMultiBallRadius(event.target.value);
        });
    }

    function toggleMultiBallSliderVisibility() {
        const hasMultiBall = hilbertBallManager.canvas.sites.some(site => site instanceof MultiBall);
        multiBallContainer.style.display = hasMultiBall ? 'block' : 'none';
    }

    hilbertBallManager.toggleMultiBallSliderVisibility = toggleMultiBallSliderVisibility;
}

export function initShortcuts(hilbertBallManager) {
    document.addEventListener('keydown', (event) => {
        if (hilbertBallManager.active && (event.key === 'Delete' || event.key === 'Backspace')) {
            hilbertBallManager.removeSite();
        }
    });

    document.querySelectorAll('[id$="RadiusInput"]').forEach(input => {
        input.addEventListener('keydown', function (event) {
            if (['Delete', 'Backspace', 't'].includes(event.key)) {
                event.stopPropagation();
            }
        });
    });
}