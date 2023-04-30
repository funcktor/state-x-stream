import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import terser from "@rollup/plugin-terser";
import packageJson from "./package.json" assert { type: "json" };

const plugins = [peerDepsExternal(), resolve(), commonjs(), terser()];
const exclude = ["node_modules", "dist", "src/tests", "src/stories"];
const tsConfig = { declaration: true, declarationDir: "./dist", rootDir: "src/", exclude };

export default [
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
