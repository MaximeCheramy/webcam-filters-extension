const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['./src/main.ts', './src/monkey-patch.ts', './src/inject.ts', './src/popup/main.tsx'],
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    target: ['chrome58', 'firefox57'],
    outdir: './public/build',
    watch:
      process.env.NODE_ENV === 'dev'
        ? {
            onRebuild(error, result) {
              if (error) console.error('Build failed')
              else console.log('Build succeeded')
            }
          }
        : false,
    define: {
      'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`
    }
  })
  .catch(() => process.exit(1))
