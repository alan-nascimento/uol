import { clamp255, computeHSV, computeYCbCr, SOBEL_X, SOBEL_Y } from '../core/math.js';
import { BRIGHTNESS_FACTOR } from '../config.js';

/** Loop over every pixel, run fn(i, srcPixels, dstPixels), return a new image. */
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

const setGray = (pixels, i, v) => {
  pixels[i] = v;
  pixels[i + 1] = v;
  pixels[i + 2] = v;
  pixels[i + 3] = 255;
};

/** Grayscale only (no brightness change). Used by Sobel and face filters. */
const toGrayscale = (img) =>
  processPixels(img, (i, src, dst) => {
    const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    setGray(dst, i, gray);
  });

/**
 * Grayscale + 20% brightness reduction in the SAME loop.
 * Assignment requires both operations in one pass.
 */
const applyGrayscaleBrightness = (img) =>
  processPixels(img, (i, src, dst) => {
    const gray = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) * BRIGHTNESS_FACTOR;
    setGray(dst, i, clamp255(gray));
  });

/** Extract one RGB channel as grayscale. ch: 0=R, 1=G, 2=B. */
const extractChannel = (img, ch) =>
  processPixels(img, (i, src, dst) => {
    setGray(dst, i, src[i + ch]);
  });

/** Binary threshold: >= thresh becomes white, otherwise black. */
const applyThreshold = (img, thresh) =>
  processPixels(img, (i, src, dst) => {
    setGray(dst, i, src[i] >= thresh ? 255 : 0);
  });

/** HSV visualisation: H->R, S->G, V->B (all scaled to 0-255). */
const convertToHSVImage = (img) =>
  processPixels(img, (i, src, dst) => {
    const { h, s, v } = computeHSV(src[i], src[i + 1], src[i + 2]);
    dst[i] = (h / 360) * 255;
    dst[i + 1] = s * 255;
    dst[i + 2] = v * 255;
    dst[i + 3] = 255;
  });

/** YCbCr visualisation: Y->R, Cb->G, Cr->B. */
const convertToYCbCrImage = (img) =>
  processPixels(img, (i, src, dst) => {
    const { y, cb, cr } = computeYCbCr(src[i], src[i + 1], src[i + 2]);
    dst[i] = clamp255(y);
    dst[i + 1] = clamp255(cb);
    dst[i + 2] = clamp255(cr);
    dst[i + 3] = 255;
  });

const extractHSV_V = (img) =>
  processPixels(img, (i, src, dst) => {
    const { v } = computeHSV(src[i], src[i + 1], src[i + 2]);
    setGray(dst, i, clamp255(v * 255));
  });

const extractYCbCr_Y = (img) =>
  processPixels(img, (i, src, dst) => {
    const { y } = computeYCbCr(src[i], src[i + 1], src[i + 2]);
    setGray(dst, i, clamp255(y));
  });

/**
 * Sobel edge detection (extension).
 * Convolves grayscale with Gx/Gy kernels, magnitude = sqrt(Gx^2 + Gy^2).
 * Out-of-bounds pixels treated as 0 (zero-padding).
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
          const nv = nx >= 0 && nx < w && ny >= 0 && ny < h ? gray.pixels[(ny * w + nx) * 4] : 0;
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

export {
  processPixels,
  toGrayscale,
  applyGrayscaleBrightness,
  extractChannel,
  applyThreshold,
  convertToHSVImage,
  convertToYCbCrImage,
  extractHSV_V,
  extractYCbCr_Y,
  applySobelEdgeDetection
};
