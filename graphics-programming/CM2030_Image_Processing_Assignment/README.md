# CM2030 – Image Processing Assignment

A webcam-based image processing app built with p5.js and ml5.js for the Graphics Programming module.

## Overview

The app captures a live webcam feed and displays a grid of processed versions of the image in real time. It covers grayscale conversion, channel extraction, thresholding, colour space conversion, face detection with filters, and edge detection. Everything runs in the browser with no server required.

## Features

- Live webcam capture
- Snapshot mode (press S to freeze the current frame)
- Grayscale with 20% brightness reduction (both in a single loop)
- RGB channel split (red, green, blue as separate greyscale images)
- Per-channel binary thresholding with adjustable sliders
- HSV and YCbCr colour space conversion
- Face detection using ml5 FaceMesh
- Face filters: grayscale, horizontal flip, pixelation (keys 1, 2, 3)
- Sobel edge detection (extension)

## How to Run

1. Open `index.html` in a browser (Chrome or Firefox recommended).
2. Allow webcam access when prompted.
3. Press **S** to take a snapshot. All rows will process the snapshot instead of the live feed.
4. Use the sliders on the right to adjust threshold values.
5. Press **1**, **2**, or **3** to apply a face filter. Press **0** to reset.

## Notes

All image processing is done manually using nested loops over pixel arrays. No p5.js built-in shortcuts like `filter()`, `scale()`, or `translate()` were used. The HSV conversion follows the hexcone model and YCbCr uses ITU-R BT.601 coefficients.

The extension adds real-time Sobel edge detection using two 3x3 convolution kernels with zero-padding at the borders.
