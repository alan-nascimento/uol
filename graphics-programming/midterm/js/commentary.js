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
