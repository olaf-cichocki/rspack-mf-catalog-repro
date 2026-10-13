import path from 'node:path';

import { buildAndRun } from './bundle.mjs';

const provideReact = path.join(import.meta.dirname, 'scenarios/provide-react.cjs');

// webpack's ModuleFederationPlugin has no `runtimePlugins`, so the import: false cases are Rspack only.
const scenarios = [
  { title: 'catalog:, singleton', entry: './scenarios/catalog-app/index.js', shared: { react: { singleton: true } } },
  { title: 'workspace:*, singleton', entry: './scenarios/workspace-app/index.js', shared: { lib: { singleton: true } } },
  { title: '^19.0.0, singleton (control)', entry: './scenarios/plain-app/index.js', shared: { react: { singleton: true } } },
  {
    title: 'catalog: with an explicit requiredVersion ^18.0.0 (mismatch control)',
    entry: './scenarios/catalog-app/index.js',
    shared: { react: { singleton: true, requiredVersion: '^18.0.0' } },
  },
  {
    title: 'catalog:, import: false, no singleton, react registered by a runtime plugin',
    entry: './scenarios/catalog-app/index.js',
    shared: { react: { import: false } },
    runtimePlugins: [provideReact],
    rspackOnly: true,
  },
  {
    title: '^19.0.0, import: false, no singleton, react registered by a runtime plugin (control)',
    entry: './scenarios/plain-app/index.js',
    shared: { react: { import: false } },
    runtimePlugins: [provideReact],
    rspackOnly: true,
  },
];

for (const [index, scenario] of scenarios.entries()) {
  console.log(`\n### ${index + 1}. ${scenario.title}`);
  for (const name of scenario.rspackOnly ? ['rspack'] : ['rspack', 'webpack']) {
    const { emitted, status, stdout, stderr } = await buildAndRun(name, { ...scenario, outDir: `scenario-${index + 1}` });
    const error = status === 0 ? stderr : stderr.split('\n').find((line) => /^\w*Error/.test(line));
    console.log(`[${name}] emitted: ${emitted.join(' | ')}`);
    console.log(`[${name}] exit ${status}: ${[stdout, error].filter(Boolean).join(' / ')}`);
  }
}
