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
