// ============================================================================
// CUE CLASS
// ============================================================================
class Cue {
    constructor() {
        this.length = 200;
        this.width = 8;
        this.pullbackDistance = 0;
        this.maxPullback = 100;
        this.isPullingBack = false;
        this.strikeProgress = 0;
    }

    update() {
        if (this.isPullingBack) {
            this.pullbackDistance = min(this.pullbackDistance + 3, this.maxPullback);
        }

        if (this.strikeProgress > 0) {
            this.strikeProgress -= 0.1;
            if (this.strikeProgress <= 0) {
                this.strikeProgress = 0;
                this.pullbackDistance = 0;
                this.isPullingBack = false;
            }
        }
    }

    draw() {
        if (!cueBall || isPlacingCueBall) return;

        // Don't show cue during or after strike animation
        if (this.strikeProgress > 0) return;

        // Convert Matter.js position to p5.Vector
        const ballPos = createVector(cueBall.body.position.x, cueBall.body.position.y);
        const mousePos = createVector(mouseX, mouseY);
        const direction = p5.Vector.sub(mousePos, ballPos);

        // Check if direction is valid
        if (direction.mag() < 0.1) return;

        const angle = direction.heading();

        // Only show cue if ball is completely stationary (lower threshold)
        const speed = sqrt(cueBall.body.velocity.x ** 2 + cueBall.body.velocity.y ** 2);
        if (speed > 0.1) return;

        push();
        translate(ballPos.x, ballPos.y);
        rotate(angle);

        // Cue color gradient
        const cueColor = color(139, 90, 43);

        // Draw cue
        fill(cueColor);
        stroke(101, 67, 33);
        strokeWeight(1);

        // Cue tip (white)
        fill(255, 255, 255);
        ellipse(-this.pullbackDistance - this.length, 0, this.width * 1.5);

        // Cue shaft
        fill(cueColor);
        rect(-this.pullbackDistance - this.length, -this.width / 2,
             this.length, this.width);

        // Power indicator
        const powerColor = lerpColor(color(0, 255, 0), color(255, 0, 0), cuePower / 100);
        fill(powerColor);
        noStroke();
        rect(-this.pullbackDistance - this.length - 10, -this.width / 2 - 5,
             5, map(cuePower, 0, 100, 0, this.width + 10));

        pop();

        // Draw power text
        fill(255);
        textAlign(LEFT);
        textSize(16);
        text(`Power: ${int(cuePower)}%`, 20, 30);
    }

    startPullback() {
        if (!cueBall || isPlacingCueBall) return;

        // Don't allow pullback if ball is moving or during strike animation
        const speed = sqrt(cueBall.body.velocity.x ** 2 + cueBall.body.velocity.y ** 2);
        if (speed > 0.1 || this.strikeProgress > 0) return;

        this.isPullingBack = true;
        this.pullbackDistance = 0;
    }

    strike() {
        if (!cueBall || isPlacingCueBall) return;
        if (!this.isPullingBack) return;

        // Convert Matter.js position to p5.Vector
        const ballPos = createVector(cueBall.body.position.x, cueBall.body.position.y);
        const mousePos = createVector(mouseX, mouseY);
        const direction = p5.Vector.sub(mousePos, ballPos);

        // Check if direction is valid
        if (direction.mag() < 0.1) return;

        direction.normalize();

        // Calculate force based on power and pullback
        // Increased force multiplier for more realistic ball movement
        const pullbackFactor = max(this.pullbackDistance / this.maxPullback, 0.3); // Minimum 30% even if not fully pulled back
        const forceMagnitude = (cuePower / 100) * 0.03 * pullbackFactor; // Increased significantly for faster ball movement
        const force = {
            x: direction.x * forceMagnitude,
            y: direction.y * forceMagnitude
        };

        // Apply force
        Body.applyForce(cueBall.body, cueBall.body.position, force);

        // Impact animation (use Matter.js position)
        strikeAnimation = {
            x: cueBall.body.position.x,
            y: cueBall.body.position.y,
            radius: 0,
            maxRadius: 30,
            alpha: 255
        };

        // Reset cue immediately - don't wait for animation
        this.isPullingBack = false;
        this.pullbackDistance = 0;
        this.strikeProgress = 1.0;
    }
}
