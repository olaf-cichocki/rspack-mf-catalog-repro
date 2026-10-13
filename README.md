# Rspack copies `catalog:` and `workspace:*` into a shared module's `requiredVersion`

`react` is declared as `"catalog:"` (pnpm catalog) and `lib` as `"workspace:*"`. `build.mjs` builds the same Module Federation host with Rspack and with webpack, then runs each output.

```sh
pnpm install
pnpm repro
```

```
=== rspack ===
emitted: shareKey: "lib", import: "lib", requiredVersion: "workspace:*"
emitted: shareKey: "react", import: "react", requiredVersion: "catalog:"
react 19.3.0 and lib 1.0.0 loaded
[ Federation Runtime ] Version 1.0.0 from host of shared singleton module lib does not satisfy the requirement of host which needs workspace:*)
[ Federation Runtime ] Version 19.3.0 from host of shared singleton module react does not satisfy the requirement of host which needs catalog:)

=== webpack ===
emitted: loadSingleton("default", "lib", false
emitted: loadSingleton("default", "react", false
react 19.3.0 and lib 1.0.0 loaded
```

webpack writes no range for either module. `loadSingleton` is its loader without a version check; with a real range it uses `loadSingletonVersion("default", "react", false, [1,19,0,0], ...)`.
