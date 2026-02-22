/**
 * CM2030 – Graphics Programming – Image Processing Assignment
 * Full implementation using p5.js (v2.2.1) and ml5.js only.
 * All processing via pixel arrays; no filter(), scale(), or translate() shortcuts.
 */

// ============ LAYOUT CONSTANTS ============
const CELL_WIDTH = 160;
const CELL_HEIGHT = 120;
const PADDING = 20;
const LABEL_HEIGHT = 18;
const MARGIN = 20;

const GRID_COLS = 3;
const GRID_ROWS = 6;

const GRID_W = GRID_COLS * CELL_WIDTH + (GRID_COLS - 1) * PADDING;
const GRID_H =
  GRID_ROWS * (CELL_HEIGHT + LABEL_HEIGHT) + (GRID_ROWS - 1) * PADDING;

const CANVAS_W = 2 * MARGIN + GRID_W;
const CANVAS_H = 2 * MARGIN + GRID_H;

const START_X = MARGIN;
const START_Y = MARGIN;

// ============ PROCESSING CONSTANTS ============
const PIXELATE_BLOCK = 5;
const BRIGHTNESS_FACTOR = 0.8;
const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

const FILTER_NONE = 0;
const FILTER_GRAY = 1;
const FILTER_FLIP = 2;
const FILTER_PIXEL = 3;

// ============ STATE ============
let video;
let snapshot = null;
let faceMeshModel = null;
let detectedFaces = [];
let faceFilter = FILTER_NONE;
let sliderR, sliderG, sliderB, sliderHsvV, sliderYcbcrY;

// ============ UTILITY ============

/** Clamp a value to the range [lo, hi]. */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Clamp a value to [0, 255]. */
const clamp255 = (v) => clamp(v, 0, 255);

// ============ SETUP ============
// p5.js v2 removes preload(); ml5 model constructors now return a Promise
// when they detect p5.js v2, so we use async/await in setup().

async function setup() {
  pixelDensity(1);
  createCanvas(CANVAS_W, CANVAS_H);

  video = createCapture(VIDEO);
  video.size(CELL_WIDTH, CELL_HEIGHT);
  video.hide();

  // Await FaceMesh model loading (ml5 returns Promise with p5.js v2)
  faceMeshModel = await ml5.faceMesh({ maxFaces: 1, flipped: false });
  faceMeshModel.detectStart(video, (results) => {
    detectedFaces = results;
  });

  buildSliders();
}

/** Create five labelled sliders to the right of the grid using p5 DOM. */
function buildSliders() {
  const sx = CANVAS_W + 30;
  const sy = START_Y + 10;

  const container = createDiv('');
  container.position(sx, sy);
  container.style('color', '#ccc');
  container.style('font-family', 'Arial, sans-serif');
  container.style('font-size', '11px');
  container.style('line-height', '1.6');

  // Group 1: RGB thresholds
  const title1 = createDiv('RGB Thresholds');
  title1.parent(container);
  title1.style('color', '#fff');
  title1.style('font-weight', 'bold');
  title1.style('margin-bottom', '6px');

  sliderR = labelledSlider(container, 'Red');
  sliderG = labelledSlider(container, 'Green');
  sliderB = labelledSlider(container, 'Blue');

  // Spacer
  const spacer1 = createDiv('');
  spacer1.parent(container);
  spacer1.style('height', '16px');

  // Group 2: Colour space thresholds
  const title2 = createDiv('Colour Space Thresholds');
  title2.parent(container);
  title2.style('color', '#fff');
  title2.style('font-weight', 'bold');
  title2.style('margin-bottom', '6px');

  sliderHsvV = labelledSlider(container, 'HSV V');
  sliderYcbcrY = labelledSlider(container, 'YCbCr Y');

  // Spacer
  const spacer2 = createDiv('');
  spacer2.parent(container);
  spacer2.style('height', '16px');

  // Controls legend
  const legend = createDiv(
    `<strong style="color:#fff">Controls</strong><br>
     S — Take snapshot<br>
     1 — Grayscale face<br>
     2 — Flip face<br>
     3 — Pixelate face<br>
     0 — Reset to live`
  );
  legend.parent(container);
  legend.style('margin-top', '4px');
  legend.style('line-height', '1.8');
}

/** Create a slider with a label inside a flex row. */
const labelledSlider = (parent, label) => {
  const row = createDiv('');
  row.parent(parent);
  row.style('display', 'flex');
  row.style('align-items', 'center');
  row.style('gap', '8px');
  row.style('margin', '4px 0');

  const span = createSpan(label);
  span.parent(row);
  span.style('min-width', '55px');
  span.style('text-align', 'right');

  const s = createSlider(0, 255, 128);
  s.parent(row);
  s.style('width', '120px');

  return s;
};

// ============ DRAW ============
function draw() {
  background(30);
  if (!video) return;

  // Wait for video data before processing
  if (!video.elt || video.elt.readyState < 2) {
    fill(200);
    textSize(14);
    textAlign(CENTER, CENTER);
    text('Waiting for camera...', CANVAS_W / 2, CANVAS_H / 2);
    textAlign(LEFT, BASELINE);
    return;
  }

  const source = snapshot ?? video;

  try {
    renderGrid(source);
  } catch (err) {
    console.error('Draw error:', err);
  }
}

/** Render the full six-row grid of processed images. */
const renderGrid = (source) => {
  const tR = sliderR.value();
  const tG = sliderG.value();
  const tB = sliderB.value();
  const tV = sliderHsvV.value();
  const tY = sliderYcbcrY.value();

  // Row 0: Original | Grayscale -20%
  drawCell(source, 0, 0, 'Original');
  drawCell(applyGrayscaleBrightness(source), 0, 1, 'Grayscale -20%');

  // Row 1: R | G | B channel split
  drawCell(extractChannel(source, 0), 1, 0, 'Red Channel');
  drawCell(extractChannel(source, 1), 1, 1, 'Green Channel');
  drawCell(extractChannel(source, 2), 1, 2, 'Blue Channel');

  // Row 2: Thresholded R | G | B
  drawCell(
    applyThreshold(extractChannel(source, 0), tR),
    2,
    0,
    `Thresh R=${tR}`
  );
  drawCell(
    applyThreshold(extractChannel(source, 1), tG),
    2,
    1,
    `Thresh G=${tG}`
  );
  drawCell(
    applyThreshold(extractChannel(source, 2), tB),
    2,
    2,
    `Thresh B=${tB}`
  );

  // Row 3: Webcam (repeat) | HSV | YCbCr
  drawCell(source, 3, 0, 'Original (repeat)');
  drawCell(convertToHSVImage(source), 3, 1, 'HSV');
  drawCell(convertToYCbCrImage(source), 3, 2, 'YCbCr');

  // Row 4: Face detection | Threshold HSV V | Threshold YCbCr Y
  drawFaceCell(video);
  drawCell(
    applyThreshold(extractHSV_V(source), tV),
    4,
    1,
    `Thresh HSV V=${tV}`
  );
  drawCell(
    applyThreshold(extractYCbCr_Y(source), tY),
    4,
    2,
    `Thresh YCbCr Y=${tY}`
  );

  // Row 5: Extension – Sobel edge detection
  drawCell(applySobelEdgeDetection(source), 5, 0, 'Sobel Edges');
};

// ============ LAYOUT ============

/**
 * Draw a labelled image cell at a grid position.
 * @param {p5.Image|p5.MediaElement} img - image to draw
 * @param {number} row - grid row (0-based)
 * @param {number} col - grid column (0-based)
 * @param {string} label - text label displayed above the cell
 */
const drawCell = (img, row, col, label) => {
  const x = START_X + col * (CELL_WIDTH + PADDING);
  const y = START_Y + row * (CELL_HEIGHT + PADDING + LABEL_HEIGHT);

  // Label above cell
  fill(210);
  noStroke();
  textSize(10);
  textAlign(LEFT, BOTTOM);
  text(label, x, y + LABEL_HEIGHT - 2);

  // Cell border (subtle)
  stroke(55);
  strokeWeight(1);
  noFill();
  rect(x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

  // Image
  if (img) {
    noStroke();
    image(img, x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
  }
};

/**
 * Render the face detection cell at Row 4, Col 0.
 * Shows the full webcam frame with the face region replaced by the active filter.
 */
const drawFaceCell = (source) => {
  const filterNames = ['Original', 'Grayscale', 'Flipped', 'Pixelated'];
  const label = `Face — ${filterNames[faceFilter]}`;

  const x = START_X;
  const y = START_Y + 4 * (CELL_HEIGHT + PADDING + LABEL_HEIGHT);

  // Label
  fill(210);
  noStroke();
  textSize(10);
  textAlign(LEFT, BOTTOM);
  text(label, x, y + LABEL_HEIGHT - 2);

  // Cell border
  stroke(55);
  strokeWeight(1);
  noFill();
  rect(x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

  // Draw the full webcam frame as background
  noStroke();
  image(source, x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

  if (detectedFaces.length === 0) return;

  const { box: bbox } = detectedFaces[0];
  if (!bbox) return;

  // Clamp bounding box to source image bounds
  const bx = Math.max(0, Math.floor(bbox.xMin));
  const by = Math.max(0, Math.floor(bbox.yMin));
  const bw = Math.min(source.width - bx, Math.ceil(bbox.width));
  const bh = Math.min(source.height - by, Math.ceil(bbox.height));
  if (bw <= 0 || bh <= 0) return;

  // Extract face region manually using pixel arrays
  let faceImg = extractRegion(source, bx, by, bw, bh);
  if (!faceImg) return;

  // Apply selected face filter
  if (faceFilter === FILTER_GRAY) {
    faceImg = toGrayscale(faceImg);
  } else if (faceFilter === FILTER_FLIP) {
    faceImg = applyHorizontalFlip(faceImg);
  } else if (faceFilter === FILTER_PIXEL) {
    faceImg = applyPixelation(faceImg);
  }

  // Scale bounding box coordinates from source space to cell space
  const scaleX = CELL_WIDTH / source.width;
  const scaleY = CELL_HEIGHT / source.height;
  const dx = x + bx * scaleX;
  const dy = y + LABEL_HEIGHT + by * scaleY;
  const dw = bw * scaleX;
  const dh = bh * scaleY;

  // Overlay the filtered face on top of the full frame
  noStroke();
  image(faceImg, dx, dy, dw, dh);
};

// ============ PIXEL PROCESSING ============

/**
 * Helper: iterate every pixel, call fn(i, srcPixels, dstPixels) where i is
 * the RGBA offset. Returns a new p5.Image with the output pixels.
 */
const processPixels = (img, fn) => {
  const { width: w, height: h } = img;
  img.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;
      fn(i, img.pixels, out.pixels);
    }
  }
  out.updatePixels();
  return out;
};

/** Set an RGBA pixel in the output array to a uniform grey value. */
const setGray = (pixels, i, v) => {
  pixels[i] = v;
  pixels[i + 1] = v;
  pixels[i + 2] = v;
  pixels[i + 3] = 255;
};

/**
 * Convert image to grayscale using the luminosity method.
 * Pure conversion with no brightness change.
 */
const toGrayscale = (img) =>
  processPixels(img, (i, src, dst) => {
    const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    setGray(dst, i, gray);
  });

/**
 * Convert to grayscale AND reduce brightness by 20% in the SAME nested loop.
 * Luminosity formula: gray = 0.299*R + 0.587*G + 0.114*B
 * Brightness: gray *= 0.8, clamped to [0, 255].
 */
const applyGrayscaleBrightness = (img) =>
  processPixels(img, (i, src, dst) => {
    const gray =
      (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) *
      BRIGHTNESS_FACTOR;
    setGray(dst, i, clamp255(gray));
  });

/**
 * Extract a single RGB channel as a grayscale image.
 * @param {number} ch - 0 = red, 1 = green, 2 = blue
 */
const extractChannel = (img, ch) =>
  processPixels(img, (i, src, dst) => {
    setGray(dst, i, src[i + ch]);
  });

/**
 * Binary threshold: pixel >= thresh -> 255, else -> 0.
 */
const applyThreshold = (img, thresh) =>
  processPixels(img, (i, src, dst) => {
    setGray(dst, i, src[i] >= thresh ? 255 : 0);
  });

// ============ COLOUR SPACE CONVERSION ============

/**
 * Compute HSV from RGB (0-255 inputs).
 * Returns {h: 0-360, s: 0-1, v: 0-1}.
 */
const computeHSV = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const cMax = Math.max(rn, gn, bn);
  const cMin = Math.min(rn, gn, bn);
  const delta = cMax - cMin;
  const s = cMax === 0 ? 0 : delta / cMax;
  const v = cMax;

  let h = 0;
  if (delta !== 0) {
    if (cMax === rn) h = ((gn - bn) / delta) % 6;
    else if (cMax === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    if (h < 0) h += 6;
    h *= 60;
  }

  return { h, s, v };
};

/**
 * Compute YCbCr from RGB (0-255 inputs) using ITU-R BT.601.
 * Returns {y: 16-235, cb: 16-240, cr: 16-240}.
 */
const computeYCbCr = (r, g, b) => {
  const y = 16 + (65.481 * r + 128.553 * g + 24.966 * b) / 255;
  const cb = 128 + (-37.797 * r - 74.203 * g + 112.0 * b) / 255;
  const cr = 128 + (112.0 * r - 93.786 * g - 18.214 * b) / 255;
  return { y, cb, cr };
};

/** Convert image to HSV and display H->R, S->G, V->B (all mapped to 0-255). */
const convertToHSVImage = (img) =>
  processPixels(img, (i, src, dst) => {
    const { h, s, v } = computeHSV(src[i], src[i + 1], src[i + 2]);
    dst[i] = (h / 360) * 255;
    dst[i + 1] = s * 255;
    dst[i + 2] = v * 255;
    dst[i + 3] = 255;
  });

/** Convert image to YCbCr and display Y->R, Cb->G, Cr->B. */
const convertToYCbCrImage = (img) =>
  processPixels(img, (i, src, dst) => {
    const { y, cb, cr } = computeYCbCr(src[i], src[i + 1], src[i + 2]);
    dst[i] = clamp255(y);
    dst[i + 1] = clamp255(cb);
    dst[i + 2] = clamp255(cr);
    dst[i + 3] = 255;
  });

/** Extract HSV V channel as grayscale (0-255). */
const extractHSV_V = (img) =>
  processPixels(img, (i, src, dst) => {
    const { v } = computeHSV(src[i], src[i + 1], src[i + 2]);
    setGray(dst, i, clamp255(v * 255));
  });

/** Extract YCbCr Y (luma) channel as grayscale (0-255). */
const extractYCbCr_Y = (img) =>
  processPixels(img, (i, src, dst) => {
    const { y } = computeYCbCr(src[i], src[i + 1], src[i + 2]);
    setGray(dst, i, clamp255(y));
  });

// ============ FACE REGION HELPERS ============

/** Extract a rectangular region from an image using nested loops. */
const extractRegion = (img, sx, sy, sw, sh) => {
  const srcW = img.width;
  img.loadPixels();
  const out = createImage(sw, sh);
  out.loadPixels();
  for (let py = 0; py < sh; py++) {
    for (let px = 0; px < sw; px++) {
      const srcI = ((sy + py) * srcW + (sx + px)) * 4;
      const dstI = (py * sw + px) * 4;
      out.pixels[dstI] = img.pixels[srcI];
      out.pixels[dstI + 1] = img.pixels[srcI + 1];
      out.pixels[dstI + 2] = img.pixels[srcI + 2];
      out.pixels[dstI + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
};

/**
 * Horizontal flip using manual nested loops.
 * No scale() or translate() used.
 */
const applyHorizontalFlip = (img) => {
  const { width: w, height: h } = img;
  img.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const srcI = (py * w + (w - 1 - px)) * 4;
      const dstI = (py * w + px) * 4;
      out.pixels[dstI] = img.pixels[srcI];
      out.pixels[dstI + 1] = img.pixels[srcI + 1];
      out.pixels[dstI + 2] = img.pixels[srcI + 2];
      out.pixels[dstI + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
};

/**
 * Pixelation effect:
 * 1. Convert face to grayscale.
 * 2. Split into 5x5 blocks.
 * 3. Compute average intensity per block using pixel array.
 * 4. Draw a filled circle (noStroke) at the centre of each block.
 */
const applyPixelation = (img) => {
  const { width: w, height: h } = img;
  const gray = toGrayscale(img);
  gray.loadPixels();
  const blk = PIXELATE_BLOCK;
  const pg = createGraphics(w, h);
  pg.pixelDensity(1);
  pg.background(0);
  pg.noStroke();

  for (let by = 0; by < h; by += blk) {
    for (let bx = 0; bx < w; bx += blk) {
      let sum = 0;
      let count = 0;
      for (let dy = 0; dy < blk && by + dy < h; dy++) {
        for (let dx = 0; dx < blk && bx + dx < w; dx++) {
          sum += gray.pixels[((by + dy) * w + (bx + dx)) * 4];
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      pg.fill(avg);
      pg.circle(bx + blk / 2, by + blk / 2, blk);
    }
  }

  const result = pg.get();
  pg.remove();
  return result;
};

// ============ EXTENSION: REAL-TIME SOBEL EDGE DETECTION ============

/**
 * Apply Sobel edge detection using two 3x3 kernels (Gx, Gy).
 * Input is first converted to pure grayscale, then convolved.
 * Gradient magnitude: G = sqrt(Gx^2 + Gy^2), clamped to 0-255.
 * Border pixels use zero-padding.
 */
const applySobelEdgeDetection = (img) => {
  const { width: w, height: h } = img;
  const gray = toGrayscale(img);
  gray.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let gx = 0;
      let gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = px + kx;
          const ny = py + ky;
          const nv =
            nx >= 0 && nx < w && ny >= 0 && ny < h
              ? gray.pixels[(ny * w + nx) * 4]
              : 0;
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += nv * SOBEL_X[ki];
          gy += nv * SOBEL_Y[ki];
        }
      }
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const i = (py * w + px) * 4;
      setGray(out.pixels, i, mag);
    }
  }

  out.updatePixels();
  return out;
};

// ============ INPUT ============

function keyPressed() {
  if (key === 'S' || key === 's') {
    snapshot = createImage(CELL_WIDTH, CELL_HEIGHT);
    snapshot.copy(
      video,
      0,
      0,
      video.width,
      video.height,
      0,
      0,
      CELL_WIDTH,
      CELL_HEIGHT
    );
  }
  if (key === '1') faceFilter = FILTER_GRAY;
  if (key === '2') faceFilter = FILTER_FLIP;
  if (key === '3') faceFilter = FILTER_PIXEL;
  if (key === '0') {
    faceFilter = FILTER_NONE;
    snapshot = null;
  }
  return false;
}

/*
 * ============================================================================
 * COMMENTARY
 * ============================================================================
 *
 * This application implements a real-time image processing pipeline for the
 * CM2030 Graphics Programming module using only p5.js for rendering and ml5.js
 * for machine-learning-based face detection. Every image transformation is
 * performed manually through nested loops over pixel arrays, strictly avoiding
 * prohibited shortcuts such as filter(), scale(), and translate().
 *
 * APPLICATION WALKTHROUGH
 *
 * On launch the application opens the user's webcam via createCapture and
 * displays a six-row grid of 160 by 120 pixel cells. Row one shows the live
 * feed alongside a grayscale copy whose brightness has been reduced by twenty
 * percent. The grayscale conversion applies the standard luminosity formula
 * (0.299R plus 0.587G plus 0.114B) and the brightness reduction is computed
 * multiplicatively inside the same nested loop, ensuring no pixel is visited
 * twice. Row two isolates the red, green, and blue channels as independent
 * greyscale images. Row three applies per-channel binary thresholding
 * controlled by three dedicated sliders that update in real time. Row four
 * repeats the webcam image alongside the image converted to HSV and YCbCr
 * colour spaces using manually coded formulas. Row five displays the face
 * region detected by ml5 FaceMesh alongside thresholded V (HSV) and Y
 * (YCbCr) channels; pressing keys one, two, or three replaces the face
 * with a greyscale version, a horizontally flipped copy, or a pixelated
 * rendition respectively. Pressing S captures a snapshot that becomes the
 * processing source for all rows until a new one is taken.
 *
 * PROBLEMS AND SOLUTIONS
 *
 * A significant obstacle was pixel-density scaling on high-DPI displays. By
 * default p5.js doubles pixel-array dimensions on Retina screens, which
 * corrupted every manual loop. Setting pixelDensity to one in setup eliminated
 * the mismatch. Face detection required the ml5 version-one API, which exposes
 * a bounding box object directly rather than the legacy scaledMesh array.
 * Horizontal flipping reads each row from right to left in a nested loop,
 * avoiding the prohibited scale and translate calls. Pixelation converts the
 * face to greyscale, divides it into five-by-five blocks, averages each block
 * with a pixel-array traversal, and renders a filled circle at every block
 * centre via the p5 circle function with noStroke. The HSV conversion follows
 * the hexcone model; YCbCr uses ITU-R BT.601 coefficients.
 *
 * PROJECT GOALS
 *
 * All functional requirements have been met. The codebase is modular, with
 * dedicated functions for each transformation and a clear separation between
 * processing logic and grid rendering. Shared helper functions for HSV and
 * YCbCr conversion eliminate duplicated computation.
 *
 * EXTENSION — SOBEL EDGE DETECTION
 *
 * The extension applies real-time Sobel edge detection, displayed in row
 * six. Two three-by-three kernels convolve the greyscale source to produce
 * horizontal and vertical gradient estimates, which are combined as the square
 * root of the sum of their squares. The result highlights intensity
 * discontinuities, effectively outlining objects in the scene. This is
 * technically interesting because it demonstrates kernel convolution, a
 * foundational operation in computer vision used in feature extraction,
 * object recognition, and image segmentation pipelines.
 *
 * ============================================================================
 */
