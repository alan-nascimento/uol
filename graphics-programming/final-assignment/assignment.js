/**
 * CM2030 – Graphics Programming – Image Processing Assignment
 * Full implementation using p5.js and ml5.js only.
 * All processing via pixel arrays; no filter(), scale(), or translate() shortcuts.
 */

// ============ CONSTANTS ============
const IMG_W = 160
const IMG_H = 120
const CELL_PADDING = 8
const FACE_FILTER_NONE = 0
const FACE_FILTER_GRAYSCALE = 1
const FACE_FILTER_FLIP = 2
const FACE_FILTER_PIXELATE = 3
const PIXELATE_BLOCK = 5

// Sobel kernels
const SOBEL_GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
const SOBEL_GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

// ============ GLOBAL STATE ============
let video
let snapshotBuffer = null // p5.Image resized to 160x120
let facemesh
let facePredictions = []
let faceFilterMode = FACE_FILTER_NONE
let thresholdRed = 128
let thresholdGreen = 128
let thresholdBlue = 128
let thresholdHSV = 128
let thresholdYCbCr = 128
let sliderR, sliderG, sliderB, sliderHSV, sliderYCbCr
let prevFramePixels = null // For extension: motion detection or Sobel
let sobelBuffer = null

// Canvas dimensions based on grid
const COLS = 3
const ROWS = 7 // 6 main + 1 extension (Sobel)
const CANVAS_W = COLS * IMG_W + (COLS + 1) * CELL_PADDING
const CANVAS_H = ROWS * IMG_H + (ROWS + 1) * CELL_PADDING

// ============ SETUP ============
function setup() {
  createCanvas(CANVAS_W, CANVAS_H)
  const constraints = {
    video: { width: IMG_W, height: IMG_H },
    audio: false
  }
  video = createCapture(constraints)
  video.size(IMG_W, IMG_H)
  video.hide()

  facemesh = ml5.facemesh(video, () => console.log('FaceMesh ready'))
  facemesh.on('face', (results) => {
    facePredictions = results
  })

  createSliders()
}

function createSliders() {
  const sliderY = CANVAS_H + 20
  sliderR = createSlider(0, 255, 128)
  sliderR.position(10, sliderY)
  sliderG = createSlider(0, 255, 128)
  sliderG.position(10, sliderY + 25)
  sliderB = createSlider(0, 255, 128)
  sliderB.position(10, sliderY + 50)
  sliderHSV = createSlider(0, 255, 128)
  sliderHSV.position(10, sliderY + 100)
  sliderYCbCr = createSlider(0, 255, 128)
  sliderYCbCr.position(10, sliderY + 125)
}

// ============ MAIN DRAW ============
function draw() {
  background(30)
  const videoReady = video && (video.width > 0 || (video.elt && video.elt.videoWidth > 0))
  if (!videoReady) {
    fill(255)
    textAlign(CENTER, CENTER)
    text('Aguardando câmera... (use servidor local: python -m http.server)', width / 2, height / 2)
    return
  }
  textAlign(LEFT, BASELINE)
  const source = getSourceImage()

  // Row 1: Webcam + Grayscale+Brightness
  drawCell(source, 0, 0, 'Webcam')
  drawCell(applyGrayscaleBrightness(source), 1, 0, 'Gray -20%')

  // Row 2: R, G, B channels
  drawCell(extractChannel(source, 'r'), 0, 1, 'Red')
  drawCell(extractChannel(source, 'g'), 1, 1, 'Green')
  drawCell(extractChannel(source, 'b'), 2, 1, 'Blue')

  // Row 3: Threshold R, G, B
  thresholdRed = sliderR.value()
  thresholdGreen = sliderG.value()
  thresholdBlue = sliderB.value()
  drawCell(
    applyThreshold(extractChannel(source, 'r'), thresholdRed),
    0,
    2,
    'Thr R'
  )
  drawCell(
    applyThreshold(extractChannel(source, 'g'), thresholdGreen),
    1,
    2,
    'Thr G'
  )
  drawCell(
    applyThreshold(extractChannel(source, 'b'), thresholdBlue),
    2,
    2,
    'Thr B'
  )

  // Row 4: HSV, YCbCr
  const hsvImg = rgbToHSV(source)
  const ycbcrImg = rgbToYCbCr(source)
  drawCell(hsvImg, 0, 3, 'HSV')
  drawCell(ycbcrImg, 1, 3, 'YCbCr')

  // Row 5: Threshold from colour spaces
  thresholdHSV = sliderHSV.value()
  thresholdYCbCr = sliderYCbCr.value()
  const hsvV = extractHSVChannel(source, 'v')
  const ycbcrY = extractYCbCrChannel(source, 'y')
  drawCell(applyThreshold(hsvV, thresholdHSV), 0, 4, 'Thr HSV V')
  drawCell(applyThreshold(ycbcrY, thresholdYCbCr), 1, 4, 'Thr YCbCr Y')

  // Row 6: Face detection + replacement (face always from live video)
  drawFaceCell(video)

  // Row 7: Extension - Sobel Edge Detection
  sobelBuffer = applySobelEdgeDetection(source)
  drawCell(sobelBuffer, 0, 6, 'Sobel Edge')
}

function getSourceImage() {
  if (snapshotBuffer !== null) return snapshotBuffer
  return video
}

function getCellX(col) {
  return CELL_PADDING + col * (IMG_W + CELL_PADDING)
}
function getCellY(row) {
  return CELL_PADDING + row * (IMG_H + CELL_PADDING)
}

function drawCell(img, col, row, label) {
  const x = getCellX(col)
  const y = getCellY(row)
  if (img && img.width > 0) {
    image(img, x, y, IMG_W, IMG_H)
  }
  fill(255)
  noStroke()
  textSize(10)
  text(label, x, y - 2)
}

// ============ PROCESSING FUNCTIONS ============

/** Grayscale via luminosity + brightness -20%, manual pixel loop */
function applyGrayscaleBrightness(img) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const r = img.pixels[i]
      const g = img.pixels[i + 1]
      const b = img.pixels[i + 2]
      let gray = 0.299 * r + 0.587 * g + 0.114 * b
      gray = gray * 0.8 // -20% brightness
      gray = Math.max(0, Math.min(255, gray))
      out.pixels[i] = gray
      out.pixels[i + 1] = gray
      out.pixels[i + 2] = gray
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Extract single channel as grayscale image */
function extractChannel(img, ch) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  const idx = ch === 'r' ? 0 : ch === 'g' ? 1 : 2
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const v = img.pixels[i + idx]
      out.pixels[i] = v
      out.pixels[i + 1] = v
      out.pixels[i + 2] = v
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Threshold: pixel >= thresh ? 255 : 0 */
function applyThreshold(img, thresh) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const v = img.pixels[i] >= thresh ? 255 : 0
      out.pixels[i] = v
      out.pixels[i + 1] = v
      out.pixels[i + 2] = v
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Manual RGB to HSV conversion. Returns image with H,S,V mapped to RGB for display */
function rgbToHSV(img) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const r = img.pixels[i] / 255
      const g = img.pixels[i + 1] / 255
      const b = img.pixels[i + 2] / 255
      const M = Math.max(r, g, b)
      const m = Math.min(r, g, b)
      const C = M - m
      let H = 0,
        S = 0,
        V = M
      if (C !== 0) {
        if (M === r) H = ((g - b) / C) % 6
        else if (M === g) H = (b - r) / C + 2
        else H = (r - g) / C + 4
        if (H < 0) H += 6
        H *= 60 // 0-360
        S = V === 0 ? 0 : C / V
      }
      // Display: H→R (0-360→0-255), S→G, V→B
      out.pixels[i] = Math.min(255, (H / 360) * 255)
      out.pixels[i + 1] = Math.min(255, S * 255)
      out.pixels[i + 2] = Math.min(255, V * 255)
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Manual RGB to YCbCr (BT.601). Returns image with Y,Cb,Cr mapped to RGB */
function rgbToYCbCr(img) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const r = img.pixels[i]
      const g = img.pixels[i + 1]
      const b = img.pixels[i + 2]
      const Y = 16 + (65.481 * r + 128.553 * g + 24.966 * b) / 255
      const Cb = 128 + (-37.797 * r - 74.203 * g + 112.0 * b) / 255
      const Cr = 128 + (112.0 * r - 93.786 * g - 18.214 * b) / 255
      out.pixels[i] = Math.max(0, Math.min(255, Y))
      out.pixels[i + 1] = Math.max(0, Math.min(255, Cb))
      out.pixels[i + 2] = Math.max(0, Math.min(255, Cr))
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Extract HSV V channel (value) - 0-255 */
function extractHSVChannel(img, ch) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const r = img.pixels[i] / 255
      const g = img.pixels[i + 1] / 255
      const b = img.pixels[i + 2] / 255
      const M = Math.max(r, g, b)
      const m = Math.min(r, g, b)
      const C = M - m
      let H = 0,
        S = 0,
        V = M
      if (C !== 0) {
        if (M === r) H = ((g - b) / C) % 6
        else if (M === g) H = (b - r) / C + 2
        else H = (r - g) / C + 4
        if (H < 0) H += 6
        H *= 60
        S = V === 0 ? 0 : C / V
      }
      let v
      if (ch === 'v') v = V * 255
      else if (ch === 'h') v = (H / 360) * 255
      else v = S * 255
      out.pixels[i] =
        out.pixels[i + 1] =
        out.pixels[i + 2] =
          Math.min(255, Math.max(0, v))
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Extract YCbCr Y channel */
function extractYCbCrChannel(img, ch) {
  img.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const i = (y * IMG_W + x) * 4
      const r = img.pixels[i]
      const g = img.pixels[i + 1]
      const b = img.pixels[i + 2]
      const Y = 16 + (65.481 * r + 128.553 * g + 24.966 * b) / 255
      const Cb = 128 + (-37.797 * r - 74.203 * g + 112.0 * b) / 255
      const Cr = 128 + (112.0 * r - 93.786 * g - 18.214 * b) / 255
      let v = ch === 'y' ? Y : ch === 'cb' ? Cb : Cr
      v = Math.max(0, Math.min(255, v))
      out.pixels[i] = out.pixels[i + 1] = out.pixels[i + 2] = v
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

// ============ FACE DETECTION & REPLACEMENT ============

function drawFaceCell(source) {
  const x = getCellX(0)
  const y = getCellY(5)
  const w = IMG_W * 2 + CELL_PADDING
  const h = IMG_H

  if (facePredictions.length === 0) {
    fill(60)
    noStroke()
    rect(x, y, w, h)
    fill(150)
    text('No face detected', x + 10, y + h / 2)
    return
  }

  const bbox = getFaceBoundingBox(facePredictions[0])
  if (!bbox) return

  // Scale bbox from video coords (IMG_W x IMG_H) to source
  const sx = Math.max(0, Math.floor(bbox.x))
  const sy = Math.max(0, Math.floor(bbox.y))
  const sw = Math.min(IMG_W - sx, Math.ceil(bbox.w))
  const sh = Math.min(IMG_H - sy, Math.ceil(bbox.h))

  if (sw <= 0 || sh <= 0) return

  let faceImg = extractRegion(source, sx, sy, sw, sh)
  if (!faceImg) return

  if (faceFilterMode === FACE_FILTER_GRAYSCALE) {
    faceImg = applyGrayscaleBrightness(faceImg)
  } else if (faceFilterMode === FACE_FILTER_FLIP) {
    faceImg = applyHorizontalFlip(faceImg)
  } else if (faceFilterMode === FACE_FILTER_PIXELATE) {
    faceImg = applyPixelation(faceImg)
  }

  image(faceImg, x, y, sw, sh)
  fill(255)
  text('Face detected', x, y - 2)
}

function getFaceBoundingBox(prediction) {
  const mesh = prediction.scaledMesh
  if (!mesh || mesh.length === 0) return null
  let minX = Infinity,
    minY = Infinity
  let maxX = -Infinity,
    maxY = -Infinity
  for (let j = 0; j < mesh.length; j++) {
    const [px, py] = mesh[j]
    minX = Math.min(minX, px)
    minY = Math.min(minY, py)
    maxX = Math.max(maxX, px)
    maxY = Math.max(maxY, py)
  }
  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  }
}

function extractRegion(img, sx, sy, sw, sh) {
  img.loadPixels()
  const out = createImage(sw, sh)
  out.loadPixels()
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcX = sx + x
      const srcY = sy + y
      const srcI = (srcY * IMG_W + srcX) * 4
      const dstI = (y * sw + x) * 4
      out.pixels[dstI] = img.pixels[srcI]
      out.pixels[dstI + 1] = img.pixels[srcI + 1]
      out.pixels[dstI + 2] = img.pixels[srcI + 2]
      out.pixels[dstI + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Horizontal flip via nested loops - no scale/translate */
function applyHorizontalFlip(img) {
  img.loadPixels()
  const w = img.width
  const h = img.height
  const out = createImage(w, h)
  out.loadPixels()
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = w - 1 - x
      const srcI = (y * w + srcX) * 4
      const dstI = (y * w + x) * 4
      out.pixels[dstI] = img.pixels[srcI]
      out.pixels[dstI + 1] = img.pixels[srcI + 1]
      out.pixels[dstI + 2] = img.pixels[srcI + 2]
      out.pixels[dstI + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

/** Pixelation: 5x5 blocks, avg intensity, draw circle at center */
function applyPixelation(img) {
  const gray = applyGrayscaleBrightness(img)
  gray.loadPixels()
  const w = gray.width
  const h = gray.height
  const block = PIXELATE_BLOCK
  const pg = createGraphics(w, h)
  pg.background(0)
  pg.noStroke()
  for (let by = 0; by < h; by += block) {
    for (let bx = 0; bx < w; bx += block) {
      let sum = 0
      let count = 0
      for (let dy = 0; dy < block && by + dy < h; dy++) {
        for (let dx = 0; dx < block && bx + dx < w; dx++) {
          const idx = ((by + dy) * w + (bx + dx)) * 4
          sum += gray.pixels[idx]
          count++
        }
      }
      const avg = count > 0 ? sum / count : 0
      pg.fill(avg, avg, avg)
      pg.circle(bx + block / 2, by + block / 2, block)
    }
  }
  return pg.get()
}

// ============ EXTENSION: SOBEL EDGE DETECTION ============

function applySobelEdgeDetection(img) {
  const gray = applyGrayscaleBrightness(img)
  gray.loadPixels()
  const out = createImage(IMG_W, IMG_H)
  out.loadPixels()
  const w = IMG_W
  const h = IMG_H

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let gx = 0,
        gy = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx
          const ny = y + ky
          const nv =
            nx >= 0 && nx < w && ny >= 0 && ny < h
              ? gray.pixels[(ny * w + nx) * 4]
              : 0
          const ki = (ky + 1) * 3 + (kx + 1)
          gx += nv * SOBEL_GX[ki]
          gy += nv * SOBEL_GY[ki]
        }
      }
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy))
      const i = (y * w + x) * 4
      out.pixels[i] = mag
      out.pixels[i + 1] = mag
      out.pixels[i + 2] = mag
      out.pixels[i + 3] = 255
    }
  }
  out.updatePixels()
  return out
}

// ============ KEY HANDLER ============

function keyPressed() {
  if (key === 'S' || key === 's') {
    snapshotBuffer = createImage(IMG_W, IMG_H)
    snapshotBuffer.copy(video, 0, 0, IMG_W, IMG_H, 0, 0, IMG_W, IMG_H)
  }
  if (key === '1') faceFilterMode = FACE_FILTER_GRAYSCALE
  if (key === '2') faceFilterMode = FACE_FILTER_FLIP
  if (key === '3') faceFilterMode = FACE_FILTER_PIXELATE
  return false
}

/*
 * ============================================================================
 * COMMENTARY (500 words)
 * ============================================================================
 *
 * This application implements a comprehensive image processing pipeline for the
 * CM2030 Graphics Programming module, utilising p5.js and ml5.js exclusively.
 * All transformations are performed manually via nested loops and pixel array
 * manipulation, adhering strictly to the assignment constraints.
 *
 * APPLICATION WALKTHROUGH
 *
 * The application captures live video from the webcam and displays a structured
 * six-row grid of processed outputs. Row 1 shows the raw webcam feed and a
 * grayscale version with 20% reduced brightness. The grayscale conversion uses
 * the luminosity formula (0.299R + 0.587G + 0.114B), and brightness reduction
 * is applied in the same loop. Row 2 displays the red, green, and blue channels
 * independently. Row 3 provides thresholded versions of each channel, with
 * sliders (0–255) for real-time adjustment. Row 4 displays images in HSV and
 * YCbCr colour spaces, converted manually from RGB. Row 5 shows thresholded
 * outputs from the V channel of HSV and the Y channel of YCbCr. Row 6 combines
 * face detection (via ml5 FaceMesh) with face replacement filters triggered
 * by keys 1, 2, and 3. Pressing 'S' captures a snapshot resized to 160×120,
 * which becomes the source for all processing until another snapshot is taken.
 *
 * PROBLEMS AND SOLUTIONS
 *
 * Several challenges were encountered during development. First, the face
 * bounding box must be derived from the scaledMesh keypoints, as FaceMesh does
 * not provide a built-in bounding box. A min-max pass over all 468 keypoints
 * yields the required coordinates. Second, horizontal flip was implemented
 * manually using nested loops that copy pixels from mirrored x-coordinates,
 * avoiding scale() and translate() as prohibited. Third, pixelation required
 * splitting the face region into 5×5 blocks, computing mean intensity per block
 * via pixel array access, and drawing filled circles at block centres using
 * p5 circle(). The HSV conversion follows the standard hexcone model with
 * piecewise hue calculation; YCbCr uses the ITU-R BT.601 coefficients for
 * compatibility with common video standards.
 *
 * PROJECT GOALS
 *
 * All functional requirements have been achieved. The webcam, snapshot, grid
 * layout, grayscale with brightness reduction, RGB channel split, thresholding
 * with sliders, HSV and YCbCr colour space conversion, threshold from colour
 * spaces, face detection with bounding box extraction, and the three face
 * replacement filters (grayscale, horizontal flip, pixelation) are implemented
 * and operational. Code is modular with dedicated functions for each
 * transformation, and processing logic is separated from layout rendering.
 *
 * EXTENSION: SOBEL EDGE DETECTION
 *
 * The extension implements real-time Sobel edge detection on the webcam feed,
 * displayed in Row 7. The Sobel operator uses two 3×3 kernels (Gx and Gy) to
 * compute gradients in the horizontal and vertical directions. The image is
 * first converted to grayscale via the luminosity formula; then, for each
 * pixel, a convolution with the kernels yields gradient magnitudes combined
 * as G = sqrt(Gx² + Gy²). Edges correspond to high gradient magnitudes.
 * Border pixels use zero-padding to handle the kernel extent. This approach
 * is technically interesting because it demonstrates fundamental computer
 * vision concepts: spatial filtering via convolution, gradient-based edge
 * detection, and the separable nature of directional derivatives. Sobel is
 * widely used in preprocessing pipelines for object detection and feature
 * extraction, and implementing it manually reinforces understanding of how
 * such algorithms operate at the pixel level without relying on built-in
 * image processing functions.
 *
 * ============================================================================
 */
