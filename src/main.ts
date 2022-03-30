import setupFaceTracking from './face-tracking'

const intervalId = setInterval(() => {
  if (window.mediaStreamInstance?.video != null) {
    clearInterval(intervalId)
    window.mediaStreamInstance.video.onloadeddata = () => {
      setupFaceTracking()
    }
  }
}, 500)
