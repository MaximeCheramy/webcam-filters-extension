import '@tensorflow/tfjs-backend-webgl'
import * as blazeface from '@tensorflow-models/blazeface'
import { clamp } from './tools'

export default class FaceTracking {
  private model: blazeface.BlazeFaceModel | undefined

  private faceDetected: { x: number; y: number } | undefined
  private currentDelta: { x: number; y: number } | undefined
  private lastStaticTime = new Date().getTime()
  private thresholdCamera: number
  private zoom: number
  private fps: number
  private thresholdProbability: number
  private targetSizeRatio: number

  private faceDetectionIntervalId: number | undefined
  private drawIntervalId: number | undefined

  constructor({
    zoom = 1.4,
    fps = 30,
    thresholdProbability = 0.95,
    targetSizeRatio = 1 / 15,
    thresholdCamera = 2000
  } = {}) {
    this.zoom = zoom
    this.fps = fps
    this.thresholdCamera = thresholdCamera
    this.thresholdProbability = thresholdProbability
    this.targetSizeRatio = targetSizeRatio
  }

  async start() {
    if (this.model == null) {
      this.model = await blazeface.load()
    }

    if (this.faceDetectionIntervalId != null) {
      clearInterval(this.faceDetectionIntervalId)
    }
    this.faceDetectionIntervalId = setInterval(() => this.faceDetect(), 500)

    if (this.drawIntervalId != null) {
      clearInterval(this.drawIntervalId)
    }
    this.drawIntervalId = setInterval(() => this.draw(), 1000 / this.fps)
  }

  private async faceDetect() {
    const ENOUGH_DATA = 4
    if (window.mediaStreamInstance.video.readyState != ENOUGH_DATA) {
      return
    }
    const res = (
      await this.model!.estimateFaces(window.mediaStreamInstance.video)
    )
      .filter((res) => res.probability! > this.thresholdProbability)
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
        this.faceDetected != null &&
        Math.abs(this.faceDetected.x - nFaceDetected.x) <
          width * this.targetSizeRatio &&
        Math.abs(this.faceDetected.y - nFaceDetected.y) <
          height * this.targetSizeRatio
      ) {
        this.lastStaticTime = now
      }

      if (this.lastStaticTime < now - this.thresholdCamera) {
        this.lastStaticTime = now
        this.faceDetected = nFaceDetected
      }
    }
  }

  private draw() {
    const msi = window.mediaStreamInstance

    if (msi?.originalStream == null) {
      return
    }

    const { width, height } = msi.canvas

    if (this.faceDetected == null) {
      this.faceDetected = { x: width / 2, y: height / 2 }
    }

    const targetDelta = {
      x:
        (width * (1 - this.zoom)) / 2 +
        (width / 2 - this.faceDetected.x) * this.zoom,
      y:
        (height * (1 - this.zoom)) / 2 +
        (height / 2 - this.faceDetected.y) * this.zoom
    }

    let delta: { x: number; y: number }
    if (this.currentDelta != null) {
      delta = {
        x: this.currentDelta.x * 0.95 + targetDelta.x * 0.05,
        y: this.currentDelta.y * 0.95 + targetDelta.y * 0.05
      }
    } else {
      delta = targetDelta
    }
    this.currentDelta = delta

    delta.x = clamp(delta.x, width * (1 - this.zoom), 0)
    delta.y = clamp(delta.y, height * (1 - this.zoom), 0)

    msi.context.drawImage(
      msi.video,
      delta.x,
      delta.y,
      width * this.zoom,
      height * this.zoom
    )
  }
}
