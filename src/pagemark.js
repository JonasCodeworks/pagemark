import { describeTextQuote, createTextQuoteSelectorMatcher } from "@apache-annotator/dom"

// STATE-LIKE STUFF
const highlights = {}
let focus = null;
const customHighlight = new Highlight()
CSS.highlights.set("pm-highlight", customHighlight)
const customFocus = new Highlight()
CSS.highlights.set("pm-focus", customFocus)



/* async function describeCurrentSelection () {
  let userSelection = window.getSelection()
  if (!userSelection || userSelection.isCollapsed) return
  userSelection = userSelection.getRangeAt(0)
  return describeTextQuote(userSelection)
}


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
}) */

// * * * * * * * * * * * * * * *

// SETUP ON PAGELOAD

  console.log("Script executed on pageload")
  chrome.runtime.sendMessage({type: "PAGE_LOADED"})


// * * * * * * * * * * * * * * *

// LISTEN FOR INCOMING EVENTS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // "REF_ADDED" (from background)
  // - receive one (or multiple) refs
  // - iterate over refs
  // - for each, match the selector(s) to range(s)
  // - add ref id as key and range(s) as value to the highlights object
  // - add range(s) to the custom highlight
  if (request.type === "REF_ADDED") {
    const refs = request.data
    for (let ref of refs) {
      matchSelectors(ref.selectors)
      .then((ranges) => {
        highlights[ref.id] = ranges
        for (let range of ranges) {
          customHighlight.add(range)
        }
      })
    }
  }

  // "REF_REMOVED" (from background)
  // - receive one (or multiple) ref ids
  // - iterate over ref ids
  // - for each, check if it exists in the highlights object
  // - if yes, remove it
  // - also remove it from the custom highlight
  // - proceed by checking if the highlight was currently focussed
  // - if yes, remove it from the focus variable and from custom highlight
  if (request.type === "REF_REMOVED") {
    const refIds = request.data
    for (let refId of refIds) {
      if (Object.hasOwn(highlights, refId)) {
        const ranges = highlights[refId]
        for (let range in ranges) {
          customHighlight.delete(range)
        }
        delete highlights[refId]
      }
      if (focus === refId) {
        customFocus.clear()
        focus = null
      }
    }
  }

  // "FOCUS_HIGHLIGHT" (from background)
  // - receive one ref id
  // - check if id exists as key on the highlights object
  // - if yes, set focus variable to that id
  // - iterate through range(s) and add them to custom highlight
  if (request.type === "FOCUS_HIGHLIGHT") {
    const refId = request.data
    if (Object.hasOwn(highlights, refId)) {
      focus = refId
      const ranges = highlights[refId]
      for (let range of ranges) {
        customFocus.add(range)
      }
    }
  }

  // "NEW_SELECTOR" (from background)
  // - check if a selection exists
  // - if no, respond with error message
  // - if yes, create array of selector(s) for the current selection
  // - respond with the new selector(s)

  if (request.type === "NEW_SELECTORS") {
    describeSelection()
      .then((selectors) => {
        const res = {}
        if (selectors === undefined) {
          res.error = true
          res.msg = "No selection available"
        } else {
          res.data = selectors
        }
        sendResponse(res) // TODO: respond with error, if something goes wrong
      })
    return true // this is needed to enable async messaging inside chrome extensions
    }

})

// * * * * * * * * * * * * * * *

// UTILITIES

// Create selector(s) from user selection
async function describeSelection () {
  const userSelection = window.getSelection()
  if (!userSelection || userSelection.isCollapsed) return
  const selectors = []
  for (let i = 0; i < userSelection.rangeCount; i++) {
    const selector = await describeTextQuote(userSelection.getRangeAt(i))
    selectors.push(selector)
  }
  return selectors
}

// Match selector(s) to range(s)
async function matchSelectors (selectors) {
  if (!selectors || selectors.length < 1) return
  const matchList = []
  for (let selector of selectors) {
    const matches = createTextQuoteSelectorMatcher(selector)(document.body)
    for await (const match of matches) {
      matchList.push(match)
    }
  }
  return matchList
}