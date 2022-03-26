import browser from 'webextension-polyfill'

const script = document.createElement('script')
script.src = browser.runtime.getURL('build/main.js')
;(document.head || document.documentElement).appendChild(script)
