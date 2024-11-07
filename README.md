# Pagemark
A chrome extension to bookmark specific portions webpages

## Build
Running "npm run build" will bundle everything and put it in the "dist" folder

## Install
On the chrome extension page, activate "Developer mode" and use the "Load unpacked" option to load the dist folder

## Important
In order for npm package optimal-select to be correctly bundled, the property "module" in it's "package.json" has to be set to "lib/index.js" instead of "src/index.js" since in the npm distributed version the src folder doesn't exist