import path from 'path';
import fs from 'fs';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';

function packageJson() {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.env.MODULE, 'package.json'), 'utf-8')
  );
}

function input() {
  return path.resolve(process.env.MODULE, 'src/index.ts');
}

function output(format) {
  const formatMap = {
    esm: 'es',
    cjs: 'cjs',
    global: 'iife'
  };

  const config = {
    name: packageJson().name.split('/')[1],
    format: formatMap[format],
    file: path.resolve(process.env.MODULE, `dist/${format}.js`),
    sourcemap: true
  };

  return config;
}

function makeRollupConfig(format) {
  const config = {
    input: input(),
    output: output(format),
    plugins: [
      json(),
      typescript({
        tsconfig: path.resolve(path.dirname('.'), 'tsconfig.json')
      }),
      nodeResolve()
    ]
  };

  return config;
}

const { formats } = packageJson();

export default formats.map((format) => makeRollupConfig(format));
