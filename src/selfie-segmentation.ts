import '@tensorflow/tfjs-backend-webgl'
import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import '@tensorflow/tfjs-converter'
import { MediaPipeSelfieSegmentationModelConfig } from '@tensorflow-models/body-segmentation/dist/selfie_segmentation_mediapipe/types'

export default class SelfieSegmentation {
  private model:
    | bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation
    | undefined

  private fps: number
  private foregroundThreshold: number
  private backgroundBlur: number
  private edgeBlur: number

  private drawIntervalId: number | undefined
  private segmenter: bodySegmentation.BodySegmenter | undefined

  constructor({
    fps = 30,
    foregroundThreshold = 0.5,
    backgroundBlur = 3,
    edgeBlur = 3
  } = {}) {
    this.fps = fps
    this.foregroundThreshold = foregroundThreshold
    this.backgroundBlur = backgroundBlur
    this.edgeBlur = edgeBlur
  }

  async start() {
    if (this.model == null) {
      this.model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation
      const segmenterConfig: MediaPipeSelfieSegmentationModelConfig = {
        runtime: 'tfjs',
        modelType: 'general' // or 'landscape'
      }
      this.segmenter = await bodySegmentation.createSegmenter(
        this.model,
        segmenterConfig
      )
    }

    if (this.drawIntervalId != null) {
      clearInterval(this.drawIntervalId)
    }
    this.drawIntervalId = setInterval(() => this.draw(), 1000 / this.fps)
  }

  private async draw() {
    const msi = window.mediaStreamInstance

    if (msi?.originalStream == null) {
      return
    }

    const ENOUGH_DATA = 4
    if (window.mediaStreamInstance.video.readyState != ENOUGH_DATA) {
      return
    }
    const segmentation = await this.segmenter!.segmentPeople(
      window.mediaStreamInstance.video,
      {
        flipHorizontal: false,
        multiSegmentation: false,
        segmentBodyParts: true,
        segmentationThreshold: 0.5
      }
    )

    if (segmentation != null && segmentation.length > 0) {
      bodySegmentation.drawBokehEffect(
        msi.canvas,
        msi.video,
        segmentation,
        this.foregroundThreshold,
        this.backgroundBlur,
        this.edgeBlur
      )
    }
  }
}
