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
 * Ball restitution (0.9) provides energetic collisions with good bounce response.
 * Friction (0.005) and air friction (0.01) allow natural deceleration while
 * maintaining sufficient speed for gameplay. Cushion restitution (0.8) is
 * slightly lower than balls to simulate the rubber cushions' springiness.
 * Ball density (0.001) ensures proper mass-to-size ratio. These values were
 * tuned through experimentation to feel natural while maintaining playability.
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

// ============================================================================
// P5.JS SETUP AND DRAW
// ============================================================================
function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)

  // Initialize Matter.js
  engine = Engine.create()
  world = engine.world
  engine.world.gravity.y = 0 // No gravity for snooker

  // Create table
  table = new Table()
  table.createCushions()

  // Create cue
  cue = new Cue()

  // Setup initial mode
  setupMode1()
}

function draw() {
  background(20, 20, 30)

  // Update physics
  Engine.update(engine)

  // Update cue
  cue.update()

  // Update pockets
  for (let pocket of pockets) {
    pocket.update()
  }

  // Update strike animation
  if (strikeAnimation) {
    strikeAnimation.radius += 2
    strikeAnimation.alpha -= 10
    if (strikeAnimation.alpha <= 0) {
      strikeAnimation = null
    }
  }

  // Draw table
  table.draw()

  // Calculate shot prediction
  calculateShotPrediction()

  // Draw shot prediction
  drawShotPrediction()

  // Draw balls
  if (cueBall) {
    cueBall.update()
    cueBall.draw()
  }

  for (let ball of redBalls) {
    ball.update()
    ball.draw()
  }

  for (let ball of coloredBalls) {
    ball.update()
    ball.draw()
  }

  // Draw pockets AFTER balls so they're always visible
  for (let pocket of pockets) {
    if (pocket) {
      pocket.draw()
    }
  }

  // Draw cue
  cue.draw()

  // Draw strike animation
  if (strikeAnimation) {
    fill(255, 255, 255, strikeAnimation.alpha)
    noStroke()
    ellipse(strikeAnimation.x, strikeAnimation.y, strikeAnimation.radius * 2)
  }

  // Draw cue ball placement indicator
  if (isPlacingCueBall) {
    const isValid = table.isInDZone(mouseX, mouseY)
    fill(255, 255, 255, isValid ? 150 : 100)
    noStroke()
    ellipse(mouseX, mouseY, table.ballDiameter)

    fill(255)
    textAlign(CENTER)
    textSize(20)
    text(
      isValid ? 'Click to place cue ball' : 'Place in D zone only',
      CANVAS_WIDTH / 2,
      50
    )
  }

  // Draw mode indicator
  fill(255)
  textAlign(LEFT)
  textSize(16)
  text(`Mode: ${gameMode}`, 20, CANVAS_HEIGHT - 40)
  text('Press 1, 2, or 3 to switch modes', 20, CANVAS_HEIGHT - 20)
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
function keyPressed() {
  // Mode switching
  if (key === '1') {
    gameMode = 1
    setupMode1()
  } else if (key === '2') {
    gameMode = 2
    setupMode2()
  } else if (key === '3') {
    gameMode = 3
    setupMode3()
  }

  // Cue power adjustment
  if (keyCode === UP_ARROW) {
    cuePower = min(cuePower + 5, 100)
  } else if (keyCode === DOWN_ARROW) {
    cuePower = max(cuePower - 5, 0)
  }

  // Strike
  if (key === ' ') {
    cue.strike()
  }
}

function mousePressed() {
  // Place cue ball
  if (isPlacingCueBall) {
    if (table.isInDZone(mouseX, mouseY)) {
      cueBall = new Ball(mouseX, mouseY, [255, 255, 255], true)
      isPlacingCueBall = false
    }
  } else {
    // Start cue pullback
    cue.startPullback()
  }
}

function mouseReleased() {
  if (!isPlacingCueBall && cue.isPullingBack) {
    cue.strike()
  }
}

// Check for pocketed balls
Events.on(engine, 'afterUpdate', () => {
  // Check cue ball
  if (cueBall && cueBall.body) {
    for (let pocket of pockets) {
      if (pocket.checkBallEntry(cueBall)) {
        // Remove ball if it's within the pocket
        const dx = cueBall.body.position.x - pocket.x
        const dy = cueBall.body.position.y - pocket.y
        const distance = sqrt(dx * dx + dy * dy)

        // Remove if ball center is within pocket radius
        if (distance < pocket.radius) {
          cueBall.remove()
          cueBall = null
          isPlacingCueBall = true
          break
        }
      }
    }
  }

  // Check red balls
  for (let i = redBalls.length - 1; i >= 0; i--) {
    if (!redBalls[i] || !redBalls[i].body) continue

    for (let pocket of pockets) {
      if (pocket.checkBallEntry(redBalls[i])) {
        const dx = redBalls[i].body.position.x - pocket.x
        const dy = redBalls[i].body.position.y - pocket.y
        const distance = sqrt(dx * dx + dy * dy)

        // Remove if ball center is within pocket radius
        if (distance < pocket.radius) {
          redBalls[i].remove()
          redBalls.splice(i, 1)
          break
        }
      }
    }
  }

  // Check colored balls
  for (let i = coloredBalls.length - 1; i >= 0; i--) {
    if (!coloredBalls[i] || !coloredBalls[i].body) continue

    for (let pocket of pockets) {
      if (pocket.checkBallEntry(coloredBalls[i])) {
        const dx = coloredBalls[i].body.position.x - pocket.x
        const dy = coloredBalls[i].body.position.y - pocket.y
        const distance = sqrt(dx * dx + dy * dy)

        // Remove if ball center is within pocket radius
        if (distance < pocket.radius) {
          coloredBalls[i].remove()
          coloredBalls.splice(i, 1)
          break
        }
      }
    }
  }
})
