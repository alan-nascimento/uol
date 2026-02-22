import {
  CELL_WIDTH,
  CELL_HEIGHT,
  PADDING,
  LABEL_HEIGHT,
  START_X,
  START_Y,
  CANVAS_W
} from './config.js';
import {
  applyGrayscaleBrightness,
  extractChannel,
  applyThreshold,
  convertToHSVImage,
  convertToYCbCrImage,
  extractHSV_V,
  extractYCbCr_Y,
  applySobelEdgeDetection
} from './processing.js';
import { getProcessedFace } from './FaceProcessor.js';

const GRID_CONFIG = [
  [
    { label: 'Original', fn: (src) => src },
    { label: 'Grayscale -20%', fn: applyGrayscaleBrightness }
  ],
  [
    { label: 'Red Channel', fn: (src) => extractChannel(src, 0) },
    { label: 'Green Channel', fn: (src) => extractChannel(src, 1) },
    { label: 'Blue Channel', fn: (src) => extractChannel(src, 2) }
  ],
  [
    {
      label: (ctx) => `Thresh R=${ctx.tR}`,
      fn: (src, ctx) => applyThreshold(extractChannel(src, 0), ctx.tR)
    },
    {
      label: (ctx) => `Thresh G=${ctx.tG}`,
      fn: (src, ctx) => applyThreshold(extractChannel(src, 1), ctx.tG)
    },
    {
      label: (ctx) => `Thresh B=${ctx.tB}`,
      fn: (src, ctx) => applyThreshold(extractChannel(src, 2), ctx.tB)
    }
  ],
  [
    { label: 'Original (repeat)', fn: (src) => src },
    { label: 'HSV', fn: convertToHSVImage },
    { label: 'YCbCr', fn: convertToYCbCrImage }
  ],
  [
    { type: 'face' },
    {
      label: (ctx) => `Thresh HSV V=${ctx.tV}`,
      fn: (src, ctx) => applyThreshold(extractHSV_V(src), ctx.tV)
    },
    {
      label: (ctx) => `Thresh YCbCr Y=${ctx.tY}`,
      fn: (src, ctx) => applyThreshold(extractYCbCr_Y(src), ctx.tY)
    }
  ],
  [{ label: 'Sobel Edges', fn: applySobelEdgeDetection }]
];

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

/** Build the threshold sliders and controls legend next to the grid. */
const buildSliders = () => {
  const sx = CANVAS_W + 30;
  const sy = START_Y + 10;

  const container = createDiv('');
  container.position(sx, sy);
  container.style('color', '#ccc');
  container.style('font-family', 'Arial, sans-serif');
  container.style('font-size', '11px');
  container.style('line-height', '1.6');

  const title1 = createDiv('RGB Thresholds');
  title1.parent(container);
  title1.style('color', '#fff');
  title1.style('font-weight', 'bold');
  title1.style('margin-bottom', '6px');

  const R = labelledSlider(container, 'Red');
  const G = labelledSlider(container, 'Green');
  const B = labelledSlider(container, 'Blue');

  const spacer1 = createDiv('');
  spacer1.parent(container);
  spacer1.style('height', '16px');

  const title2 = createDiv('Colour Space Thresholds');
  title2.parent(container);
  title2.style('color', '#fff');
  title2.style('font-weight', 'bold');
  title2.style('margin-bottom', '6px');

  const V = labelledSlider(container, 'HSV V');
  const Y = labelledSlider(container, 'YCbCr Y');

  const spacer2 = createDiv('');
  spacer2.parent(container);
  spacer2.style('height', '16px');

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

  return { R, G, B, V, Y };
};

const drawCell = (img, row, col, label) => {
  const x = START_X + col * (CELL_WIDTH + PADDING);
  const y = START_Y + row * (CELL_HEIGHT + PADDING + LABEL_HEIGHT);

  fill(210);
  noStroke();
  textSize(10);
  textAlign(LEFT, BOTTOM);
  text(label, x, y + LABEL_HEIGHT - 2);

  stroke(55);
  strokeWeight(1);
  noFill();
  rect(x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

  if (img) {
    noStroke();
    image(img, x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
  }
};

/** Draw the face cell: full frame as background, then overlay the processed face. */
const drawFaceCell = (source, row, col, ctx) => {
  const filterNames = ['Original', 'Grayscale', 'Flipped', 'Pixelated'];
  const label = `Face — ${filterNames[ctx.faceFilter]}`;

  const x = START_X + col * (CELL_WIDTH + PADDING);
  const y = START_Y + row * (CELL_HEIGHT + PADDING + LABEL_HEIGHT);

  fill(210);
  noStroke();
  textSize(10);
  textAlign(LEFT, BOTTOM);
  text(label, x, y + LABEL_HEIGHT - 2);

  stroke(55);
  strokeWeight(1);
  noFill();
  rect(x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

  noStroke();
  image(source, x, y + LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

  const result = getProcessedFace(source, ctx.detectedFaces, ctx.faceFilter);
  if (!result) return;

  // Scale bounding box from source space to cell space
  const scaleX = CELL_WIDTH / source.width;
  const scaleY = CELL_HEIGHT / source.height;
  const dx = x + result.x * scaleX;
  const dy = y + LABEL_HEIGHT + result.y * scaleY;
  const dw = result.w * scaleX;
  const dh = result.h * scaleY;

  noStroke();
  image(result.img, dx, dy, dw, dh);
};

const renderGrid = (source, ctx) => {
  GRID_CONFIG.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.type === 'face') {
        drawFaceCell(ctx.video, rowIdx, colIdx, ctx);
      } else {
        const label = typeof cell.label === 'function' ? cell.label(ctx) : cell.label;
        const img = cell.fn(source, ctx);
        drawCell(img, rowIdx, colIdx, label);
      }
    });
  });
};

export { GRID_CONFIG, buildSliders, labelledSlider, drawCell, renderGrid };
