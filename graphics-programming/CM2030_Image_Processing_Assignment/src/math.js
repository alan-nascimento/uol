const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const clamp255 = (v) => clamp(v, 0, 255);

const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

/** RGB (0-255) to HSV. Returns { h: 0-360, s: 0-1, v: 0-1 }. */
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

/** RGB (0-255) to YCbCr using ITU-R BT.601. Returns { y, cb, cr }. */
const computeYCbCr = (r, g, b) => {
  const y = 16 + (65.481 * r + 128.553 * g + 24.966 * b) / 255;
  const cb = 128 + (-37.797 * r - 74.203 * g + 112.0 * b) / 255;
  const cr = 128 + (112.0 * r - 93.786 * g - 18.214 * b) / 255;
  return { y, cb, cr };
};

export { clamp, clamp255, computeHSV, computeYCbCr, SOBEL_X, SOBEL_Y };
