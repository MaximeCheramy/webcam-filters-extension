function save() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      'update-settings'
    )
  })
}

document.getElementById("save").onclick = save