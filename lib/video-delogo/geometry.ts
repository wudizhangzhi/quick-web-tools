// Pure coordinate helpers shared by the video crop UI.
// The overlay that captures pointer events sits exactly on top of the
// displayed video. We map between three spaces:
//   - pointer/client space (clientX/clientY, viewport pixels)
//   - the overlay's box (rect: left/top/width/height in viewport pixels)
//   - real video-pixel space (videoW × videoH, what ffmpeg needs)
//
// X and Y must be scaled INDEPENDENTLY: the overlay box aspect ratio is not
// guaranteed to equal the video's intrinsic aspect ratio, so a single
// width-derived scale corrupts the Y axis.

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export function pointerToReal(
  clientX: number,
  clientY: number,
  rect: Rect,
  videoW: number,
  videoH: number,
): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 }
  return {
    x: ((clientX - rect.left) / rect.width) * videoW,
    y: ((clientY - rect.top) / rect.height) * videoH,
  }
}

// Percentage placement of a value within the displayed box, for CSS top/left/
// width/height. Rendering with these percentages is the exact inverse of
// pointerToReal, regardless of the box's aspect ratio.
export function toPercent(value: number, total: number): number {
  if (total <= 0) return 0
  return (value / total) * 100
}
