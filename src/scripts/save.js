import { describeTextQuote, createTextQuoteSelectorMatcher } from "@apache-annotator/dom"

async function describeCurrentSelection () {
  let userSelection = window.getSelection()
  if (!userSelection || userSelection.isCollapsed) return
  userSelection = userSelection.getRangeAt(0)
  return describeTextQuote(userSelection)
}


// HIGHLIGHTING
async function matchRetrievedSelectors (selector) {
  const highlight = new Highlight()
  CSS.highlights.set("test", highlight)
  const matchList = []
  const matches = createTextQuoteSelectorMatcher(selector)(document.body)
  for await (const match of matches) {
    matchList.push(match)
  }
  for (const match of matchList) {
    console.log("match:")
    console.log(match)
    highlight.add(match)
  }
}

// RECEIVE MESSAGES FROM OTHER COMPONENTS
chrome.runtime.onMessage.addListener(async (request, sender, response) => {
  if (request.type === "SHOW_HIGHLIGHT") {
    console.log("Show highlight event received")
    matchRetrievedSelectors(request.payload)
  }
  if (request.type === "CREATE_SELECTOR") {
    // TODO: check first if a selection exists. If it does, exit instead of returning undefined

    // Get current selection
    describeCurrentSelection()
    .then((newSelector) => {
      console.log(newSelector)
      // Dispatch event to background with selector as payload
      if (newSelector) {
        chrome.runtime.sendMessage({type: "NEW_SELECTOR", payload: newSelector}).then(result => console.log(result))
      }
    })
  }
})