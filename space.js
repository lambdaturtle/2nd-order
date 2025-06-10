import { SiteManager } from "../site/site.js";
import { ConvexPolygon, Point } from "../../default-objects.js";
import { centroid, pointInPolygon, norm } from "../../default-functions.js";
import { initMouseActions, destroyMouseActions } from "./space-events.js";

// Class for a 2d matrix
class Matrix {
    constructor(matrix) {
        this.matrix = matrix;
    }

    apply(point) {
        const x = this.matrix[0][0] * point.x + this.matrix[0][1] * point.y;
        const y = this.matrix[1][0] * point.x + this.matrix[1][1] * point.y;
        return new Point(x, y);
    }

    inv() {
        let A = this.matrix;
        const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        return new Matrix([
            [A[1][1] / det, -A[0][1] / det],
            [-A[1][0] / det, A[0][0] / det]
        ]);
    } 

    // cholesky factorization: https://www.geeksforgeeks.org/cholesky-factorization/
    cholesky() {
        let A = this.matrix;
        const L = [[0, 0], [0, 0]];
        L[0][0] = Math.sqrt(A[0][0]);
        L[1][0] = A[1][0] / L[0][0];
        L[1][1] = Math.sqrt(A[1][1] - L[1][0] * L[1][0]);
        return new Matrix(L);
    }
}

// algorithms for ellipsoids: https://tcg.mae.cornell.edu/pubs/Pope_FDA_08.pdf
function computeJohnEllipsoid(points) {
    // Find the centroid of the polygon.
    let centroid_ = centroid(points);
    const cx = centroid_.x;
    const cy = centroid_.y;

    // Find the Covariance matrix
    let covarianceMatrix = new Matrix([
        [0, 0], // Sxx, Sxy
        [0, 0]  // Sxy, Syy
    ]);
    for (let point of points) {
        covarianceMatrix.matrix[0][0] += (point.x - cx) * (point.x - cx);
        covarianceMatrix.matrix[0][1] += (point.x - cx) * (point.y - cy);
        covarianceMatrix.matrix[1][0] += (point.y - cy) * (point.x - cx);
        covarianceMatrix.matrix[1][1] += (point.y - cy) * (point.y - cy);
    }

    covarianceMatrix.matrix[0][0] /= points.length;
    covarianceMatrix.matrix[0][1] /= points.length;   
    covarianceMatrix.matrix[1][0] /= points.length;
    covarianceMatrix.matrix[1][1] /= points.length;

    
    // Find the inverse covariance matrix
    let inverseCovarianceMatrix = covarianceMatrix.inv().matrix;

    // mahanobolis distance: https://math.stackexchange.com/questions/428064/distance-of-a-test-point-from-the-center-of-an-ellipsoid
    // find the Scaling factor - take the point furthest away from the centroid
    let scalingFactor = 0;
    for (let point of points) {
        // mahalanobis distance
        let x = point.x - cx;
        let y = point.y - cy;

        // [x,y]^T * S^-1 * [x,y] <- no square root (scaling wasn't enough)
        let dist = (x**2) * inverseCovarianceMatrix[0][0] + 2 * x * y * inverseCovarianceMatrix[0][1] + (y ** 2) * inverseCovarianceMatrix[1][1];

        if (dist > scalingFactor) {
            scalingFactor = dist;
        }
    }

    inverseCovarianceMatrix[0][0] /= scalingFactor;
    inverseCovarianceMatrix[0][1] /= scalingFactor; 
    inverseCovarianceMatrix[1][0] /= scalingFactor; 
    inverseCovarianceMatrix[1][1] /= scalingFactor; 

    return {
        center: new Point(cx, cy),
        matrix: new Matrix(inverseCovarianceMatrix)
    };
    
}

// credit: https://www.mathworks.com/matlabcentral/answers/566250-how-to-transform-a-ellipse-to-circle
function mapJohnToUnitCircle(point, ellipsoid) {
    // y = L(x-c) <-- change of variables
    const L = ellipsoid.matrix.cholesky();
    const diff = new Point(point.x - ellipsoid.center.x, point.y - ellipsoid.center.y);
    console.log(L);
    return L.apply(diff);
}

function mapUnitCircleToJohn(y, ellipsoid) {
    // x = L^{-1}y + c 
    const L = ellipsoid.matrix.cholesky();
    const mappedDifference = L.inv().apply(y);
    const a = mappedDifference.x + ellipsoid.center.x;
    const b = mappedDifference.y + ellipsoid.center.y;
    return new Point(a,b);
}

function projectPoint(point, velocity) {

    const px = point.x;
    const py = point.y;

    const dot = px * velocity.x + py * velocity.y;
    let denom = 1 + dot;

    if (Math.abs(denom) < 1e-5) {
        denom = (denom < 0) ? -1e-3 : 1e-3;
    }

    const factor = 1 / denom;
    const newX = px * factor;
    const newY = py * factor;

    return new Point(newX, newY);
}

function unNormalizePoint(pt, info) {
    const { cx, cy, scale } = info;
    return new Point(
        (pt.x / scale) + cx,
        (pt.y / scale) + cy
    );
}


export class SpaceManager extends SiteManager {
    constructor(canvas) {
        super(canvas);
        this.name = "SpaceManager";
        this._listenersAttached = false;

        this._normOriginalPolygonVertices = [];
        this._normInfo = null;

        this._origJohn = null;
    }

    storeOriginalGeometry() {
        const vertices = this.canvas.polygon.vertices;

        let { x: cx, y: cy } = centroid(vertices);

        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;

        vertices.forEach(v => {
            if (v.x < xMin) xMin = v.x;
            if (v.x > xMax) xMax = v.x;
            if (v.y < yMin) yMin = v.y;
            if (v.y > yMax) yMax = v.y;
        });

        const width = xMax - xMin;
        const height = yMax - yMin;
        const scale = 2 / Math.max(width, height);

        this._normInfo = { cx,cy, scale };

        this._normOriginalPolygonVertices = vertices.map(v => {
            return {
                x: (v.x - cx) * scale,
                y: (v.y - cy) * scale
            };
        });

        this._normOriginalAsteroids = this.canvas.asteroids.map(site => {
            return {
                x: (site.x - cx) * scale,
                y: (site.y - cy) * scale
            };
        });

        this._normOriginalSites = this.canvas.sites.map(site => {
            return {
                x: (site.x - cx) * scale,
                y: (site.y - cy) * scale
            };
        });
    }

    storeOriginalOriginalGeometry() {
        this._origJohn = computeJohnEllipsoid(this.canvas.polygon.vertices);
    }
    
    projectPoints(v) {
        if (!this._normInfo || !this._origJohn) return;

        const velocityFactor = 0.001;
        const scaledV = { x: v.x * velocityFactor, y: v.y * velocityFactor };

        const projectedVertices = this._normOriginalPolygonVertices.map(vertex => { return projectPoint(vertex, scaledV); });

        const unNormalizedVertices = projectedVertices.map(vtx => { return unNormalizePoint(vtx, this._normInfo);});

        const newAsteroidPositions = this._normOriginalAsteroids.map(siteNorm => projectPoint(siteNorm, scaledV))
                                                                .map(pt => unNormalizePoint(pt, this._normInfo));
        const newSitePositions = this._normOriginalSites.map(siteNorm => projectPoint(siteNorm, scaledV))
                                                                .map(pt => unNormalizePoint(pt, this._normInfo));

        const newJohnEllipsoid = computeJohnEllipsoid(unNormalizedVertices);
        const finalVertices = unNormalizedVertices.map(vertex => {
            const y = mapJohnToUnitCircle(vertex, newJohnEllipsoid);
            const newMappedPt = mapUnitCircleToJohn(y, this._origJohn); // original shape, original john ellipsoid
            return newMappedPt;
        });

        const currPolygon = this.canvas.polygon;
        const newPolygon = new ConvexPolygon(
            finalVertices,
            currPolygon.color,
            currPolygon.penWidth,
            currPolygon.showInfo,
            currPolygon.showVertices,
            currPolygon.vertexRadius
        );
        this.canvas.polygon = newPolygon;

        if (this.canvas.showAsteroids) {
            for (let i = 0; i < this.canvas.asteroids.length; i++) {
                const a = this.canvas.asteroids[i];
                const y = mapJohnToUnitCircle(newAsteroidPositions[i], newJohnEllipsoid);
                const mappedPt = mapUnitCircleToJohn(y, this._origJohn);
    
                a.x = mappedPt.x;
                a.y = mappedPt.y;
    
                if (pointInPolygon(a.x, a.y, newPolygon)) {
                    a.convexPolygon = this.canvas.polygon;
                    a.computeSpokes?.();
                    a.computeHilbertBall?.();
                    a.computeMultiBall?.();
                }
            }
        }

        if (this.canvas.sites.length > 0) {
            for (let i = 0; i < this.canvas.sites.length; i++) {    
                const s = this.canvas.sites[i];
                const y = mapJohnToUnitCircle(newSitePositions[i], newJohnEllipsoid);
                const mappedPt = mapUnitCircleToJohn(y, this._origJohn);
    
                s.x = mappedPt.x;
                s.y = mappedPt.y;
    
                if (pointInPolygon(s.x, s.y, newPolygon)) {
                    s.convexPolygon = this.canvas.polygon;
                    s.computeSpokes?.();
                    s.computeHilbertBall?.();
                    s.computeMultiBall?.();
                }
            }
        }

        this.canvas.drawAll();
    }

    activate() {
        this.active = true;
        initMouseActions(this);
    }

    deactivate() {
        this.active = false;
        destroyMouseActions(this); 
    }
}

