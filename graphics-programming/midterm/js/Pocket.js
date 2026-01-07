// ============================================================================
// POCKET CLASS
// ============================================================================
class Pocket {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.animation = null;
    }

    checkBallEntry(ball) {
        // Check if ball exists and has a valid body
        if (!ball || !ball.body || !ball.body.position) return false;

        const dx = ball.body.position.x - this.x;
        const dy = ball.body.position.y - this.y;
        const distance = sqrt(dx * dx + dy * dy);

        // More permissive detection - ball center must be within pocket radius
        // Pocket should be large enough for ball to enter
        if (distance < this.radius) {
            // Pocket animation
            this.animation = {
                radius: this.radius,
                maxRadius: this.radius * 1.5,
                alpha: 200,
                progress: 0
            };
            return true;
        }
        return false;
    }

    update() {
        if (this.animation) {
            this.animation.progress += 0.1;
            this.animation.alpha = map(this.animation.progress, 0, 1, 200, 0);
            this.animation.radius = lerp(this.animation.radius, this.animation.maxRadius, 0.1);

            if (this.animation.progress >= 1) {
                this.animation = null;
            }
        }
    }

    draw() {
        // Draw pocket opening - just the rim/border to show it's a hole
        // Outer rim (brown border)
        noFill();
        stroke(139, 69, 19);
        strokeWeight(4);
        ellipse(this.x, this.y, this.radius * 2.0);

        // Inner rim (darker brown, thinner)
        stroke(80, 50, 20);
        strokeWeight(2);
        ellipse(this.x, this.y, this.radius * 1.6);

        // Draw dark opening inside (to show it's a hole)
        fill(15, 15, 15); // Very dark, almost black
        noStroke();
        ellipse(this.x, this.y, this.radius * 1.4);

        // Draw animation
        if (this.animation) {
            fill(255, 255, 0, this.animation.alpha);
            noStroke();
            ellipse(this.x, this.y, this.animation.radius * 2);
        }
    }
}
