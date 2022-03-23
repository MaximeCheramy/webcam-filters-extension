class MediaStreamWrapper {
  stream: MediaStream
  private context: CanvasRenderingContext2D
  private video: HTMLVideoElement
  private intervalId: number
  private canvas: HTMLCanvasElement
  
  constructor(originalStream: MediaStream) {
    this.video = document.createElement('video')
    this.video.srcObject = originalStream
    this.video.autoplay = true

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

  draw () {
    if (this.context != null && this.video != null) {
      this.context.drawImage(this.video, Math.random() * 10, Math.random() * 10)
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
