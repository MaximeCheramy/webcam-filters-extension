import FaceTracking from './face-tracking'
import ScreenShare from './screen-share'

const filters = {
  faceTracking: new FaceTracking(),
  screenShare: new ScreenShare()
}

let activeFilter: FaceTracking | ScreenShare = filters.faceTracking

const intervalId = setInterval(() => {
  if (window.mediaStreamInstance?.video != null) {
    clearInterval(intervalId)
    window.mediaStreamInstance.video.onloadeddata = () => {
      activeFilter.start()
    }
  }
}, 500)

window.addEventListener(
  'message',
  ({
    data
  }: {
    data: {
      senderId: string,
      request: {
        type: 'update-settings'
        data: { filter: 'faceTracking' | 'screenShare' }
      }
    }
  }) => {
    if (data?.senderId === 'webcam-filter-inject-script') {
      console.log(data)
      if (data.request.type == 'update-settings') {
        activeFilter.stop()
        activeFilter = filters[data.request.data.filter]
        activeFilter.start()
      }
    }
  }
)
