export default class ScreenShare {
  private fps: number
  private drawIntervalId: number | undefined
  private video: HTMLVideoElement | undefined

  constructor({ fps = 30 } = {}) {
    this.fps = fps
  }

  async start() {
    const displayMedia = await navigator.mediaDevices.getDisplayMedia()
    this.video = document.createElement('video')
    this.video.autoplay = true
    this.video.srcObject = displayMedia

    if (this.drawIntervalId != null) {
      clearInterval(this.drawIntervalId)
    }
    this.drawIntervalId = setInterval(() => this.draw(), 1000 / this.fps)

    const { width, height } = displayMedia.getVideoTracks()[0].getSettings()
    const msi = window.mediaStreamInstance
    msi.canvas.width = width!
    msi.canvas.height = height!
  }

  async stop() {
    if (this.drawIntervalId != null) {
      clearInterval(this.drawIntervalId)
      this.drawIntervalId = undefined
    }
  }

  private async draw() {
    const msi = window.mediaStreamInstance

    if (msi?.originalStream == null || this.video == null) {
      return
    }

    const { width, height } = msi.canvas

    msi.context.drawImage(this.video, 0, 0)
    msi.context.drawImage(
      msi.video,
      (4 * width) / 5,
      (4 * height) / 5,
      width / 5,
      height / 5
    )
  }
}
