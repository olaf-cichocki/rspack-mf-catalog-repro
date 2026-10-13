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
      shared: { react: { singleton: true } },
    }),
  ],
});

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
  const emitted = readFileSync(output, 'utf8').match(/requiredVersion:\s*"[^"]*"/g) ?? ['(no requiredVersion string emitted)'];
  const run = spawnSync(process.execPath, [output], { encoding: 'utf8' });

  console.log(`\n=== ${name} ===`);
  console.log('emitted:', [...new Set(emitted)].join(', '));
  console.log((run.stdout + run.stderr).trim());
}
