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
