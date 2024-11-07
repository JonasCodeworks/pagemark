import { describeTextQuote } from "@apache-annotator/dom"

async function describeCurrentSelection () {
  let userSelection = window.getSelection()
  if (!userSelection || userSelection.isCollapsed) return
  userSelection = userSelection.getRangeAt(0)
  return describeTextQuote(userSelection)
}

// Get current selection
describeCurrentSelection()
.then((newSelector) => {
  console.log(newSelector)
  // Dispatch event to background with selector as payload
  if (newSelector) {
    chrome.runtime.sendMessage({type: "NEW_SELECTOR", payload: newSelector}).then(result => console.log(result))
  }
})

