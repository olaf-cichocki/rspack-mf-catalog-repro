import { buildAndRun } from './bundle.mjs';

for (const name of ['rspack', 'webpack']) {
  const { emitted, stdout, stderr } = await buildAndRun(name, {
    entry: './src/index.js',
    shared: { react: { singleton: true }, lib: { singleton: true } },
    outDir: 'repro',
  });

  console.log(`\n=== ${name} ===`);
  for (const site of emitted) console.log(`emitted: ${site}`);
  console.log([stdout, stderr].filter(Boolean).join('\n'));
}
