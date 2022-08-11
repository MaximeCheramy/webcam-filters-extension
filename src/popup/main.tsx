import React from 'react'
import { createRoot } from 'react-dom/client'
import { useForm } from 'react-hook-form'
import browser from 'webextension-polyfill'

type FormData = {
  filter: 'faceTracking' | 'screenShare'
}

async function onSubmit(data : FormData) {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  if (tabs[0].id != null) {
    browser.tabs.sendMessage(tabs[0].id, {
      type: 'update-settings',
      data
    })
  }
}

function App() {
  const { handleSubmit, register } = useForm<FormData>()
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Filter
        <select {...register('filter')}>
          <option value="faceTracking">Face Tracking</option>
          <option value="screenShare">Screen Share</option>
        </select>
      </label>
      <input type="submit" value="Save" />
    </form>
  )
}

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(<App />)
