console.log('sidepanel.js');

// TODO: send message to background after opening side panel (to initally load references)

// placeholder for adding/opening/highlighting/deleting a saved reference
const injector = document.querySelector("#inject-script")
injector.addEventListener("click", () => {
  console.log("Script Injector clicked")
  chrome.tabs.query({active: true, lastFocusedWindow: true})
  .then((activeTab) => {
    chrome.tabs.sendMessage(activeTab[0].id, {type: "CREATE_SELECTOR"})
  })
})

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