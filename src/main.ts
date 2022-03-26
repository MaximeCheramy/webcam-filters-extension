import '@tensorflow/tfjs-backend-webgl'
import * as blazeface from '@tensorflow-models/blazeface'

let modelPromise = blazeface.load()

function clamp(value: number, a: number, b: number): number {
  if (value < a) {
    return a
  }
  if (value > b) {
    return b
  }
  return value
}

class MediaStreamWrapper {
  stream: MediaStream
  private context: CanvasRenderingContext2D
  private video: HTMLVideoElement
  private intervalId: number
  private canvas: HTMLCanvasElement
  private faceDetected: [number, number] | undefined
  private currentDelta: [number, number] | undefined
  private lastStaticTime = new Date().getTime()

  constructor(originalStream: MediaStream) {
    const thresholdCamera = 2000
    this.video = document.createElement('video')
    this.video.srcObject = originalStream
    this.video.autoplay = true
    this.video.onloadeddata = () => {
      setInterval(async () => {
        const res = await (await modelPromise).estimateFaces(this.video)
        if (res.length > 0) {
          const bottomRight = res[0].bottomRight as [number, number]
          const topLeft = res[0].topLeft as [number, number]
          const faceDetected = [
            (topLeft[0] + bottomRight[0]) / 2,
            (topLeft[1] + bottomRight[1]) / 2
          ] as [number, number]

          const width = this.canvas.width
          const height = this.canvas.height
          if (
            this.faceDetected != null &&
            Math.abs(faceDetected[0] - this.faceDetected[0]) < width / 15 &&
            Math.abs(faceDetected[1] - this.faceDetected[1]) < height / 15
          ) {
            this.lastStaticTime = new Date().getTime()
          }

          if (this.lastStaticTime < new Date().getTime() - thresholdCamera) {
            this.lastStaticTime = new Date().getTime()
            this.faceDetected = faceDetected
          }
        }
      }, 500)
    }

    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')!

    const { width, height } = originalStream.getVideoTracks()[0].getSettings()
    this.canvas.width = width!
    this.canvas.height = height!

    const fps = 30
    this.stream = this.canvas.captureStream(fps)
    this.stream.addEventListener('inactive', () => {
      originalStream.getTracks().forEach((track) => track.stop())
      this.context!.clearRect(0, 0, width!, height!)
      this.video!.srcObject = null
    })

    this.intervalId = setInterval(() => {
      this.draw()
    }, 1000 / fps)
  }

  draw() {
    const zoom = 1.4
    if (this.context != null && this.video != null) {
      const width = this.canvas.width
      const height = this.canvas.height
      if (this.faceDetected != null) {
        let targetDelta: [number, number] = [
          (width * (1 - zoom)) / 2 + (width / 2 - this.faceDetected[0]) * zoom,
          (height * (1 - zoom)) / 2 + (height / 2 - this.faceDetected[1]) * zoom
        ]

        let delta: [number, number]
        if (this.currentDelta != null) {
          delta = [
            this.currentDelta[0] * 0.95 + targetDelta[0] * 0.05,
            this.currentDelta[1] * 0.95 + targetDelta[1] * 0.05
          ]
        } else {
          delta = targetDelta
        }
        this.currentDelta = delta

        delta[0] = clamp(delta[0], width * (1 - zoom), 0)
        delta[1] = clamp(delta[1], height * (1 - zoom), 0)

        this.context.drawImage(
          this.video,
          delta[0],
          delta[1],
          width * zoom,
          height * zoom
        )
      } else {
        this.context.drawImage(
          this.video,
          (width * (1 - zoom)) / 2,
          (height * (1 - zoom)) / 2,
          width * zoom,
          height * zoom
        )
      }
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
}

function setup() {
  if (MediaDevices.prototype.patched) return
  console.log('Enable Webcam Filters')

  const getUserMediaFn = MediaDevices.prototype.getUserMedia
  MediaDevices.prototype.patched = true
  MediaDevices.prototype.getUserMedia = async (constraints) => {
    try {
      const mediaStream = await getUserMediaFn.call(
        navigator.mediaDevices,
        constraints
      )

      if (constraints && constraints.video && !constraints.audio) {
        // only apply effects on video media streams
        return new MediaStreamWrapper(mediaStream).stream!
      }
      return mediaStream
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

setup()
setInterval(() => {
  setup()
}, 1000)
