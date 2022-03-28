import browser from 'webextension-polyfill'

const scriptMP = document.createElement('script')
scriptMP.src = browser.runtime.getURL('build/monkey-patch.js')
;(document.head || document.documentElement).appendChild(scriptMP)

const scriptMain = document.createElement('script')
scriptMain.src = browser.runtime.getURL('build/main.js')
;(document.head || document.documentElement).appendChild(scriptMain)
