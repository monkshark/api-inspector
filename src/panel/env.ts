export const isDevtools =
  typeof chrome !== 'undefined' &&
  typeof chrome.devtools !== 'undefined' &&
  typeof chrome.devtools.inspectedWindow !== 'undefined'
