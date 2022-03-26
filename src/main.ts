import '@tensorflow/tfjs-backend-webgl'
import * as blazeface from '@tensorflow-models/blazeface'

const modelPromise = blazeface.load()
class MediaStreamWrapper {
  stream: MediaStream
  private context: CanvasRenderingContext2D
  private video: HTMLVideoElement
  private intervalId: number
  private canvas: HTMLCanvasElement
  private faceDetected: [number, number] | undefined

  constructor(originalStream: MediaStream) {
    this.video = document.createElement('video')
    this.video.srcObject = originalStream
    this.video.autoplay = true
    this.video.onloadeddata = () => {
      setInterval(async () => {
        const res = await (await modelPromise).estimateFaces(this.video)
        if (res.length > 0) {
          const bottomRight = res[0].bottomRight as [number, number]
          const topLeft = res[0].topLeft as [number, number]
          this.faceDetected = [
            (topLeft[0] + bottomRight[0]) / 2,
            (topLeft[1] + bottomRight[1]) / 2
          ]
        }
        console.log(res)
      }, 1000 / fps)
    }

    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')!

    const { width, height } = originalStream.getVideoTracks()[0].getSettings()
    this.canvas.width = width!
    this.canvas.height = height!

    this.video.width = width! * 1.4
    this.video.height = height! * 1.4

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
    if (this.context != null && this.video != null) {
      if (this.faceDetected != null) {
        const delta_x = this.canvas.width / 2 - this.faceDetected[0]
        const delta_y = this.canvas.height / 2 - this.faceDetected[1]

        this.context.drawImage(this.video, delta_x, delta_y, this.video.width, this.video.height)
      } else {
        const delta_x = this.canvas.width / 2 - this.video.width / 2
        const delta_y = this.canvas.height / 2 - this.video.height / 2

        this.context.drawImage(this.video, delta_x, delta_y, this.video.width, this.video.height)
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
  console.log('Enable Webcam Filters')
  const getUserMediaFn = MediaDevices.prototype.getUserMedia
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
