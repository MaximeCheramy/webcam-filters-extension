import FaceTracking from './face-tracking'
import ScreenShare from './screen-share'

const filters = {
  faceTracking: new FaceTracking(),
  screenShare: new ScreenShare()
}

const activeFilter = filters.faceTracking

const intervalId = setInterval(() => {
  if (window.mediaStreamInstance?.video != null) {
    clearInterval(intervalId)
    window.mediaStreamInstance.video.onloadeddata = () => {
      activeFilter.start()
    }
  }
}, 500)

window.addEventListener('message', ({ data }) => {
  console.log(data)
})
