import { nodeResolve } from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import externals from "rollup-plugin-node-externals";
import del from "rollup-plugin-delete";
import pkg from "./package.json";

export default [
  {
    input: "./src/index.js",
    plugins: [
      del({ targets: "dist/*" }),
      externals({ deps: true }),
      nodeResolve({ extensions: [".js"] }),
      babel({
        babelHelpers: "runtime",
        exclude: "**/node_modules/**",
        extensions: [".js"],
      }),
    ],
    output: [{ file: pkg.module, format: "esm", sourcemap: true, strict: true }],
    external: ["react", "rxjs", "rxjs/operators"],
  },
];
