/* // RECEIVE MESSAGES FROM OTHER COMPONENTS
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
}) */


// * * * * * * * * * * * * * * *

// INITIAL SETUP

// - connect to storage
const storage = chrome.storage.local;

chrome.runtime.onInstalled.addListener(() => {
  // - set action to toggle side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  // - clear storage (only for dev purposes)
  storage.clear().then(() => console.log("Storage cleared"))
})

// * * * * * * * * * * * * * * *

// LISTEN FOR INCOMING EVENTS
chrome.runtime.onMessage.addListener(asyncWrapper(async (request, sender) => {

  // "PANEL_OPENED" (from side panel)
  // - lookup all refs in storage
  // - respond with all refs
  if (request.type === "PANEL_OPENED") {
    const res = {}
    const tab = await findActiveTab()
    const allRefs = await storage.get(null)
    res.data = {refs: Object.values(allRefs)}
    console.log("All Refs: ", res.data)
    if (tab.url && new URL(tab.url).protocol !== "chrome:") {
      const { source, refIds, refs } = await getRefsForSource(tab)
      res.data.source = source
      res.data.refIds = refIds
    }
    return res
  }

  // "CREATE_REF" (from side panel)
  // - request a selector for current selection from active tab
  // - receive the tabs response containing a new selector
  // - construct a ref from new selector
  // - save new ref to storage
  // - wait for response from storage
  // - respond to side panel with newly created ref
  // - request creation of new highlight from tab
  // - wait for confirmation from tab
  if (request.type === "CREATE_REF") {
    const res = {}
    const tab = await findActiveTab()
    const response = await chrome.tabs.sendMessage(tab.id, {type: "NEW_SELECTORS"})
    console.log("Response from tab: ", response)
    if (!response.error) {
      const { title, url } = tab
      const source = urlToSource(url)
      const id = generateUuid()
      const timestamp = Date.now()
      const newRef = {id, timestamp, title, source, text: response.data[0].exact, selectors: response.data} // TODO: if multiple selectors, concatenate their text
      await storage.set({[id]: newRef}) // TODO: get confirmation from storage
      res.data = [newRef]
      chrome.tabs.sendMessage(tab.id, {type: "REF_ADDED", data: [newRef]})
    } else {
      res.error = true
      res.msg = response.msg
    }
   return res
  }

  // "SELECT_REF" (from side panel)
  // - check if current window has tab with the url of selected ref
  // - if yes, make that the active tab
  // - if no, create a new tab and navigate to the ref's url
  // - make sure the tab has received and processed all refs for it's url
  // - request tab to focus on selected highlight
  if (request.type === "SELECT_REF") {

  }

  // "REMOVE_REF" (from side panel)
  // - check if ref with requested id exists in storage
  // - if so, remove it from storage
  // - wait for response from storage
  // - respond to side panel with id of removed ref
  // - request removal of ref from tab
  // - wait for confirmation by tab
  if (request.type === "REMOVE_REF") {

  }

  // "PAGE_LOADED" (from tab)
  // - receive new url from tab
  // - lookup all refs for this url in storage
  // - send refs to tab
  // - send ref ids to side panel for filtering
  if (request.type === "PAGE_LOADED") {
    if (sender.documentLifecycle === "active" && sender.tab.active) {
      console.log("Sender object: ", sender)
      const { source, refIds, refs } = await getRefsForSource(sender.tab)
      await chrome.tabs.sendMessage(sender.tab.id, {type: "REF_ADDED", data: refs})
      await chrome.runtime.sendMessage({type: "SOURCE_CHANGED", data: {source, refIds}})
    }
    return // resolve the asyncWrapper's promise
  }

}))


chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId)
  if (tab.url && new URL(tab.url).protocol !== "chrome:") {
    console.log("onActivated: ", activeInfo, tab)
    const { source, refIds, refs } = await getRefsForSource(tab)
    await chrome.tabs.sendMessage(tab.id, {type: "REF_ADDED", data: refs})
    await chrome.runtime.sendMessage({type: "SOURCE_CHANGED", data: {source, refIds}})
  }
})

// * * * * * * * * * * * * * * *

// DISPATCH EVENTS

// "REF_ADDED" (to tab)
// - send one (or multiple) refs to tab

// "REF_REMOVED" (to tab)
// - send one (or multiple?) refs to tab
// - wait for confirmation that highlights were removed?

// "FOCUS_HIGHLIGHT" (to tab)
// - request focussing of highlight

// "NEW_SELECTOR" (to tab)
// - request new selector for current selection
// - receive selector from tab

// "SOURCE_CHANGED" (to side panel)
// - ???

// * * * * * * * * * * * * * * *

// UTILITIES

// UUID generator (placeholder)
// Credits to: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid/68141099
function generateUuid() {
  return '00-0-4-1-000'.replace(/[^-]/g,
          s => ((Math.random() + ~~s) * 0x10000 >> s).toString(16).padStart(4, '0')
  );
}

// Convert URL to source (by stripping queries and fragments)
function urlToSource (url) {
  const source = new URL(url)
  return source.protocol + "//" + source.hostname + source.pathname
}

// Find currently active tab
async function findActiveTab () {
  const activeTab = await chrome.tabs.query({active: true, lastFocusedWindow: true})
  return activeTab[0]
}

// Get all references and filter by source
async function getRefsForSource (tab) {
    const tabSource = urlToSource(tab.url)
    const refs = await storage.get(null)
    const keys = Object.keys(refs)
    const filteredRefs = []
    const filteredKeys = []
    for (let key of keys) {
      if (refs[key].source === tabSource) {
        filteredRefs.push(refs[key])
        filteredKeys.push(key)
      }
    }
    return {source: tabSource, refIds: filteredKeys, refs: filteredRefs}
}

// Wrapper to handle asynchronicity in message responses
// Credits to: https://stackoverflow.com/questions/44056271/chrome-runtime-onmessage-response-with-async-await
function asyncWrapper (listener) {
  return function (request, sender, sendResponse) {
    Promise.resolve(listener(request, sender)).then(sendResponse)
    return true
  }
}

