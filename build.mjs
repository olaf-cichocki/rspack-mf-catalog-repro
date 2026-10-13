import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { rspack } from '@rspack/core';
import webpack from 'webpack';

const root = import.meta.dirname;

const configFor = (bundler, name) => ({
  mode: 'production',
  target: 'node',
  context: root,
  entry: './src/index.js',
  devtool: false,
  optimization: { minimize: false },
  output: { path: path.join(root, 'dist', name), clean: true },
  plugins: [
    new bundler.container.ModuleFederationPlugin({
      name: 'host',
      shared: {
        react: { singleton: true },
        lib: { singleton: true },
      },
    }),
  ],
});

// Rspack emits consume data with a `requiredVersion` string. webpack picks a loader instead:
// `loadSingleton(...)` has no version check, `loadSingletonVersion(..., [range])` has one.
const consumePattern = {
  rspack: /shareKey: "[^"]+",\s*import: [^,]+,\s*requiredVersion: [^,]+/g,
  webpack: /load\w*\("default", "[^"]+", (?:false|true)(?:, \[[^\]]*\])?/g,
};

const build = (bundler, name) =>
  new Promise((resolve, reject) => {
    bundler(configFor(bundler, name), (error, stats) => {
      if (error) return reject(error);
      if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')));
      resolve(path.join(root, 'dist', name, 'main.js'));
    });
  });

for (const [bundler, name] of [
  [rspack, 'rspack'],
  [webpack, 'webpack'],
]) {
  const output = await build(bundler, name);
  const emitted = [...new Set(readFileSync(output, 'utf8').match(consumePattern[name]))].sort();
  const run = spawnSync(process.execPath, [output], { encoding: 'utf8' });

  console.log(`\n=== ${name} ===`);
  for (const site of emitted) console.log(`emitted: ${site.replace(/\s+/g, ' ')}`);
  console.log((run.stdout + run.stderr).trim());
}
