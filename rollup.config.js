import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import fs from 'fs'
import { defineConfig } from 'rollup'
import { terser } from 'rollup-plugin-terser'
import typescript2 from 'rollup-plugin-typescript2'
import typescript from 'typescript'

const executablePlugin = () => {
  return {
    name: 'executable',
    writeBundle: (options) => {
      fs.chmodSync(options.file, '755')
      console.log('chmod 755', options.file)
    },
  }
}

const config = defineConfig({
  input: './src/index.ts',

  output: {
    file: './bin/dino.js',
    format: 'cjs',
    banner: "#!/usr/bin/env node\n\nglobal.navigator = { userAgent: 'node.js', };\n",
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    typescript2({
      exclude: 'node_modules/**',
      useTsconfigDeclarationDir: true,
      tsconfig: './tsconfig.json',
      typescript,
      tsconfigOverride: {
        compilerOptions: {
          module: 'es2015',
        },
      },
    }),
    commonjs({
      extensions: ['.js'],
      // Optional peer deps of ws. Native deps that are mostly for performance.
      // Since ws is not that perf critical for us, just ignore these deps.
      ignore: ['bufferutil', 'utf-8-validate'],
    }),
    json(),
    terser(),
    executablePlugin(),
  ],
})

export default config
