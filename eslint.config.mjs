import next from "eslint-config-next";

const ignores = [
  ".next",
  "node_modules",
  "dist",
  "coverage",
  "out",
  "build",
  "**/*.config.*",
  "**/next-env.d.ts",
  "**/tsconfig.*",
];

export default [{ ignores }, ...next];
