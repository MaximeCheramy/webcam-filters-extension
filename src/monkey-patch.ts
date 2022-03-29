class MediaStreamWrapper {
  stream: MediaStream | undefined
  video: HTMLVideoElement
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  originalStream: MediaStream | undefined

  constructor() {
    this.video = document.createElement('video')
    this.video.autoplay = true
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')!
  }

  setOriginalStream(originalStream: MediaStream) {
    this.originalStream = originalStream
    this.video!.srcObject = originalStream

    const { width, height } = originalStream.getVideoTracks()[0].getSettings()
    this.canvas!.width = width!
    this.canvas!.height = height!

    const fps = 30
    this.stream = this.canvas.captureStream(fps)
    this.stream.addEventListener('inactive', () => {
      if (this.originalStream != null) {
        this.originalStream.getTracks().forEach((track) => track.stop())
      }
      if (this.canvas != null) {
        const { width, height } = this.canvas
        this.context!.clearRect(0, 0, width, height)
      }
      this.video!.srcObject = null
      this.originalStream = undefined
    })
  }
}

window.mediaStreamInstance = new MediaStreamWrapper()

function setup() {
  console.log('Enable Webcam Filters')

  const enumerateDevicesFn = MediaDevices.prototype.enumerateDevices
  MediaDevices.prototype.enumerateDevices = async () => {
    const currentDevices = await enumerateDevicesFn.call(navigator.mediaDevices)

    const virtualCurrentDevice = currentDevices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({
        deviceId: device.deviceId + '-virtual',
        groupId: device.groupId,
        kind: device.kind,
        label: device.label + ' (Virtual)'
      }))

    return [...currentDevices, ...virtualCurrentDevice] as MediaDeviceInfo[]
  }

  const getUserMediaFn = MediaDevices.prototype.getUserMedia
  MediaDevices.prototype.getUserMedia = async (constraints) => {
    try {
      if (
        constraints?.video instanceof Object &&
        constraints.video.deviceId?.exact != null &&
        constraints.video.deviceId.exact.endsWith('-virtual')
      ) {
        const mediaStream = await getUserMediaFn.call(navigator.mediaDevices, {
          ...constraints,
          video: {
            ...constraints.video,
            deviceId: {
              exact: constraints.video.deviceId.exact.replace(/-virtual$/, '')
            }
          }
        })
        window.mediaStreamInstance.setOriginalStream(mediaStream)
        return window.mediaStreamInstance.stream!
      } else {
        return await getUserMediaFn.call(navigator.mediaDevices, constraints)
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

setup()
