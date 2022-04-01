import FaceTracking from './face-tracking'
import ScreenShare from './screen-share'
import SelfieSegmentation from './selfie-segmentation'

const filters = {
  faceTracking: new FaceTracking(),
  screenShare: new ScreenShare(),
  selfieSegmentation: new SelfieSegmentation()
}

const activeFilter = filters.selfieSegmentation

const intervalId = setInterval(() => {
  if (window.mediaStreamInstance?.video != null) {
    clearInterval(intervalId)
    window.mediaStreamInstance.video.onloadeddata = () => {
      activeFilter.start()
    }
  }
}, 500)
