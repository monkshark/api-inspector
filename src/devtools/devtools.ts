const PANEL_PAGE = 'src/panel/index.html'

chrome.devtools.panels.create('API Inspector', '', PANEL_PAGE)
