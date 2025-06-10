# Funk Geo Visualizer

FunkGeoVisualizer is a platform for exploring various properties of the Funk-like family of non-euclidean metric geometries which are defined on convex polygons. Using this visualizer, you will be able to:

1. Visualize and compare how Hilbert, Funk, and Thompson metric balls look within different polygons by moving centers, changing radii, and overlapping the different types of metric balls.
2. Understand how the Hilbert distance between two points $p$ and $q$, $H(p,q)$ varies as you move the points around inside the polygon (support for tracking Thompson and Funk distances is coming soon)
3. Create Hilbert and Thompson bisectors (due to a revised implementation, you will also be able to observe how the Hilbert bisector changes as you move one of the source points). 
4. Interact with the Hilbert metric space by dragging the space inside or navigating a rocket ship throughout the polygon.

The visualizer is organizes these various capabilities in a series of programs which you can select from the dropdown menu in the `Insert Funk` mode.

## Usage

The Funk-like non-euclidean geometries are defined with respect to a convex polygon. To create a polygon:

- Make sure that you’re in the `Insert Convex` mode
- Select one of the preset polygon configurations (3, 4, 5, 6, n-gon) or select `Free Draw` mode where you can double-click in the canvas area to add vertices (add at least three vertices to the area)

After creating your polygon, click `Insert Funk` to explore the behavior of the Funk, Thompson, and Hilbert metric geometries defined over your custom polygon.

### Site

A site $s$ is a point located in the interior of the polygon with an associated set of *spokes.* Spokes are line segments passing through the point and vertices of the polygon. 

To add a site to the polygon, select the `Site` program from the menu and double-click inside the polygon.

[![YouTube](http://i.ytimg.com/vi/PdGqMP26EjU/hqdefault.jpg)](https://www.youtube.com/watch?v=PdGqMP26EjU)


### Metric Balls

Using the visualizer, you’ll be able to explore the balls of four different geometries.

- **Funk Ball:** Defined by the Forward Funk weak metric $F(p,q)$. The ball corresponds to a homothety of the polygon scaled by $(1 - e^{-r})$
- **Reverse Funk Ball:** Defined by the Reverse Funk weak metric $F(q, p)$. The ball corresponds to a homothety of the polygon scaled by $(e^r - 1)$
- **Hilbert Ball:** Defined by the Hilbert Metric, the average of the Forward and Reverse Funk weak metrics. Hilbert Balls are proper metric balls and are convex polygons with at most $2m$ sides.
- **Thompson Ball:** The intersection of the Forward and Reverse Funk balls. Thompson Balls are not pseudo-disks and can be sandwiched between Hilbert balls of radius $\frac{r}{2}$ and $r$

To add a ball to to the polygon, first navigate to the `Metric Balls` program and select the ball type(s). Then, double-click inside the polygon to add the ball or multi-ball to the polygon.

[![YouTube](http://i.ytimg.com/vi/bADxdcAqMds/hqdefault.jpg)](https://www.youtube.com/watch?v=bADxdcAqMds)

### Hilbert Distance

The Hilbert distance between two points $p$ and $q$ in a convex polygon $\Omega$ is given by:

$$
H_\Omega(p, q) = \frac{1}{2} \left( F_\Omega(p, q) + F_\Omega(q, p) \right)
$$

This distance is projectively invariant and increases dramatically as points approach the boundary.

In the visualizer, first navigate to the `Hilbert Distance` program. Then, select two sites (hold down shift or shift + drag) and right click to open a context menu. You can then either calculate the hilbert distance (temporary display) or save the hilbert distance in the sidebar. If you save the distance in the sidebar, you can track its changes by clicking on the tracking icon next to the delete icon.

[![YouTube](http://i.ytimg.com/vi/_pbgpspmTmQ/hqdefault.jpg)](https://www.youtube.com/watch?v=_pbgpspmTmQ)


### Hilbert & Thompson Bisector

The Hilbert Bisector between two distinct points $p$ and $q$ within a convex domain $\Omega$ is the set of points equidistant to both $p$ and $q$ under the Hilbert metric. The Thompson bisector is similar except that the set points are equidistant under the Thompson distance.

Unlike in Euclidean geometry, where bisectors are straight lines, Hilbert bisectors can be piecewise linear or curved as they are influenced by the geometry of the convex domain $\Omega$. For more details, please refer to Section 3 of  https://drops.dagstuhl.de/storage/00lipics/lipics-vol294-swat2024/LIPIcs.SWAT.2024.25/LIPIcs.SWAT.2024.25.pdf. Regarding the Thompson bisector, further work is required to fully characterize it. The visualizer currently offers a (slow) brute force visualization for exploration.

In the visualizer, first navigate to the `Bisector` program (if you want to save Hilbert bisectors). Then, select two sites (hold down shift or shift + drag) and right click to open a context menu. You will see two options, `Draw Bisector` which draws the Hilbert bisector and `Draw Brute Force Thompson Bisector` .

**Hilbert Bisector**

[![YouTube](http://i.ytimg.com/vi/0vWj-IHRMHI/hqdefault.jpg)](https://www.youtube.com/watch?v=0vWj-IHRMHI)

**Thompson Bisector**

[![YouTube](http://i.ytimg.com/vi/au8opBFvQxM/hqdefault.jpg)](https://www.youtube.com/watch?v=au8opBFvQxM)

### Hilbert Metric Space Visualization

To simulate traversal within the Hilbert geometry, we employ a projective transformation that preserves the Hilbert metric. Given a displacement vector $v$, the transformation applied to a point  $p \in \Omega$ is defined by:

$$
\varphi_v(p) = \frac{p}{1 + \langle p, v \rangle}
$$

While the transformation preserves Hilbert distances, it can deform the shape of the polygon into skinny forms. To address this, we incorporate additional normalization using the approximate John ellipsoid and Cholesky decomposition. For implementation-specific details and behavior related to handling the skinny forms refer to `hilbert-interstellar-algorithm.pdf`

In the visualizer, you can explore your Hilbert polygonal geometry in two ways. First navigate to the `Hilbert metric space` program. Then either click and drag the space inside the polygon or click sprite mode to pilot a rocket ship with arrow keys to traverse the geometry.

**Click + Drag**

[![YouTube](http://i.ytimg.com/vi/_FSQJjyygEA/hqdefault.jpg)](https://www.youtube.com/watch?v=_FSQJjyygEA)

**Rocket Ship**

[![YouTube](http://i.ytimg.com/vi/RVpDuXa4zIM/hqdefault.jpg)](https://www.youtube.com/watch?v=RVpDuXa4zIM)
