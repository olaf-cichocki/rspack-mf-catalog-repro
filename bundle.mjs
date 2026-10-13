import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { rspack } from '@rspack/core';
import webpack from 'webpack';

const root = import.meta.dirname;
const bundlers = { rspack, webpack };

// Rspack emits consume data with a `requiredVersion` string. webpack picks a loader instead:
// `loadSingleton(...)` has no version check, `loadSingletonVersion(..., [range])` has one.
const consumePattern = {
  rspack: /shareKey: "[^"]+",\s*import: [^,]+,\s*requiredVersion: [^,]+/g,
  webpack: /load\w*\("default", "[^"]+", (?:false|true)(?:, \[[^\]]*\])?/g,
};

export const buildAndRun = async (name, { entry, shared, runtimePlugins, outDir }) => {
  const bundler = bundlers[name];
  const out = path.join(root, 'dist', outDir, name);
  const config = {
    mode: 'production',
    target: 'node',
    context: root,
    entry,
    devtool: false,
    optimization: { minimize: false },
    output: { path: out, clean: true },
    plugins: [new bundler.container.ModuleFederationPlugin({ name: 'host', shared, ...(runtimePlugins && { runtimePlugins }) })],
  };

  await new Promise((resolve, reject) => {
    bundler(config, (error, stats) => {
      if (error) return reject(error);
      if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')));
      resolve();
    });
  });

  const main = path.join(out, 'main.js');
  const emitted = [...new Set(readFileSync(main, 'utf8').match(consumePattern[name]))].sort().map((site) => site.replace(/\s+/g, ' '));
  const run = spawnSync(process.execPath, [main], { encoding: 'utf8' });
  return { emitted, status: run.status, stdout: run.stdout.trim(), stderr: run.stderr.trim() };
};
