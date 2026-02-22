import { PIXELATE_BLOCK, FILTER_GRAY, FILTER_FLIP, FILTER_PIXEL } from '../config.js';
import { toGrayscale } from '../processing/index.js';

/** Copy a rectangular region out of an image via pixel arrays. */
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

/** Flip horizontally by reading each row right-to-left. No scale()/translate(). */
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
 * Pixelation: grayscale the face, split into 5x5 blocks,
 * average each block's intensity, draw a circle at the centre.
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

/**
 * Get the processed face region, or null if no face found.
 * Returns { img, x, y, w, h } so the caller knows where to draw it.
 */
const getProcessedFace = (source, detectedFaces, filter) => {
  if (detectedFaces.length === 0) return null;

  const { box: bbox } = detectedFaces[0];
  if (!bbox) return null;

  // Clamp bounding box so it doesn't go outside the source image
  const bx = Math.max(0, Math.floor(bbox.xMin));
  const by = Math.max(0, Math.floor(bbox.yMin));
  const bw = Math.min(source.width - bx, Math.ceil(bbox.width));
  const bh = Math.min(source.height - by, Math.ceil(bbox.height));
  if (bw <= 0 || bh <= 0) return null;

  let faceImg = extractRegion(source, bx, by, bw, bh);
  if (!faceImg) return null;

  if (filter === FILTER_GRAY) {
    faceImg = toGrayscale(faceImg);
  } else if (filter === FILTER_FLIP) {
    faceImg = applyHorizontalFlip(faceImg);
  } else if (filter === FILTER_PIXEL) {
    faceImg = applyPixelation(faceImg);
  }

  return { img: faceImg, x: bx, y: by, w: bw, h: bh };
};

export { extractRegion, applyHorizontalFlip, applyPixelation, getProcessedFace };
