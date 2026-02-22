/**
 * CM2030 – Graphics Programming – Image Processing Assignment
 * Full implementation using p5.js (v2.2.1) and ml5.js only.
 * All processing via pixel arrays; no filter(), scale(), or translate() shortcuts.
 */

/*
 * ============================================================================
 * COMMENTARY
 * ============================================================================
 *
 * This is a real-time image processing app built for the CM2030 Graphics
 * Programming module. It uses p5.js for rendering and ml5.js for face
 * detection. All image transformations are done manually through pixel-array
 * loops — no filter(), scale(), or translate() shortcuts.
 *
 * APPLICATION WALKTHROUGH
 *
 * When the app starts it opens the webcam and shows a six-row grid of 160x120
 * cells. The first row has the live feed next to a grayscale version with
 * brightness reduced by 20%. Both the grayscale conversion (using the
 * luminosity formula 0.299R + 0.587G + 0.114B) and the brightness reduction
 * happen in the same loop, so each pixel is only visited once.
 *
 * Row two splits the image into its red, green, and blue channels. Row three
 * applies binary thresholding to each channel, controlled by sliders that
 * update in real time. Row four shows the original alongside HSV and YCbCr
 * colour-space conversions, both computed with manual formulas.
 *
 * Row five handles face detection using ml5 FaceMesh. It shows the detected
 * face region, and pressing 1, 2, or 3 swaps the face with a grayscale,
 * flipped, or pixelated version. Pressing S takes a snapshot that replaces
 * the live feed as the source for all processing rows.
 *
 * PROBLEMS AND SOLUTIONS
 *
 * The trickiest issue early on was pixel-density scaling. On Retina screens
 * p5.js doubles the pixel-array dimensions, which broke all my manual loops.
 * Calling pixelDensity(1) in setup fixed it straight away.
 *
 * For face detection I needed the ml5 v1 API, which gives a bounding box
 * object rather than the older scaledMesh array. Getting the face overlay to
 * line up correctly meant clamping the bounding box to the source dimensions
 * and scaling it to cell space.
 *
 * Horizontal flipping reads each row from right to left in a nested loop,
 * which avoids the prohibited scale and translate calls. Pixelation first
 * converts the face to grayscale, splits it into 5x5 blocks, averages the
 * intensity of each block, and draws a filled circle at the block centre.
 * The HSV conversion uses the hexcone model and YCbCr follows the ITU-R
 * BT.601 standard.
 *
 * PROJECT GOALS
 *
 * All the required features are working. The code is split into modules with
 * separate files for math utilities, pixel processing, face handling, and UI
 * rendering. Shared helpers for HSV and YCbCr avoid duplicated logic.
 *
 * EXTENSION — SOBEL EDGE DETECTION
 *
 * For the extension I added real-time Sobel edge detection in row six. It
 * works by running two 3x3 kernels over the grayscale image to estimate
 * horizontal and vertical gradients, then combining them as
 * sqrt(Gx^2 + Gy^2). The output highlights edges — basically the outlines
 * of objects in the scene. I chose this because kernel convolution is a core
 * technique in computer vision, used in things like feature extraction and
 * object recognition.
 *
 * ============================================================================
 */

import { init, render, handleKeyPress } from './app/App.js';

window.setup = async function () {
  await init();
};

window.draw = function () {
  render();
};

window.keyPressed = function () {
  return handleKeyPress(key);
};
