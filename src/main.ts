import FaceTracking from './face-tracking'

const faceTracking = new FaceTracking()

const intervalId = setInterval(() => {
  if (window.mediaStreamInstance?.video != null) {
    clearInterval(intervalId)
    window.mediaStreamInstance.video.onloadeddata = () => {
      faceTracking.start()
    }
  }
}, 500)
