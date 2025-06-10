import { Site, Point, HilbertBall,MultiBall, ForwardFunkBall, ReverseFunkBall, ThompsonBall } from "../../default-objects.js";
import { initMouseActions, initProperties, initShortcuts } from "./hilbert-ball-events.js";
import { SiteManager } from "../site/site.js";
import { mouseOnSite } from "../../default-functions.js";

function getElementChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

export class HilbertBallManager extends SiteManager {
    constructor(canvas, hilbertDistanceManager, bisectorManager) {
        super(canvas, hilbertDistanceManager, bisectorManager);
        this.name = "HilbertBallManager";
        initMouseActions(this);
        initProperties(this);
        initShortcuts(this);
    }

    getSelectedBallTypes() {
        const selectedBalls = [];
        if (document.getElementById('hilbertBallCheckbox').checked) selectedBalls.push('HilbertBall');
        if (document.getElementById('ffunkBallCheckbox').checked) selectedBalls.push('ForwardFunkBall');
        if (document.getElementById('rfunkBallCheckbox').checked) selectedBalls.push('ReverseFunkBall');
        if (document.getElementById('thompsonBallCheckbox').checked) selectedBalls.push('ThompsonBall');
        return selectedBalls;
    }

    addSite(event, xInput = null, yInput = null) {
      const selectedBallTypes = this.getSelectedBallTypes();
      if (selectedBallTypes.length === 0) return; // No balls selected
  
      let x, y;
      if (xInput !== null && yInput !== null) {
          x = xInput;
          y = yInput;
      } else {
          ({ x, y } = this.canvas.getMousePos(event));
      }
  
      if (this.canvas.polygon.contains(new Point(x, y))) {
          const site = new Site(x, y, this.canvas.polygon,'black',getElementChecked('siteDrawSpokes'));
  
          if (selectedBallTypes.length === 1) {
              const type = selectedBallTypes[0];
              const ball = this.createBallByType(type, site);
              this.assignBallProperties(ball, type);
              this.canvas.sites.push(ball); 
          } else {
              const multiBall = new MultiBall(site);
              selectedBallTypes.forEach(type => {
                  const ball = this.createBallByType(type, site);
                  this.assignBallProperties(ball, type);
                  multiBall.addBall(type, ball);
              });
              this.canvas.sites.push(multiBall); 
          }
  
          this.drawAll();
          this.toggleMultiBallSliderVisibility();
      }
  }

    createBallByType(type, site) {
        switch (type) {
            case 'HilbertBall':
                return new HilbertBall(site);
            case 'ForwardFunkBall':
                return new ForwardFunkBall(site); 
            case 'ReverseFunkBall':
                return new ReverseFunkBall(site); 
            case 'ThompsonBall':
                return new ThompsonBall(site);
            default:
                throw new Error('Unknown ball type');
        }
    }

    assignBallProperties(ball, type) {
      const { colorInputId, radiusInputId } = this.getPropertyElements(type);
  
      const boundaryColor = document.getElementById(colorInputId).value;
      ball.setBoundaryColor(boundaryColor);
      ball.setColor(boundaryColor);
  
      ball.setBallRadius(parseFloat(document.getElementById(radiusInputId).value));
  
      const showInfo = document.getElementById('siteShowInfo').checked;
      const drawSpokes = document.getElementById('siteDrawSpokes').checked;
      const label = document.getElementById('labelInput').value;
  
      ball.showInfo = showInfo;
      ball.drawSpokes = drawSpokes;
      ball.label = label;
  }

    getPropertyElements(type) {
        switch (type) {
            case 'HilbertBall':
                return { colorInputId: 'ballColor', radiusInputId: 'radiusInput' };
            case 'ForwardFunkBall':
                return { colorInputId: 'ffunkBallColor', radiusInputId: 'ffunkRadiusInput' };
            case 'ReverseFunkBall':
                return { colorInputId: 'rfunkBallColor', radiusInputId: 'rfunkRadiusInput' };
            case 'ThompsonBall':
                return { colorInputId: 'thompsonBallColor', radiusInputId: 'thompsonRadiusInput' };
            default:
                throw new Error('Unknown ball type');
        }
    }

    selectHilbertBall(event, multiple = false) {
        super.selectSite(event, multiple);
        const selectedBalls = this.getSelectedSites().filter(site => 
          site instanceof HilbertBall || 
          site instanceof ForwardFunkBall || 
          site instanceof ReverseFunkBall ||
          site instanceof ThompsonBall
        );

        if (selectedBalls.length === 1) {
            this.updateHilbertBallProperties(selectedBalls[0]);
        } else if (selectedBalls.length > 1) {
            this.setDefaultValuesForMultiple();
        }
    }

    updateHilbertBallProperties(ball) {
        super.updateSiteProperties(ball);
        const { colorInputId, radiusInputId } = this.getPropertyElements(ball.constructor.name);
    
        document.getElementById('siteColor').value = ball.boundaryColor; // <-- This line ensures site color matches the ball
        document.getElementById(colorInputId).value = ball.boundaryColor;
        document.getElementById(radiusInputId).value = ball.ballRadius;
    }
}