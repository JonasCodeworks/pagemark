# Pagemark
A chrome extension to bookmark specific portions webpages

## Build
Running "npm run build" will bundle everything and put it in the "dist" folder

## Install
On the chrome extension page, activate "Developer mode" and use the "Load unpacked" option to load the dist folder

## Important
In order for npm package optimal-select to be correctly bundled by Rollup, the property "module" in it's "package.json" has to be set to "lib/index.js" instead of "src/index.js" (line 38) since in the npm distributed version the src folder doesn't exist

## Notes to self
- [ ] show refs in the order they appear on the page
- [ ] guard against xss (from within selected text)
- [ ] one custom highlight per ref, so that refs can overlap
- [ ] deactivate add reference button when active tab is on restricted chrome: page
- [ ] handle situations where one of the extension components is missing (side panel closed, tab shows restricted chrome: page)