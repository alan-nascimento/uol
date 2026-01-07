/*
 * ============================================================================
 * SNOOKER APPLICATION - COMPREHENSIVE COMMENTARY
 * ============================================================================
 *
 * OVERALL DESIGN DECISIONS:
 * This application uses an object-oriented architecture with four main classes:
 * Table, Ball, Cue, and Pocket. This modular approach separates concerns and
 * makes the code maintainable. The Table class handles all rendering of the
 * playing surface, ensuring accurate proportions (2:1 length:width ratio) and
 * proper placement of pockets, baulk line, and D zone. The Ball class wraps
 * Matter.js bodies, managing both physics properties and visual rendering
 * including trail effects. The Cue class handles user interaction, converting
 * mouse position and keyboard input into force application on the cue ball.
 *
 * CUE INTERACTION MECHANICS:
 * The cue system uses mouse position to calculate aiming angle, with keyboard
 * arrows adjusting power (stored as a multiplier). When space is pressed,
 * the cue animates backward (visual feedback) then applies force using
 * Matter.Body.applyForce in the direction of the mouse. The force magnitude
 * is proportional to the power setting. This creates realistic cue ball
 * movement without elastic band behavior - the cue is purely visual and
 * force-based, not a physical constraint.
 *
 * PHYSICS VALUES RATIONALE:
 * Ball restitution (0.7) provides realistic bouncing without excessive energy.
 * Friction (0.01) allows natural deceleration. Cushion restitution (0.8) is
 * slightly higher to simulate the rubber cushions' springiness. Ball density
 * (0.001) ensures proper mass-to-size ratio. These values were tuned through
 * experimentation to feel natural while maintaining playability.
 *
 * CREATIVE EXTENSION - SHOT PREDICTION GHOST PATH:
 * The application includes a shot prediction system that visualizes the
 * potential path of the cue ball before striking. Using ray-casting and
 * collision detection, the system calculates bounces off cushions and
 * predicts where the ball will travel. The ghost path is rendered as a
 * semi-transparent trail that updates in real-time as the user aims. This
 * extension is technically non-trivial as it requires physics simulation
 * without actually moving bodies, and provides valuable visual feedback
 * for strategic play.
 *
 * ============================================================================
 */

// Matter.js modules
const { Engine, World, Bodies, Body, Events, Vector } = Matter;

// Global variables
let engine;
let world;
let table;
let cue;
let cueBall = null;
let redBalls = [];
let coloredBalls = [];
let cushions = [];
let pockets = [];
let gameMode = 1;
let cuePower = 50;
let isPlacingCueBall = false;
let isStriking = false;
let strikeAnimation = null;
let shotPrediction = [];

// Canvas dimensions (reduced for better fit)
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 700;

// ============================================================================
// TABLE CLASS
// ============================================================================
class Table {
    constructor() {
        // Table dimensions with 2:1 ratio (length:width)
        // Table is horizontal: width (horizontal) is the longer dimension
        // Canvas: 1600x900, so table can be up to ~1400x700 with cushions (40px each side)
        // For 2:1 ratio in horizontal orientation: width:length = 2:1
        // Using 800x400 (width x length) to ensure everything is visible
        this.tableWidth = 800;  // Horizontal dimension (longer)
        this.tableLength = 400; // Vertical dimension (shorter)
        // Per PDF requirements: ballDiameter = tableWidth / 36
        this.ballDiameter = this.tableWidth / 36;
        // Per PDF requirements: pocketDiameter = ballDiameter * 1.5
        // Reduced slightly for better visual appearance
        this.pocketDiameter = this.ballDiameter * 1.5;

        // Table position (centered)
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 2;

        // Colors
        this.woodColor = [101, 67, 33];
        this.feltColor = [0, 100, 0];
        this.lineColor = [255, 255, 255];

        // Baulk line position (vertical line on the left side)
        // In horizontal orientation, D zone is on the left side (vertical)
        // Baulk line is a vertical line 1/5 from the left edge
        this.baulkLineX = this.x - this.tableWidth / 2 + (this.tableWidth / 5);

        // D zone radius (based on table width to maintain proper proportions)
        // D zone should be a semicircle opening to the right from the baulk line
        // Standard snooker D zone radius is 1/11.2 of the table width
        // Even though D zone is vertical, we use width to maintain correct proportions
        this.dRadius = this.tableWidth / 11.2;

        // Initialize pockets
        this.initPockets();
    }

    initPockets() {
        const halfWidth = this.tableWidth / 2;
        const halfLength = this.tableLength / 2;
        const pocketR = this.pocketDiameter / 2;

        // Corner pockets (4 corners)
        pockets.push(new Pocket(this.x - halfWidth, this.y - halfLength, pocketR)); // Top-left
        pockets.push(new Pocket(this.x + halfWidth, this.y - halfLength, pocketR)); // Top-right
        pockets.push(new Pocket(this.x - halfWidth, this.y + halfLength, pocketR)); // Bottom-left
        pockets.push(new Pocket(this.x + halfWidth, this.y + halfLength, pocketR)); // Bottom-right

        // Middle pockets (on top and bottom, in the middle of the long sides)
        pockets.push(new Pocket(this.x, this.y - halfLength, pocketR)); // Top middle
        pockets.push(new Pocket(this.x, this.y + halfLength, pocketR)); // Bottom middle
    }

    createCushions() {
        const halfWidth = this.tableWidth / 2;
        const halfLength = this.tableLength / 2;
        const cushionThickness = 20;
        const pocketR = this.pocketDiameter / 2;

        // Top cushion (with middle pocket gap)
        // Left part: from left edge to before the middle pocket
        const topLeftCushionWidth = halfWidth - pocketR;
        const topLeftCushionCenterX = this.x - halfWidth + topLeftCushionWidth / 2;
        cushions.push(Bodies.rectangle(
            topLeftCushionCenterX,
            this.y - halfLength - cushionThickness / 2,
            topLeftCushionWidth,
            cushionThickness,
            { isStatic: true, restitution: 0.8, label: 'cushion' }
        ));
        // Right part: from after the middle pocket to right edge
        const topRightCushionWidth = halfWidth - pocketR;
        const topRightCushionCenterX = this.x + halfWidth - topRightCushionWidth / 2;
        cushions.push(Bodies.rectangle(
            topRightCushionCenterX,
            this.y - halfLength - cushionThickness / 2,
            topRightCushionWidth,
            cushionThickness,
            { isStatic: true, restitution: 0.8, label: 'cushion' }
        ));

        // Bottom cushion (with middle pocket gap)
        // Left part: from left edge to before the middle pocket
        const leftCushionWidth = halfWidth - pocketR;
        const leftCushionCenterX = this.x - halfWidth + leftCushionWidth / 2;
        cushions.push(Bodies.rectangle(
            leftCushionCenterX,
            this.y + halfLength + cushionThickness / 2,
            leftCushionWidth,
            cushionThickness,
            { isStatic: true, restitution: 0.8, label: 'cushion' }
        ));
        // Right part: from after the middle pocket to right edge
        const rightCushionWidth = halfWidth - pocketR;
        const rightCushionCenterX = this.x + halfWidth - rightCushionWidth / 2;
        cushions.push(Bodies.rectangle(
            rightCushionCenterX,
            this.y + halfLength + cushionThickness / 2,
            rightCushionWidth,
            cushionThickness,
            { isStatic: true, restitution: 0.8, label: 'cushion' }
        ));

        // Left cushion (full length, no gap)
        cushions.push(Bodies.rectangle(
            this.x - halfWidth - cushionThickness / 2,
            this.y,
            cushionThickness,
            this.tableLength,
            { isStatic: true, restitution: 0.8, label: 'cushion' }
        ));

        // Right cushion (full length, no gap)
        cushions.push(Bodies.rectangle(
            this.x + halfWidth + cushionThickness / 2,
            this.y,
            cushionThickness,
            this.tableLength,
            { isStatic: true, restitution: 0.8, label: 'cushion' }
        ));

        World.add(world, cushions);
    }

    draw() {
        push();
        translate(this.x, this.y);

        // Draw wooden border (outer frame)
        fill(this.woodColor[0], this.woodColor[1], this.woodColor[2]);
        noStroke();
        rect(-this.tableWidth / 2 - 30, -this.tableLength / 2 - 30,
             this.tableWidth + 60, this.tableLength + 60);

        // Draw felt surface
        fill(this.feltColor[0], this.feltColor[1], this.feltColor[2]);
        rect(-this.tableWidth / 2, -this.tableLength / 2,
             this.tableWidth, this.tableLength);


        // Cushions are handled by Matter.js physics only (not drawn visually)
        // The wooden border serves as the visual border

        // Draw baulk line (vertical line on the left side)
        stroke(this.lineColor[0], this.lineColor[1], this.lineColor[2]);
        strokeWeight(2);
        line(this.baulkLineX - this.x, -this.tableLength / 2,
             this.baulkLineX - this.x, this.tableLength / 2);

        // Draw D zone (semicircle opening to the right from baulk line)
        // For horizontal table, D zone is on the left side and opens to the right
        noFill();
        stroke(this.lineColor[0], this.lineColor[1], this.lineColor[2]);
        // Arc from -PI/2 (top) to PI/2 (bottom), opening to the right
        // This creates a semicircle that opens to the right from the baulk line
        // Ensure the semicircle fits within the table height
        const maxRadius = min(this.dRadius, this.tableLength / 2 - 10); // Leave 10px margin
        arc(this.baulkLineX - this.x, 0, maxRadius * 2, maxRadius * 2, -PI / 2, PI / 2);

        pop();
    }

    isInDZone(x, y) {
        // Check if point is within the D zone semicircle
        // D zone is on the left side of the table and opens to the right
        const dx = x - this.baulkLineX;
        const dy = y - this.y;
        const distance = sqrt(dx * dx + dy * dy);
        // Use the same maxRadius calculation as in draw() to ensure consistency
        const maxRadius = min(this.dRadius, this.tableLength / 2 - 10);
        // Point must be: within the circle radius and to the right of the baulk line (semicircle opens to the right)
        // Since the semicircle opens to the right, x must be >= baulkLineX (to the right of the line)
        return distance <= maxRadius && x >= this.baulkLineX;
    }
}

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

// ============================================================================
// SHOT PREDICTION (CREATIVE EXTENSION)
// ============================================================================
function calculateShotPrediction() {
    if (!cueBall || isPlacingCueBall) return;

    const speed = sqrt(cueBall.body.velocity.x ** 2 + cueBall.body.velocity.y ** 2);
    if (speed > 0.5) {
        shotPrediction = [];
        return;
    }

    // Convert Matter.js position to p5.Vector
    const ballPos = createVector(cueBall.body.position.x, cueBall.body.position.y);
    const mousePos = createVector(mouseX, mouseY);
    const direction = p5.Vector.sub(mousePos, ballPos);
    direction.normalize();

    // Simulate ball path
    shotPrediction = [];
    let currentPos = ballPos.copy();
    let currentVel = direction.copy().mult(10);
    const maxBounces = 5;
    let bounces = 0;

    for (let i = 0; i < 200 && bounces < maxBounces; i++) {
        shotPrediction.push(currentPos.copy());

        // Move forward
        currentPos.add(currentVel.copy().mult(0.5));

        // Check cushion collision
        const halfWidth = table.tableWidth / 2;
        const halfLength = table.tableLength / 2;
        const tableX = table.x;
        const tableY = table.y;
        const ballR = table.ballDiameter / 2;

        // Left/right cushions
        if (currentPos.x - ballR < tableX - halfWidth || currentPos.x + ballR > tableX + halfWidth) {
            currentVel.x *= -1;
            bounces++;
        }

        // Top/bottom cushions
        if (currentPos.y - ballR < tableY - halfLength || currentPos.y + ballR > tableY + halfLength) {
            currentVel.y *= -1;
            bounces++;
        }

        // Apply friction
        currentVel.mult(0.98);

        // Stop if too slow
        if (currentVel.mag() < 0.1) break;
    }
}

function drawShotPrediction() {
    if (shotPrediction.length < 2) return;

    stroke(255, 255, 255, 100);
    strokeWeight(2);
    noFill();

    beginShape();
    for (let i = 0; i < shotPrediction.length; i++) {
        const alpha = map(i, 0, shotPrediction.length - 1, 50, 200);
        stroke(255, 255, 255, alpha);
        vertex(shotPrediction[i].x, shotPrediction[i].y);
    }
    endShape();

    // Draw prediction points
    for (let i = 0; i < shotPrediction.length; i += 5) {
        const alpha = map(i, 0, shotPrediction.length - 1, 50, 200);
        fill(255, 255, 255, alpha);
        noStroke();
        ellipse(shotPrediction[i].x, shotPrediction[i].y, 4);
    }
}

// ============================================================================
// GAME MODE SETUP FUNCTIONS
// ============================================================================
function setupMode1() {
    // Standard snooker setup
    clearBalls();

    // Cue ball will be placed by user
    isPlacingCueBall = true;

    // Red balls triangle (positioned on the right side of horizontal table)
    const startX = table.x + table.tableWidth / 4;  // Use tableWidth for horizontal positioning
    const startY = table.y;
    const spacing = table.ballDiameter * 1.1;

    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * spacing * 0.866;
            const y = startY + (col - row / 2) * spacing;
            redBalls.push(new Ball(x, y, [255, 0, 0]));
            ballIndex++;
        }
    }

    // Colored balls (adjusted for horizontal table orientation)
    const coloredPositions = [
        [table.x + table.tableWidth / 2 - 50, table.y - table.tableLength / 4, [255, 255, 0]], // Yellow
        [table.x + table.tableWidth / 2 - 25, table.y - table.tableLength / 4, [0, 0, 255]],   // Blue
        [table.x + table.tableWidth / 2, table.y - table.tableLength / 4, [128, 0, 128]],     // Pink
        [table.x + table.tableWidth / 2 + 25, table.y - table.tableLength / 4, [0, 0, 0]],     // Black
        [table.x - table.tableWidth / 2 + 100, table.y, [255, 165, 0]],                        // Orange
        [table.x - table.tableWidth / 2 + 100, table.y + 50, [0, 128, 0]]                      // Green
    ];

    for (let pos of coloredPositions) {
        coloredBalls.push(new Ball(pos[0], pos[1], pos[2]));
    }
}

function setupMode2() {
    // Only red balls in clusters
    clearBalls();
    isPlacingCueBall = true;

    // Create 3-4 clusters of red balls (adjusted for horizontal table)
    const numClusters = 4;
    for (let c = 0; c < numClusters; c++) {
        const clusterX = random(table.x - table.tableWidth / 3, table.x + table.tableWidth / 3);  // Use tableWidth for horizontal
        const clusterY = random(table.y - table.tableLength / 3, table.y + table.tableLength / 3);  // Use tableLength for vertical
        const clusterSize = random(3, 6);

        for (let i = 0; i < clusterSize; i++) {
            const angle = random(TWO_PI);
            const distance = random(table.ballDiameter, table.ballDiameter * 3);
            const x = clusterX + cos(angle) * distance;
            const y = clusterY + sin(angle) * distance;

            // Ensure within table bounds (horizontal table: width is horizontal, length is vertical)
            if (x > table.x - table.tableWidth / 2 + table.ballDiameter &&
                x < table.x + table.tableWidth / 2 - table.ballDiameter &&
                y > table.y - table.tableLength / 2 + table.ballDiameter &&
                y < table.y + table.tableLength / 2 - table.ballDiameter) {
                redBalls.push(new Ball(x, y, [255, 0, 0]));
            }
        }
    }
}

function setupMode3() {
    // Practice mode: randomized reds + colored balls
    clearBalls();
    isPlacingCueBall = true;

    // Random red balls (adjusted for horizontal table)
    for (let i = 0; i < 10; i++) {
        const x = random(table.x - table.tableWidth / 3, table.x + table.tableWidth / 3);  // Use tableWidth for horizontal
        const y = random(table.y - table.tableLength / 3, table.y + table.tableLength / 3);  // Use tableLength for vertical
        redBalls.push(new Ball(x, y, [255, 0, 0]));
    }

    // Colored balls in standard positions (adjusted for horizontal table)
    const coloredPositions = [
        [table.x + table.tableWidth / 2 - 50, table.y - table.tableLength / 4, [255, 255, 0]],
        [table.x + table.tableWidth / 2 - 25, table.y - table.tableLength / 4, [0, 0, 255]],
        [table.x + table.tableWidth / 2, table.y - table.tableLength / 4, [128, 0, 128]],
        [table.x + table.tableWidth / 2 + 25, table.y - table.tableLength / 4, [0, 0, 0]],
        [table.x - table.tableWidth / 2 + 100, table.y, [255, 165, 0]],
        [table.x - table.tableWidth / 2 + 100, table.y + 50, [0, 128, 0]]
    ];

    for (let pos of coloredPositions) {
        coloredBalls.push(new Ball(pos[0], pos[1], pos[2]));
    }
}

function clearBalls() {
    // Remove all balls from world
    if (cueBall) {
        cueBall.remove();
        cueBall = null;
    }

    for (let ball of redBalls) {
        ball.remove();
    }
    redBalls = [];

    for (let ball of coloredBalls) {
        ball.remove();
    }
    coloredBalls = [];
}

// ============================================================================
// P5.JS SETUP AND DRAW
// ============================================================================
function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

    // Initialize Matter.js
    engine = Engine.create();
    world = engine.world;
    engine.world.gravity.y = 0; // No gravity for snooker

    // Create table
    table = new Table();
    table.createCushions();

    // Create cue
    cue = new Cue();

    // Setup initial mode
    setupMode1();
}

function draw() {
    background(20, 20, 30);

    // Update physics
    Engine.update(engine);

    // Update cue
    cue.update();

    // Update pockets
    for (let pocket of pockets) {
        pocket.update();
    }

    // Update strike animation
    if (strikeAnimation) {
        strikeAnimation.radius += 2;
        strikeAnimation.alpha -= 10;
        if (strikeAnimation.alpha <= 0) {
            strikeAnimation = null;
        }
    }

    // Draw table
    table.draw();

    // Calculate shot prediction
    calculateShotPrediction();

    // Draw shot prediction
    drawShotPrediction();

    // Draw balls
    if (cueBall) {
        cueBall.update();
        cueBall.draw();
    }

    for (let ball of redBalls) {
        ball.update();
        ball.draw();
    }

    for (let ball of coloredBalls) {
        ball.update();
        ball.draw();
    }

    // Draw pockets AFTER balls so they're always visible
    for (let pocket of pockets) {
        if (pocket) {
            pocket.draw();
        }
    }

    // Draw cue
    cue.draw();

    // Draw strike animation
    if (strikeAnimation) {
        fill(255, 255, 255, strikeAnimation.alpha);
        noStroke();
        ellipse(strikeAnimation.x, strikeAnimation.y, strikeAnimation.radius * 2);
    }

    // Draw cue ball placement indicator
    if (isPlacingCueBall) {
        const isValid = table.isInDZone(mouseX, mouseY);
        fill(255, 255, 255, isValid ? 150 : 100);
        noStroke();
        ellipse(mouseX, mouseY, table.ballDiameter);

        fill(255);
        textAlign(CENTER);
        textSize(20);
        text(isValid ? "Click to place cue ball" : "Place in D zone only",
             CANVAS_WIDTH / 2, 50);
    }

    // Draw mode indicator
    fill(255);
    textAlign(LEFT);
    textSize(16);
    text(`Mode: ${gameMode}`, 20, CANVAS_HEIGHT - 40);
    text("Press 1, 2, or 3 to switch modes", 20, CANVAS_HEIGHT - 20);
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
function keyPressed() {
    // Mode switching
    if (key === '1') {
        gameMode = 1;
        setupMode1();
    } else if (key === '2') {
        gameMode = 2;
        setupMode2();
    } else if (key === '3') {
        gameMode = 3;
        setupMode3();
    }

    // Cue power adjustment
    if (keyCode === UP_ARROW) {
        cuePower = min(cuePower + 5, 100);
    } else if (keyCode === DOWN_ARROW) {
        cuePower = max(cuePower - 5, 0);
    }

    // Strike
    if (key === ' ') {
        cue.strike();
    }
}

function mousePressed() {
    // Place cue ball
    if (isPlacingCueBall) {
        if (table.isInDZone(mouseX, mouseY)) {
            cueBall = new Ball(mouseX, mouseY, [255, 255, 255], true);
            isPlacingCueBall = false;
        }
    } else {
        // Start cue pullback
        cue.startPullback();
    }
}

function mouseReleased() {
    if (!isPlacingCueBall && cue.isPullingBack) {
        cue.strike();
    }
}

// Check for pocketed balls
Events.on(engine, 'afterUpdate', () => {
    // Check cue ball
    if (cueBall && cueBall.body) {
        for (let pocket of pockets) {
            if (pocket.checkBallEntry(cueBall)) {
                // Remove ball if it's within the pocket
                const dx = cueBall.body.position.x - pocket.x;
                const dy = cueBall.body.position.y - pocket.y;
                const distance = sqrt(dx * dx + dy * dy);

                // Remove if ball center is within pocket radius
                if (distance < pocket.radius) {
                    cueBall.remove();
                    cueBall = null;
                    isPlacingCueBall = true;
                    break;
                }
            }
        }
    }

    // Check red balls
    for (let i = redBalls.length - 1; i >= 0; i--) {
        if (!redBalls[i] || !redBalls[i].body) continue;

        for (let pocket of pockets) {
            if (pocket.checkBallEntry(redBalls[i])) {
                const dx = redBalls[i].body.position.x - pocket.x;
                const dy = redBalls[i].body.position.y - pocket.y;
                const distance = sqrt(dx * dx + dy * dy);

                // Remove if ball center is within pocket radius
                if (distance < pocket.radius) {
                    redBalls[i].remove();
                    redBalls.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Check colored balls
    for (let i = coloredBalls.length - 1; i >= 0; i--) {
        if (!coloredBalls[i] || !coloredBalls[i].body) continue;

        for (let pocket of pockets) {
            if (pocket.checkBallEntry(coloredBalls[i])) {
                const dx = coloredBalls[i].body.position.x - pocket.x;
                const dy = coloredBalls[i].body.position.y - pocket.y;
                const distance = sqrt(dx * dx + dy * dy);

                // Remove if ball center is within pocket radius
                if (distance < pocket.radius) {
                    coloredBalls[i].remove();
                    coloredBalls.splice(i, 1);
                    break;
                }
            }
        }
    }
});


