// INITIAL SETUP
// - triger setup function once every time panel is opened
// - create event listener for new reference button
(() => {

  panelOpened()

  document.querySelector("#new-ref").addEventListener("click", createRef)

})();

// * * * * * * * * * * * * * * *

// LISTEN FOR INCOMING EVENTS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // "SOURCE_CHANGED" (from background)
  // - receive info about new tab and ids of refs to feature
  // - rearrange refs so that refs for current url are featured on top
  if (request.type === "SOURCE_CHANGED") {
    const { source, refIds, focus } = request.data
    featureSource(source)
    featureSourceRefs(refIds)
    if (focus) {
      setFocus(focus)
    } else {
      clearFocus()
    }
  }

})

// * * * * * * * * * * * * * * *

// DISPATCH EVENTS

// "PANEL_OPENED" (to background)
// - trigger once each time the file is loaded
// - receive all refs in storage as response
// - render refs
// - make refs for current source featured
async function panelOpened () {
  const response = await chrome.runtime.sendMessage({type: "PANEL_OPENED"})
  if (!response.error) {
    const { source, refIds, refs } = response.data
    renderRefs(refs)
    featureSource(source)
    featureSourceRefs(refIds)
  } else {
    // TODO: some error handling
  }
}

// "CREATE_REF" (to background)
// - request creation of new ref
// - wait for response with new ref
// - add it to the top section for current url
async function createRef () {
  console.log("Create Ref")
  const response = await chrome.runtime.sendMessage({type: "CREATE_REF"})
  console.log("Response from background: ", response)
  if (!response.error) {
    const newRef = response.data
    renderRefs(newRef, "featured")
  } else {
    // TODO: some error handling
  }
}

// "SELECT_REF" (to background)
// - request selection of ref
async function selectRef (ref) {
  console.log("ID " + ref.id + "selected in side panel")
  const response = await chrome.runtime.sendMessage({type: "SELECT_REF", data: ref})
  if (!response.error) {
    console.log("Response from background: ", response)
    setFocus(ref.id)
  } else {
    // TODO: error handling
  }
}

// "REMOVE_REF" (to background)
// - request removal of ref
// - wait for response with removed ref's id
// - remove element with that id from list
async function removeRef (ref) {
  console.log("ID " + ref.id + "removed in side panel")
  const response = await chrome.runtime.sendMessage({type: "REMOVE_REF", data: ref.id})
  if (!response.error) {
    unrenderRefs(ref.id)
  } else {
    // TODO: error handling
  }
}

// * * * * * * * * * * * * * * *

// RENDER FUNCTIONS

// Add reference
function renderRefs (refs, target) {

  console.log("Refs to render: ", refs)
  const refList = document.querySelector("#ref-list")
  const featList = document.querySelector("#feat-list")
  for (let ref of refs) {
    const li = parseHTML(`
      <li id="${ref.id}">
        <div class="card-top">
          <div class="card-label"></div>
          <div class="card-text">${ref.text}</div>
        </div>
        <div class="card-bottom">
          <button>...</button>
          <ul>
            <li>Title: ${ref.title}</li>
            <li>Source: ${ref.source}</li>
            <li>Created: ${new Date(ref.timestamp).toLocaleString()}</li>
            <li class="card-menu"><button class="rm-ref">Remove</button><button class="rm-share" disabled>Share</button><button class="rm-open" disabled>Open in new tab</button></li>
          </ul>
        </div>
      </li>
    `)
    li.querySelector(".card-top").addEventListener("click", () => selectRef(ref))
    li.querySelector(".rm-ref").addEventListener("click", () => removeRef(ref))
    if (target === "featured") {
      featList.append(li)
    } else {
      refList.append(li)
    }
  }

}

// Remove reference
function unrenderRefs (refId) {
  console.log("RefIds to remove: ", refId)
  const li = document.getElementById(refId)
  li.remove()
}

// Feature current url in it's own section
function featureSource (source) {
  console.log("Source to feature: ", source)
}

// Feature references of current url
function featureSourceRefs (refIds) {
  console.log("Featured source refs: ", refIds)
  const refList = document.querySelector("#ref-list")
  const featList = document.querySelector("#feat-list")
  const unfeatRefs = featList.querySelectorAll(":scope > li")
  for (let li of unfeatRefs) {
    refList.append(li)
  }
  const featRefs = refList.querySelectorAll(":scope > li")
  for (let li of featRefs) {
    if (refIds.includes(li.id)) featList.append(li)
  }
}

// Parser that takes string and returns HTML elements
function parseHTML (string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(string, "text/html")
  return doc.body.firstChild
}

// Set focus in side panel
function setFocus (id) {
  clearFocus()
  document.getElementById(id).classList.add("focussed")
}

// Clear focus in side panel
function clearFocus () {
  const prevFocussed = document.querySelector(".focussed")
  if (prevFocussed) prevFocussed.classList.remove("focussed")
}