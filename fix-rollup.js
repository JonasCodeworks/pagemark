const fs = require("node:fs")

const manifest = JSON.parse(fs.readFileSync("dist/manifest.json"))
const newPermissions = [...manifest.permissions, "sidePanel"]
fs.writeFileSync("dist/manifest.json", JSON.stringify({...manifest, permissions: newPermissions}))

