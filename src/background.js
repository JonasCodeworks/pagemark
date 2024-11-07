// assign extension storage
const storage = chrome.storage.local;

chrome.runtime.onInstalled.addListener(() => {
  // remove default behavior of toggling side panel from action
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
})

chrome.action.onClicked.addListener(async (tab) => {
  // open side panel
  chrome.sidePanel.open({windowId: tab.windowId})
  // inject script to save highlight
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ["scripts/save.js"]
  })
})

chrome.runtime.onMessage.addListener((request, sender, response) => {
  console.log("Tab: ", sender.tab)
  console.log("Request: ", request)
})