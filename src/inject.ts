const script = document.createElement('script')
script.src = chrome.runtime.getURL('build/main.js')
;(document.head || document.documentElement).appendChild(script)
