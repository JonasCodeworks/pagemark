// assign extension storage
const storage = chrome.storage.local;

chrome.runtime.onInstalled.addListener(() => {
  // remove default behavior of toggling side panel from action
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  // TODO: remove when no longer needed
  // for dev purposes, empty storage
  storage.clear().then(() => console.log("Storage cleared"))
})

chrome.action.onClicked.addListener(async (tab) => {
  // open side panel
  chrome.sidePanel.open({windowId: tab.windowId})
  // TODO: load refs from storage when side panel is opened

  // Push content script to tab
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ["scripts/save.js"]
  })
})

// Placeholder to generate UUIDs from https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid/68141099
function uuid() {
  return '00-0-4-1-000'.replace(/[^-]/g,
          s => ((Math.random() + ~~s) * 0x10000 >> s).toString(16).padStart(4, '0')
  );
}

// RECEIVE MESSAGES FROM OTHER COMPONENTS
chrome.runtime.onMessage.addListener(async (request, sender, response) => {
  if (request.type === "NEW_SELECTOR") {
    const { title, url } = sender.tab
    const sourceUrl = new URL(url)
    const source = sourceUrl.hostname + sourceUrl.pathname
    const id = uuid();
    const timestamp = Date.now()
    const newReference = {id, timestamp, title, source, text: request.payload.exact, selector: request.payload}
    await storage.set({[id]: newReference})
    storage.get(null).then(result => console.log(result))
  }
  if (request.type === "REMOVE_REF") {
    console.log("Request to remove ref: ", request.payload)
    await storage.remove(request.payload)
    storage.get(null).then(result => console.log(result))
  }
  if (request.type === "HIGHLIGHT_REF") {
    console.log("Request to highlight ref: ", request.payload)
    const selectedRef = await storage.get(request.payload)
    console.log("Selected Ref: ", selectedRef)
    const activeTab = await chrome.tabs.query({active: true, lastFocusedWindow: true})
    if (activeTab[0].url) {
      const activeUrl = new URL(activeTab[0].url)
      const activeSource = activeUrl.hostname + activeUrl.pathname
      // TODO: find a better solution, like 1) check if tab with requested source is open and use this 2) if not create new tab
      if (activeSource === selectedRef[request.payload].source) {
        console.log("Tab currently at same url as selected ref")
        console.log(activeTab)
      } else {
        await chrome.tabs.update({url: `https://${selectedRef[request.payload].source}`})
      }
      chrome.tabs.sendMessage(activeTab[0].id, {type: "SHOW_HIGHLIGHT", payload: selectedRef[request.payload].selector})
    }
  }
})

// LISTEN TO UPDATES OF STORAGE
chrome.storage.onChanged.addListener(async (changes) => {
  console.log("Changes in storage: ", changes)
  // iterate over changes
  for (const key in changes) {
    // check if change has newValue
    if (changes[key].newValue) {
      // if it does, it has been newly added (or updated)
      chrome.runtime.sendMessage({type: "REF_ADDED", payload: changes[key].newValue})
    } else {
      // if it doesn't it has been removed
      chrome.runtime.sendMessage({type: "REF_REMOVED", payload: changes[key].oldValue})
    }
  }
})