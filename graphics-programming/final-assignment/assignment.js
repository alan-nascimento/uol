/**
 * CM2030 – Graphics Programming – Image Processing Assignment
 * Full implementation using p5.js and ml5.js only.
 * All processing via pixel arrays; no filter(), scale(), or translate() shortcuts.
 */

// ============ CONSTANTS ============
var IMG_W = 160
var IMG_H = 120
var CELL_PAD = 10
var PIXELATE_BLOCK = 5

// Sobel convolution kernels
var SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
var SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

// Face filter mode constants
var FILTER_NONE = 0
var FILTER_GRAY = 1
var FILTER_FLIP = 2
var FILTER_PIXEL = 3

// Grid layout: 3 columns, 7 rows
var GRID_COLS = 3
var GRID_ROWS = 7
var CANVAS_W = GRID_COLS * IMG_W + (GRID_COLS + 1) * CELL_PAD
var CANVAS_H = GRID_ROWS * IMG_H + (GRID_ROWS + 1) * CELL_PAD

// ============ STATE ============
var video
var snapshot = null
var faceMeshModel = null
var detectedFaces = []
var faceFilter = FILTER_NONE
var sliderR, sliderG, sliderB, sliderHsvV, sliderYcbcrY

// ============ PRELOAD ============
function preload() {
  faceMeshModel = ml5.faceMesh({ maxFaces: 1, flipped: false })
}

// ============ SETUP ============
function setup() {
  pixelDensity(1)
  createCanvas(CANVAS_W, CANVAS_H)

  video = createCapture(VIDEO)
  video.size(IMG_W, IMG_H)
  video.hide()

  faceMeshModel.detectStart(video, function (results) {
    detectedFaces = results
  })

  buildSliders()
}

/** Create five labelled sliders below the canvas using p5 DOM elements. */
function buildSliders() {
  var container = createDiv('')
  container.position(10, CANVAS_H + 30)
  container.style('color', '#ccc')
  container.style('font-family', 'Arial, sans-serif')
  container.style('font-size', '12px')

  sliderR = labelledSlider(container, 'Red Threshold')
  sliderG = labelledSlider(container, 'Green Threshold')
  sliderB = labelledSlider(container, 'Blue Threshold')

  // Spacer
  var spacer = createDiv('')
  spacer.parent(container)
  spacer.style('height', '8px')

  sliderHsvV = labelledSlider(container, 'HSV V Threshold')
  sliderYcbcrY = labelledSlider(container, 'YCbCr Y Threshold')
}

function labelledSlider(parent, label) {
  var row = createDiv('')
  row.parent(parent)
  row.style('margin', '3px 0')
  row.style('display', 'flex')
  row.style('align-items', 'center')
  row.style('gap', '8px')

  var span = createSpan(label)
  span.parent(row)
  span.style('min-width', '130px')

  var s = createSlider(0, 255, 128)
  s.parent(row)
  s.style('width', '150px')
  return s
}

// ============ DRAW ============
function draw() {
  background(30)
  if (!video) return

  // Wait for video data before processing
  if (!video.elt || video.elt.readyState < 2) {
    fill(200)
    textSize(14)
    textAlign(CENTER, CENTER)
    text('Waiting for camera...', CANVAS_W / 2, CANVAS_H / 2)
    textAlign(LEFT, BASELINE)
    return
  }

  var source = snapshot !== null ? snapshot : video

  try {
    renderGrid(source)
  } catch (err) {
    console.error('Draw error:', err)
  }
}

/** Render the full seven-row grid of processed images. */
function renderGrid(source) {
  var tR = sliderR.value()
  var tG = sliderG.value()
  var tB = sliderB.value()
  var tV = sliderHsvV.value()
  var tY = sliderYcbcrY.value()

  // Row 0: Original | Grayscale -20%
  drawCell(source, 0, 0, 'Original')
  drawCell(applyGrayscaleBrightness(source), 1, 0, 'Grayscale -20%')

  // Row 1: R | G | B channel split
  drawCell(extractChannel(source, 0), 0, 1, 'Red Channel')
  drawCell(extractChannel(source, 1), 1, 1, 'Green Channel')
  drawCell(extractChannel(source, 2), 2, 1, 'Blue Channel')

  // Row 2: Thresholded R | G | B
  drawCell(
    applyThreshold(extractChannel(source, 0), tR),
    0,
    2,
    'Thresh R=' + tR
  )
  drawCell(
    applyThreshold(extractChannel(source, 1), tG),
    1,
    2,
    'Thresh G=' + tG
  )
  drawCell(
    applyThreshold(extractChannel(source, 2), tB),
    2,
    2,
    'Thresh B=' + tB
  )

  // Row 3: HSV | YCbCr colour space visualisations
  drawCell(convertToHSVImage(source), 0, 3, 'HSV')
  drawCell(convertToYCbCrImage(source), 1, 3, 'YCbCr')

  // Row 4: Threshold from V (HSV) | Y (YCbCr)
  drawCell(applyThreshold(extractHSV_V(source), tV), 0, 4, 'Thresh HSV V=' + tV)
  drawCell(
    applyThreshold(extractYCbCr_Y(source), tY),
    1,
    4,
    'Thresh YCbCr Y=' + tY
  )

  // Row 5: Face detection + face replacement
  drawFaceCell(video)

  // Row 6: Extension – Sobel edge detection
  drawCell(applySobelEdgeDetection(source), 0, 6, 'Sobel Edges')
}

// ============ LAYOUT ============

function cellX(col) {
  return CELL_PAD + col * (IMG_W + CELL_PAD)
}

function cellY(row) {
  return CELL_PAD + row * (IMG_H + CELL_PAD)
}

function drawCell(img, col, row, label) {
  var x = cellX(col)
  var y = cellY(row)
  if (img) {
    image(img, x, y, IMG_W, IMG_H)
  }
  fill(255)
  noStroke()
  textSize(10)
  textAlign(LEFT, BASELINE)
  text(label, x + 2, y + 10)
}

// ============ PIXEL PROCESSING ============

/**
 * Convert image to grayscale using the luminosity method.
 * Pure conversion with no brightness change.
 */
function toGrayscale(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var gray =
        0.299 * img.pixels[i] +
        0.587 * img.pixels[i + 1] +
        0.114 * img.pixels[i + 2]
      out.pixels[i] = gray
      out.pixels[i + 1] = gray
      out.pixels[i + 2] = gray
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/**
 * Convert to grayscale AND reduce brightness by 20% in the SAME nested loop.
 * Luminosity formula: gray = 0.299*R + 0.587*G + 0.114*B
 * Brightness: gray *= 0.8, clamped to [0, 255].
 */
function applyGrayscaleBrightness(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var gray =
        0.299 * img.pixels[i] +
        0.587 * img.pixels[i + 1] +
        0.114 * img.pixels[i + 2]
      gray = gray * 0.8 // reduce brightness by 20%
      if (gray < 0) gray = 0
      if (gray > 255) gray = 255
      out.pixels[i] = gray
      out.pixels[i + 1] = gray
      out.pixels[i + 2] = gray
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/**
 * Extract a single RGB channel as a grayscale image.
 * @param {number} ch - 0 = red, 1 = green, 2 = blue
 */
function extractChannel(img, ch) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var v = img.pixels[i + ch]
      out.pixels[i] = v
      out.pixels[i + 1] = v
      out.pixels[i + 2] = v
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/**
 * Binary threshold: pixel >= thresh → 255, else → 0.
 */
function applyThreshold(img, thresh) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var v = img.pixels[i] >= thresh ? 255 : 0
      out.pixels[i] = v
      out.pixels[i + 1] = v
      out.pixels[i + 2] = v
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

// ============ COLOUR SPACE CONVERSION ============

/**
 * Compute HSV from RGB (0-255 inputs).
 * Returns {h: 0-360, s: 0-1, v: 0-1}.
 */
function computeHSV(r, g, b) {
  var rn = r / 255
  var gn = g / 255
  var bn = b / 255
  var cMax = Math.max(rn, gn, bn)
  var cMin = Math.min(rn, gn, bn)
  var delta = cMax - cMin
  var h = 0
  var s = cMax === 0 ? 0 : delta / cMax
  var v = cMax
  if (delta !== 0) {
    if (cMax === rn) {
      h = ((gn - bn) / delta) % 6
    } else if (cMax === gn) {
      h = (bn - rn) / delta + 2
    } else {
      h = (rn - gn) / delta + 4
    }
    if (h < 0) h += 6
    h *= 60
  }
  return { h: h, s: s, v: v }
}

/**
 * Compute YCbCr from RGB (0-255 inputs) using ITU-R BT.601.
 * Returns {y: 16-235, cb: 16-240, cr: 16-240}.
 */
function computeYCbCr(r, g, b) {
  var y = 16 + (65.481 * r + 128.553 * g + 24.966 * b) / 255
  var cb = 128 + (-37.797 * r - 74.203 * g + 112.0 * b) / 255
  var cr = 128 + (112.0 * r - 93.786 * g - 18.214 * b) / 255
  return { y: y, cb: cb, cr: cr }
}

/** Convert image to HSV and display H→R, S→G, V→B (all mapped to 0-255). */
function convertToHSVImage(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var hsv = computeHSV(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2])
      out.pixels[i] = (hsv.h / 360) * 255
      out.pixels[i + 1] = hsv.s * 255
      out.pixels[i + 2] = hsv.v * 255
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Convert image to YCbCr and display Y→R, Cb→G, Cr→B. */
function convertToYCbCrImage(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var ycbcr = computeYCbCr(
        img.pixels[i],
        img.pixels[i + 1],
        img.pixels[i + 2]
      )
      out.pixels[i] = Math.max(0, Math.min(255, ycbcr.y))
      out.pixels[i + 1] = Math.max(0, Math.min(255, ycbcr.cb))
      out.pixels[i + 2] = Math.max(0, Math.min(255, ycbcr.cr))
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Extract HSV V channel as grayscale (0-255). */
function extractHSV_V(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var hsv = computeHSV(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2])
      var val = Math.max(0, Math.min(255, hsv.v * 255))
      out.pixels[i] = val
      out.pixels[i + 1] = val
      out.pixels[i + 2] = val
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Extract YCbCr Y (luma) channel as grayscale (0-255). */
function extractYCbCr_Y(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var i = (py * w + px) * 4
      var ycbcr = computeYCbCr(
        img.pixels[i],
        img.pixels[i + 1],
        img.pixels[i + 2]
      )
      var val = Math.max(0, Math.min(255, ycbcr.y))
      out.pixels[i] = val
      out.pixels[i + 1] = val
      out.pixels[i + 2] = val
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

// ============ FACE DETECTION & REPLACEMENT ============

/** Render the face detection cell (Row 5). Shows detected face with optional filter. */
function drawFaceCell(source) {
  var x = cellX(0)
  var y = cellY(5)
  var cw = IMG_W * 2 + CELL_PAD
  var ch = IMG_H
  var filterNames = ['Original', 'Grayscale', 'Flipped', 'Pixelated']

  // Label
  fill(255)
  noStroke()
  textSize(10)
  textAlign(LEFT, BASELINE)
  text('Face — ' + filterNames[faceFilter] + '  (keys 1/2/3)', x + 2, y + 10)

  if (detectedFaces.length === 0) {
    fill(50)
    noStroke()
    rect(x, y + 14, cw, ch - 14)
    fill(150)
    textSize(11)
    textAlign(CENTER, CENTER)
    text('No face detected', x + cw / 2, y + ch / 2)
    textAlign(LEFT, BASELINE)
    return
  }

  var face = detectedFaces[0]
  var bbox = face.box
  if (!bbox) return

  // Clamp bounding box to image bounds
  var sx = Math.max(0, Math.floor(bbox.xMin))
  var sy = Math.max(0, Math.floor(bbox.yMin))
  var sw = Math.min(source.width - sx, Math.ceil(bbox.width))
  var sh = Math.min(source.height - sy, Math.ceil(bbox.height))
  if (sw <= 0 || sh <= 0) return

  // Extract face region manually using pixel arrays
  var faceImg = extractRegion(source, sx, sy, sw, sh)
  if (!faceImg) return

  // Apply selected face filter
  if (faceFilter === FILTER_GRAY) {
    faceImg = toGrayscale(faceImg)
  } else if (faceFilter === FILTER_FLIP) {
    faceImg = applyHorizontalFlip(faceImg)
  } else if (faceFilter === FILTER_PIXEL) {
    faceImg = applyPixelation(faceImg)
  }

  image(faceImg, x, y + 14, Math.min(sw, cw), Math.min(sh, ch - 14))
}

/** Extract a rectangular region from an image using nested loops. */
function extractRegion(img, sx, sy, sw, sh) {
  var srcW = img.width
  img.loadPixels()
  var out = createImage(sw, sh)
  out.loadPixels()
  for (var py = 0; py < sh; py++) {
    for (var px = 0; px < sw; px++) {
      var srcI = ((sy + py) * srcW + (sx + px)) * 4
      var dstI = (py * sw + px) * 4
      out.pixels[dstI] = img.pixels[srcI]
      out.pixels[dstI + 1] = img.pixels[srcI + 1]
      out.pixels[dstI + 2] = img.pixels[srcI + 2]
      out.pixels[dstI + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/**
 * Horizontal flip using manual nested loops.
 * No scale() or translate() used.
 */
function applyHorizontalFlip(img) {
  var w = img.width
  var h = img.height
  img.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()
  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var srcI = (py * w + (w - 1 - px)) * 4
      var dstI = (py * w + px) * 4
      out.pixels[dstI] = img.pixels[srcI]
      out.pixels[dstI + 1] = img.pixels[srcI + 1]
      out.pixels[dstI + 2] = img.pixels[srcI + 2]
      out.pixels[dstI + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/**
 * Pixelation effect:
 * 1. Convert face to grayscale.
 * 2. Split into 5x5 blocks.
 * 3. Compute average intensity per block using pixel array.
 * 4. Draw a filled circle (noStroke) at the centre of each block.
 */
function applyPixelation(img) {
  var w = img.width
  var h = img.height
  var gray = toGrayscale(img)
  gray.loadPixels()
  var blk = PIXELATE_BLOCK
  var pg = createGraphics(w, h)
  pg.pixelDensity(1)
  pg.background(0)
  pg.noStroke()
  for (var by = 0; by < h; by += blk) {
    for (var bx = 0; bx < w; bx += blk) {
      var sum = 0
      var count = 0
      for (var dy = 0; dy < blk && by + dy < h; dy++) {
        for (var dx = 0; dx < blk && bx + dx < w; dx++) {
          sum += gray.pixels[((by + dy) * w + (bx + dx)) * 4]
          count++
        }
      }
      var avg = count > 0 ? sum / count : 0
      pg.fill(avg)
      pg.circle(bx + blk / 2, by + blk / 2, blk)
    }
  }
  var result = pg.get()
  pg.remove()
  return result
}

// ============ EXTENSION: REAL-TIME SOBEL EDGE DETECTION ============

/**
 * Apply Sobel edge detection using two 3x3 kernels (Gx, Gy).
 * Input is first converted to pure grayscale, then convolved.
 * Gradient magnitude: G = sqrt(Gx^2 + Gy^2), clamped to 0-255.
 * Border pixels use zero-padding.
 */
function applySobelEdgeDetection(img) {
  var w = img.width
  var h = img.height
  var gray = toGrayscale(img)
  gray.loadPixels()
  var out = createImage(w, h)
  out.loadPixels()

  for (var py = 0; py < h; py++) {
    for (var px = 0; px < w; px++) {
      var gx = 0
      var gy = 0
      for (var ky = -1; ky <= 1; ky++) {
        for (var kx = -1; kx <= 1; kx++) {
          var nx = px + kx
          var ny = py + ky
          var nv =
            nx >= 0 && nx < w && ny >= 0 && ny < h
              ? gray.pixels[(ny * w + nx) * 4]
              : 0
          var ki = (ky + 1) * 3 + (kx + 1)
          gx += nv * SOBEL_X[ki]
          gy += nv * SOBEL_Y[ki]
        }
      }
      var mag = Math.sqrt(gx * gx + gy * gy)
      if (mag > 255) mag = 255
      var i = (py * w + px) * 4
      out.pixels[i] = mag
      out.pixels[i + 1] = mag
      out.pixels[i + 2] = mag
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

// ============ INPUT ============

function keyPressed() {
  if (key === 'S' || key === 's') {
    snapshot = createImage(IMG_W, IMG_H)
    snapshot.copy(video, 0, 0, video.width, video.height, 0, 0, IMG_W, IMG_H)
  }
  if (key === '1') faceFilter = FILTER_GRAY
  if (key === '2') faceFilter = FILTER_FLIP
  if (key === '3') faceFilter = FILTER_PIXEL
  return false
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
 * displays a seven-row grid of 160 by 120 pixel cells. Row one shows the live
 * feed alongside a grayscale copy whose brightness has been reduced by twenty
 * percent. The grayscale conversion applies the standard luminosity formula
 * (0.299R plus 0.587G plus 0.114B) and the brightness reduction is computed
 * multiplicatively inside the same nested loop, ensuring no pixel is visited
 * twice. Row two isolates the red, green, and blue channels as independent
 * greyscale images. Row three applies per-channel binary thresholding
 * controlled by three dedicated sliders that update in real time. Row four
 * presents the image converted to HSV and YCbCr colour spaces using manually
 * coded formulas. Row five thresholds the V channel from HSV and the Y channel
 * from YCbCr, each governed by its own slider. Row six displays the face
 * region detected by ml5 FaceMesh; pressing keys one, two, or three replaces
 * that region with a greyscale version, a horizontally flipped copy, or a
 * pixelated rendition respectively. Pressing S captures a snapshot that
 * becomes the processing source for all rows until a new one is taken.
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
 * seven. Two three-by-three kernels convolve the greyscale source to produce
 * horizontal and vertical gradient estimates, which are combined as the square
 * root of the sum of their squares. The result highlights intensity
 * discontinuities, effectively outlining objects in the scene. This is
 * technically interesting because it demonstrates kernel convolution, a
 * foundational operation in computer vision used in feature extraction,
 * object recognition, and image segmentation pipelines.
 *
 * ============================================================================
 */
