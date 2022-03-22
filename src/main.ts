class MediaStreamWithEffect extends MediaStream {
  constructor(originalStream: MediaStream) {
    super(originalStream)

    const video = document.createElement('video')
    video.srcObject = originalStream
    video.autoplay = true

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!

    const { width, height } = originalStream.getVideoTracks()[0].getSettings()
    canvas.width = width!
    canvas.height = height!

    const fps = 30
    const stream = canvas.captureStream(fps)
    stream.addEventListener('inactive', () => {
      originalStream.getTracks().forEach((track) => track.stop())
      context.clearRect(0, 0, width!, height!)
      video.srcObject = null
    })

    setInterval(() => {
      context.drawImage(video, Math.random() * 10, Math.random() * 10)
    }, 1000 / fps)

    return stream
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
        return new MediaStreamWithEffect(mediaStream)
      }
      return mediaStream
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

setup()
