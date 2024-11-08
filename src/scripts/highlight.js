//import { createTextQuoteSelectorMatcher } from "@apache-annotator/dom";

console.log("Script injection successful")

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
    matchRetrievedSelectors(request.payload)
  }
})