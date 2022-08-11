import React from 'react'
import { createRoot } from 'react-dom/client'
import browser from 'webextension-polyfill'

async function save() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  if (tabs[0].id != null) {
    browser.tabs.sendMessage(tabs[0].id, 'update-settings')
  }
}

function App() {
  return (
    <button id="save" onClick={save}>
      Save
    </button>
  )
}

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(<App />)
