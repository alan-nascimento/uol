// ============================================================================
// BALL CLASS
// ============================================================================
class Ball {
    constructor(x, y, color, isCueBall = false) {
        this.isCueBall = isCueBall;
        this.color = color;
        this.diameter = table.ballDiameter;
        this.radius = this.diameter / 2;

        // Create Matter.js body
        this.body = Bodies.circle(x, y, this.radius, {
            restitution: 0.9, // High restitution for energetic collisions
            friction: 0.005, // Moderate friction to slow down over time
            frictionAir: 0.01, // Air friction to stop eventually
            density: 0.001, // Standard density
            label: isCueBall ? 'cueBall' : 'ball'
        });

        World.add(world, this.body);

        // Trail effect
        this.trail = [];
        this.maxTrailLength = 15;
    }

    update() {
        // Safety check
        if (!this.body || !this.body.position) return;

        // Update trail
        const speed = sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
        if (speed > 0.1) {
            this.trail.push({
                x: this.body.position.x,
                y: this.body.position.y,
                alpha: 255
            });

            // Limit trail length
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }

            // Fade trail
            for (let i = 0; i < this.trail.length; i++) {
                this.trail[i].alpha = map(i, 0, this.trail.length - 1, 50, 255);
            }
        } else {
            // Clear trail when stopped
            if (this.trail.length > 0) {
                this.trail = [];
            }
        }
    }

    draw() {
        // Safety check
        if (!this.body || !this.body.position) return;

        // Draw trail
        if (this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const p1 = this.trail[i];
                const p2 = this.trail[i + 1];
                stroke(this.color[0], this.color[1], this.color[2], p1.alpha);
                strokeWeight(map(i, 0, this.trail.length - 1, 2, this.radius * 0.3));
                line(p1.x, p1.y, p2.x, p2.y);
            }
        }

        // Draw ball
        push();
        translate(this.body.position.x, this.body.position.y);
        rotate(this.body.angle);

        // Ball shadow
        fill(0, 0, 0, 50);
        noStroke();
        ellipse(2, 2, this.diameter * 0.9);

        // Ball body
        fill(this.color[0], this.color[1], this.color[2]);
        noStroke();
        ellipse(0, 0, this.diameter);

        // Highlight
        fill(255, 255, 255, 100);
        ellipse(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.6);

        // Cue ball mark
        if (this.isCueBall) {
            fill(0, 0, 0);
            ellipse(this.radius * 0.3, this.radius * 0.3, this.radius * 0.2);
        }

        pop();
    }

    remove() {
        if (this.body && world) {
            World.remove(world, this.body);
            this.body = null;
        }
    }
}
