// space-events.js

import { fattenPolygon, pointInPolygon } from "../../default-functions.js";
import { Point } from "../../default-objects.js";


export function initMouseActions(manager) {
    let isDragging = false;
    let mouseDownPos = null;

    let mouseDownFirst = true;

    const canvasElement = manager.canvas.canvas;
    const canvasObj = manager.canvas;
    let prevDisplacement = {x:0, y:0};
    let displacement = null;

    manager._mouseDownHandler = (event) => {
        if (!canvasObj.spriteMode) {
            isDragging = true;

            if (mouseDownFirst) {
                mouseDownFirst = false;
                manager.storeOriginalOriginalGeometry();
                manager.storeOriginalGeometry();
            }
            
            const tempMouseDownPos = canvasObj.getMousePos(event);
            if (pointInPolygon(tempMouseDownPos.x, tempMouseDownPos.y, manager.canvas.polygon)) {
                mouseDownPos = tempMouseDownPos;
            } else {
                mouseDownPos = null;
            }

            event.preventDefault();
        }
    };

    manager._mouseMoveHandler = (event) => {
        if (isDragging && mouseDownPos && !canvasObj.spriteMode) {
            const currentMousePos = canvasObj.getMousePos(event);

            displacement = {
                x: currentMousePos.x - mouseDownPos.x,
                y: currentMousePos.y - mouseDownPos.y,
            };

            const velocityVector = {
                x: prevDisplacement.x + displacement.x,
                y: prevDisplacement.y + displacement.y,
            };

            manager.projectPoints(velocityVector);

            manager.canvas.polygon = fattenPolygon(manager.canvas.polygon);
        }
    };

    manager._mouseUpHandler = () => {
        if (!canvasObj.spriteMode) {
            isDragging = false;
            prevDisplacement = {
                x: prevDisplacement.x + displacement.x,
                y: prevDisplacement.y + displacement.y
            };
        }
    };

    manager._mouseLeaveHandler = () => {
        if (!canvasObj.spriteMode) isDragging = false;
    };

    canvasElement.addEventListener('mousedown', manager._mouseDownHandler);
    canvasElement.addEventListener('mousemove', manager._mouseMoveHandler);
    canvasElement.addEventListener('mouseup', manager._mouseUpHandler);
    canvasElement.addEventListener('mouseleave', manager._mouseLeaveHandler);

    manager._listenersAttached = true;
}

export function destroyMouseActions(manager) {
    const canvasElement = manager.canvas.canvas;
    
    if (manager._listenersAttached) {
        canvasElement.removeEventListener('mousedown', manager._mouseDownHandler);
        canvasElement.removeEventListener('mousemove', manager._mouseMoveHandler);
        canvasElement.removeEventListener('mouseup', manager._mouseUpHandler);
        canvasElement.removeEventListener('mouseleave', manager._mouseLeaveHandler);

        delete manager._mouseDownHandler;
        delete manager._mouseMoveHandler;
        delete manager._mouseUpHandler;
        delete manager._mouseLeaveHandler;

        manager._listenersAttached = false;
    }
}