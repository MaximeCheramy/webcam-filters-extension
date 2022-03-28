const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: [
      "./src/main.ts",
      "./src/inject.ts"
    ],
    bundle: true,
    minify: process.env.NODE_ENV === "production",
    target: ["chrome58", "firefox57"],
    outdir: "./public/build",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`
    }
  })
  .catch(() => process.exit(1));
