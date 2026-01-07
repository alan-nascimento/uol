// ============================================================================
// SHOT PREDICTION (CREATIVE EXTENSION)
// ============================================================================
function calculateShotPrediction() {
  if (!cueBall || isPlacingCueBall) return

  const speed = sqrt(
    cueBall.body.velocity.x ** 2 + cueBall.body.velocity.y ** 2
  )
  if (speed > 0.5) {
    shotPrediction = []
    return
  }

  // Convert Matter.js position to p5.Vector
  const ballPos = createVector(cueBall.body.position.x, cueBall.body.position.y)
  const mousePos = createVector(mouseX, mouseY)
  const direction = p5.Vector.sub(mousePos, ballPos)
  direction.normalize()

  // Simulate ball path
  shotPrediction = []
  let currentPos = ballPos.copy()
  let currentVel = direction.copy().mult(10)
  const maxBounces = 5
  let bounces = 0

  for (let i = 0; i < 200 && bounces < maxBounces; i++) {
    shotPrediction.push(currentPos.copy())

    // Move forward
    currentPos.add(currentVel.copy().mult(0.5))

    // Check cushion collision
    const halfWidth = table.tableWidth / 2
    const halfLength = table.tableLength / 2
    const tableX = table.x
    const tableY = table.y
    const ballR = table.ballDiameter / 2

    // Left/right cushions
    if (
      currentPos.x - ballR < tableX - halfWidth ||
      currentPos.x + ballR > tableX + halfWidth
    ) {
      currentVel.x *= -1
      bounces++
    }

    // Top/bottom cushions
    if (
      currentPos.y - ballR < tableY - halfLength ||
      currentPos.y + ballR > tableY + halfLength
    ) {
      currentVel.y *= -1
      bounces++
    }

    // Apply friction
    currentVel.mult(0.98)

    // Stop if too slow
    if (currentVel.mag() < 0.1) break
  }
}

function drawShotPrediction() {
  if (shotPrediction.length < 2) return

  stroke(255, 255, 255, 100)
  strokeWeight(2)
  noFill()

  beginShape()
  for (let i = 0; i < shotPrediction.length; i++) {
    const alpha = map(i, 0, shotPrediction.length - 1, 50, 200)
    stroke(255, 255, 255, alpha)
    vertex(shotPrediction[i].x, shotPrediction[i].y)
  }
  endShape()

  // Draw prediction points
  for (let i = 0; i < shotPrediction.length; i += 5) {
    const alpha = map(i, 0, shotPrediction.length - 1, 50, 200)
    fill(255, 255, 255, alpha)
    noStroke()
    ellipse(shotPrediction[i].x, shotPrediction[i].y, 4)
  }
}
