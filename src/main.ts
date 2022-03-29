import '@tensorflow/tfjs-backend-webgl'
import * as blazeface from '@tensorflow-models/blazeface'
import { clamp } from './tools'

let modelPromise = blazeface.load()

let faceDetected: [number, number] | undefined
let currentDelta: [number, number] | undefined
let lastStaticTime = new Date().getTime()
const thresholdCamera = 2000

let faceDetectionIntervalId: number | undefined

const intervalId = setInterval(() => {
  if (window.mediaStreamInstance?.video != null) {
    clearInterval(intervalId)
    window.mediaStreamInstance.video.onloadeddata = () => {
      if (faceDetectionIntervalId != null) {
        clearInterval(faceDetectionIntervalId)
      }
      faceDetectionIntervalId = setInterval(async () => {
        const ENOUGH_DATA = 4
        if (window.mediaStreamInstance.video.readyState != ENOUGH_DATA) {
          return
        }
        const res = await (
          await modelPromise
        ).estimateFaces(window.mediaStreamInstance.video)
        if (res.length > 0) {
          const bottomRight = res[0].bottomRight as [number, number]
          const topLeft = res[0].topLeft as [number, number]
          const nFaceDetected = [
            (topLeft[0] + bottomRight[0]) / 2,
            (topLeft[1] + bottomRight[1]) / 2
          ] as [number, number]

          const { width, height } = window.mediaStreamInstance.canvas
          if (
            faceDetected != null &&
            Math.abs(faceDetected[0] - nFaceDetected[0]) < width / 15 &&
            Math.abs(faceDetected[1] - nFaceDetected[1]) < height / 15
          ) {
            lastStaticTime = new Date().getTime()
          }

          if (lastStaticTime < new Date().getTime() - thresholdCamera) {
            lastStaticTime = new Date().getTime()
            faceDetected = nFaceDetected
          }
        }
      }, 500)
    }
  }
}, 500)

function draw() {
  const msi = window.mediaStreamInstance

  if (msi?.originalStream == null) {
    return
  }
  const zoom = 1.4

  const width = msi.canvas.width
  const height = msi.canvas.height
  if (faceDetected != null) {
    let targetDelta: [number, number] = [
      (width * (1 - zoom)) / 2 + (width / 2 - faceDetected[0]) * zoom,
      (height * (1 - zoom)) / 2 + (height / 2 - faceDetected[1]) * zoom
    ]

    let delta: [number, number]
    if (currentDelta != null) {
      delta = [
        currentDelta[0] * 0.95 + targetDelta[0] * 0.05,
        currentDelta[1] * 0.95 + targetDelta[1] * 0.05
      ]
    } else {
      delta = targetDelta
    }
    currentDelta = delta

    delta[0] = clamp(delta[0], width * (1 - zoom), 0)
    delta[1] = clamp(delta[1], height * (1 - zoom), 0)

    msi.context.drawImage(
      msi.video,
      delta[0],
      delta[1],
      width * zoom,
      height * zoom
    )
  } else {
    msi.context.drawImage(
      msi.video,
      (width * (1 - zoom)) / 2,
      (height * (1 - zoom)) / 2,
      width * zoom,
      height * zoom
    )
  }
}

setInterval(() => {
  draw()
}, 1000 / 30)
