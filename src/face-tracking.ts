import '@tensorflow/tfjs-backend-webgl'
import * as blazeface from '@tensorflow-models/blazeface'
import { clamp } from './tools'

let model: blazeface.BlazeFaceModel | undefined

let faceDetected: { x: number; y: number } | undefined
let currentDelta: { x: number; y: number } | undefined
let lastStaticTime = new Date().getTime()
const thresholdCamera = 2000
const zoom = 1.4
const fps = 30
const thresholdProbability = 0.95
const targetSizeRatio = 1 / 15

let faceDetectionIntervalId: number | undefined
let drawIntervalId: number | undefined

export default async function setup() {
  if (model == null) {
    model = await blazeface.load()
  }

  if (faceDetectionIntervalId != null) {
    clearInterval(faceDetectionIntervalId)
  }
  faceDetectionIntervalId = setInterval(faceDetect, 500)

  if (drawIntervalId != null) {
    clearInterval(drawIntervalId)
  }
  drawIntervalId = setInterval(draw, 1000 / fps)
}

async function faceDetect() {
  const ENOUGH_DATA = 4
  if (window.mediaStreamInstance.video.readyState != ENOUGH_DATA) {
    return
  }
  const res = (await model!.estimateFaces(window.mediaStreamInstance.video))
    .filter((res) => res.probability! > thresholdProbability)
    .sort((a, b) => (b.probability! as number) - (a.probability! as number))
  if (res.length > 0) {
    const bottomRight = res[0].bottomRight as [number, number]
    const topLeft = res[0].topLeft as [number, number]
    const nFaceDetected = {
      x: (topLeft[0] + bottomRight[0]) / 2,
      y: (topLeft[1] + bottomRight[1]) / 2
    }

    const { width, height } = window.mediaStreamInstance.canvas
    const now = new Date().getTime()
    if (
      faceDetected != null &&
      Math.abs(faceDetected.x - nFaceDetected.x) < width * targetSizeRatio &&
      Math.abs(faceDetected.y - nFaceDetected.y) < height * targetSizeRatio
    ) {
      lastStaticTime = now
    }

    if (lastStaticTime < now - thresholdCamera) {
      lastStaticTime = now
      faceDetected = nFaceDetected
    }
  }
}

function draw() {
  const msi = window.mediaStreamInstance

  if (msi?.originalStream == null) {
    return
  }

  const { width, height } = msi.canvas

  if (faceDetected == null) {
    faceDetected = { x: width / 2, y: height / 2 }
  }

  const targetDelta = {
    x: (width * (1 - zoom)) / 2 + (width / 2 - faceDetected.x) * zoom,
    y: (height * (1 - zoom)) / 2 + (height / 2 - faceDetected.y) * zoom
  }

  let delta: { x: number; y: number }
  if (currentDelta != null) {
    delta = {
      x: currentDelta.x * 0.95 + targetDelta.x * 0.05,
      y: currentDelta.y * 0.95 + targetDelta.y * 0.05
    }
  } else {
    delta = targetDelta
  }
  currentDelta = delta

  delta.x = clamp(delta.x, width * (1 - zoom), 0)
  delta.y = clamp(delta.y, height * (1 - zoom), 0)

  msi.context.drawImage(
    msi.video,
    delta.x,
    delta.y,
    width * zoom,
    height * zoom
  )
}