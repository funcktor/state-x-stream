// import typescript from "rollup-plugin-typescript2";
import { uglify } from "rollup-plugin-uglify";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: [
    {
      file: pkg.main,
      format: "amd",
      exports: "named",
      sourcemap: true,
      strict: true,
    },
  ],
  plugins: [uglify()],
  external: ["react", "rxjs", "rxjs/operators"],
};
