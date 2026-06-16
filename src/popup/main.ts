const viewerBtn = document.getElementById('viewer')
const interceptBtn = document.getElementById('intercept')

viewerBtn?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/viewer/index.html') })
  window.close()
})

interceptBtn?.addEventListener('click', () => {
  chrome.windows.create({
    url: chrome.runtime.getURL('src/intercept/index.html'),
    type: 'popup',
    width: 960,
    height: 720,
  })
  window.close()
})
