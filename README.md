# Webcam Filters Browser Extension

Apply effects on your webcam during video meetings (e.g. using Google Meet).

## Installation

This extension will eventually be available on the Chrome Web Store and Firefox Add-ons. Until then, you can install it from the sources.

Run `npm run build` to build this extension.

To load the extension in Chrome, go to chrome://extensions/ and click on the "Load unpacked" button.

## How it works

This extension is split in 4 parts:
- The "main" script that applies the effects
- The "monkey patch" script that overrides the browser functions `MediaDevices.enumerateDevices` and `MediaDevices.getUserMedia`
- The "inject" script that executes 2 scripts above in the website context
- The "popup" page that is the menu that opens when you click on the extension's icon. Used to switch between filters.

### Monkey Patching

The function `MediaDevices.prototype.enumerateDevices` returns the list of all the media devices.
We override this method to add new "Virtual" devices. This way, the user will be able to select between its webcam and the same video input with an effect applied on it.

The function `MediaDevices.prototype.getUserMedia` returns a `MediaStream`. If the requested device ends with '-virtual', we return a custom stream.

We store in `window.mediaStreamInstance` the reference to an object containing the canvas used to create the stream, as well as the original stream.

### The effects

There are currently 2 effects available, but it's easy to add new ones.

#### Screen Share

This is the simplest filter:

Create a video element and set srcObject to a display media (which is a screen you share).

Call periodically a method `draw` to write in the canvas of the virtual webcam the video, and the video of the original stream.

#### Face Tracking

Face Tracking is implemented using tensorflow.js.

Periodically we run the function `faceDetect` that uses TF to detect the face positions. We take the one with the highest probability.

Periodically we draw in the virtual webcam the original video zoomed on the detected face.

In order to avoid that the camera follows the person all the time, we added thresholds so that the camera refocuses only when the difference becomes significant. The transition is also made in a smoother way to be more natural.

### Injection

The execution environments of content scripts and the pages that host them are isolated from each other (https://developer.chrome.com/docs/extensions/mv3/content_scripts/#isolated_world).

However, we need to monkey patch the page. The solution is to inject in the DOM the scripts programmatically.

Beware that if the page has some strict Content Security Policy, you won't be able to use things that are not embedded inside the extension (e.g. downloading some assets).

The script `inject.ts` also transfer messages from the popup to the injected scripts.

### The popup page

This is a simple react page that allows to select the filter to apply. This works by sending a message to the active tab. That message is received by the inject script and forwarded to the page. The main script will proceed that message.