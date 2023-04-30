const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");
const typescript = require("@rollup/plugin-typescript");
const peerDepsExternal = require("rollup-plugin-peer-deps-external");
const terser = require("@rollup/plugin-terser");
const packageJson = require("./package.json");

const plugins = [peerDepsExternal(), resolve(), commonjs(), terser()];
const exclude = ["node_modules", "dist", "src/tests", "src/stories"];
const tsConfig = { declaration: true, declarationDir: "./dist", rootDir: "src/", exclude };

module.exports = [
  // CommonJS
  {
    input: "src/index.ts",
    output: { dir: "./", exports: "default", entryFileNames: packageJson.main, format: "cjs" },
    plugins: [...plugins, typescript(tsConfig)],
  },
  // ES
  {
    input: "src/index.ts",
    output: { file: packageJson.module, format: "esm" },
    plugins: [...plugins, typescript({ exclude })],
  },
];
