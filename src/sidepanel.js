/* // placeholder for adding/opening/highlighting/deleting a saved reference
const injector = document.querySelector("#inject-script")
injector.addEventListener("click", () => {
  console.log("Script Injector clicked")
  chrome.tabs.query({active: true, lastFocusedWindow: true})
  .then((activeTab) => {
    chrome.tabs.sendMessage(activeTab[0].id, {type: "NEW_SELECTOR"}).then(response => console.log("Response: ", response))
  })
}) */

// RECEIVE MESSAGES FROM OTHER COMPONENTS
chrome.runtime.onMessage.addListener(async (request, sender, response) => {
  if (request.type === "REF_ADDED") {
    console.log("Request: ", request)
    addRef(request.payload)
  }
  if (request.type === "REF_REMOVED") {
    console.log("Request: ", request)
    removeRef(request.payload)
  }
})

function addRef (ref) {
  const parser = new DOMParser()
  const newRef = parser.parseFromString(
    `<li id="${ref.id}">
      ${ref.text}
      <button class="rm-ref">Delete</button>
      <button class="hl-ref">Highlight</button>
    </li>`
    , "text/html")
  newRef.querySelector(".rm-ref").addEventListener("click", () => {
    chrome.runtime.sendMessage({type: "REMOVE_REF", payload: ref.id})
  })
  newRef.querySelector(".hl-ref").addEventListener("click", () => {
    chrome.runtime.sendMessage({type: "HIGHLIGHT_REF", payload: ref.id})
  })
  document.querySelector("#ref-list").append(newRef.querySelector("li"))
}

function removeRef (ref) {
  const element = document.getElementById(ref.id)
  if (element) element.remove()
}


// * * * * * * * * * * * * * * *

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
    const { source, refIds } = request.data
    featureSource(source)
    featureSourceRefs(refIds)
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
    renderRefs(newRef)
  } else {
    // TODO: some error handling
  }
}

// "SELECT_REF" (to background)
// - request selection of ref

// "REMOVE_REF" (to background)
// - request removal of ref
// - wait for response with removed ref's id
// - remove element with that id from list

// * * * * * * * * * * * * * * *

// RENDER FUNCTIONS

// Add reference
function renderRefs (refs) {
  console.log("Refs to render: ", refs)
}

// Remove reference
function unrenderRefs (refIds) {
  console.log("RefIds to remove: ", refIds)
}

// Feature current url in it's own section
function featureSource (source) {
  console.log("Source to feature: ", source)
}

// Feature references of current url
function featureSourceRefs (refIds) {
  console.log("Featured source refs: ", refIds)
}