import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import { chromeExtension, simpleReloader } from "rollup-plugin-chrome-extension"
import copy from "rollup-plugin-copy"

export default {
	input: [
		"src/manifest.json",
		"src/sidepanel.html",
		"src/scripts/save.js",
		"src/scripts/highlight.js"
	],
	output: {
		dir: 'dist',
		format: 'esm'
	},
  plugins: [
		chromeExtension(),
		simpleReloader(),
    resolve(),
    commonjs(),
		//copy({targets:[{src: "src/scripts", dest: "dist"}]})
  ]
}

// TODO: install @rollup/plugin-terser to minify bundled code