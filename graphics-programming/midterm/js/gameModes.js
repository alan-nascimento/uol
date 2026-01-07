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
