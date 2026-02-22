import {
  CANVAS_W,
  CANVAS_H,
  CELL_WIDTH,
  CELL_HEIGHT,
  FILTER_NONE,
  FILTER_GRAY,
  FILTER_FLIP,
  FILTER_PIXEL
} from '../config.js';
import { buildSliders, renderGrid } from '../ui/index.js';

const state = {
  video: null,
  snapshot: null,
  faceMeshModel: null,
  detectedFaces: [],
  faceFilter: FILTER_NONE,
  sliders: {}
};

const init = async () => {
  pixelDensity(1);
  createCanvas(CANVAS_W, CANVAS_H);

  state.video = createCapture(VIDEO);
  state.video.size(CELL_WIDTH, CELL_HEIGHT);
  state.video.hide();

  state.faceMeshModel = await ml5.faceMesh({ maxFaces: 1, flipped: false });
  state.faceMeshModel.detectStart(state.video, (results) => {
    state.detectedFaces = results;
  });

  state.sliders = buildSliders();
};

const render = () => {
  background(30);
  if (!state.video) return;

  if (!state.video.elt || state.video.elt.readyState < 2) {
    fill(200);
    textSize(14);
    textAlign(CENTER, CENTER);
    text('Waiting for camera...', CANVAS_W / 2, CANVAS_H / 2);
    textAlign(LEFT, BASELINE);
    return;
  }

  const source = state.snapshot ?? state.video;

  try {
    const ctx = {
      video: state.video,
      detectedFaces: state.detectedFaces,
      faceFilter: state.faceFilter,
      tR: state.sliders.R.value(),
      tG: state.sliders.G.value(),
      tB: state.sliders.B.value(),
      tV: state.sliders.V.value(),
      tY: state.sliders.Y.value()
    };
    renderGrid(source, ctx);
  } catch (err) {
    console.error('Draw error:', err);
  }
};

const handleKeyPress = (k) => {
  if (k === 'S' || k === 's') {
    state.snapshot = createImage(CELL_WIDTH, CELL_HEIGHT);
    state.snapshot.copy(
      state.video,
      0,
      0,
      state.video.width,
      state.video.height,
      0,
      0,
      CELL_WIDTH,
      CELL_HEIGHT
    );
  }
  if (k === '1') state.faceFilter = FILTER_GRAY;
  if (k === '2') state.faceFilter = FILTER_FLIP;
  if (k === '3') state.faceFilter = FILTER_PIXEL;
  if (k === '0') {
    state.faceFilter = FILTER_NONE;
    state.snapshot = null;
  }
  return false;
};

export { init, render, handleKeyPress };
