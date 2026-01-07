// ============================================================================
// GLOBAL CONSTANTS AND VARIABLES
// ============================================================================

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
