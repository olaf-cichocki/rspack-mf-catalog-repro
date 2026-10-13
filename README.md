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

## More cases

`pnpm scenarios` builds six variants, each from its own entry under `scenarios/`. Cases 5 and 6 register react through a runtime plugin, standing in for another container that provides it. webpack has no `runtimePlugins`, so those two run on Rspack only.

```
### 1. catalog:, singleton
[rspack] emitted: shareKey: "react", import: "react", requiredVersion: "catalog:"
[rspack] exit 0: react 19.3.0 loaded / [ Federation Runtime ] Version 19.3.0 from host of shared singleton module react does not satisfy the requirement of host which needs catalog:)
[webpack] emitted: loadSingleton("default", "react", false
[webpack] exit 0: react 19.3.0 loaded

### 2. workspace:*, singleton
[rspack] emitted: shareKey: "lib", import: "lib", requiredVersion: "workspace:*"
[rspack] exit 0: lib 1.0.0 loaded / [ Federation Runtime ] Version 1.0.0 from host of shared singleton module lib does not satisfy the requirement of host which needs workspace:*)
[webpack] emitted: loadSingleton("default", "lib", false
[webpack] exit 0: lib 1.0.0 loaded

### 3. ^19.0.0, singleton (control)
[rspack] emitted: shareKey: "react", import: "react", requiredVersion: "^19.0.0"
[rspack] exit 0: react 19.3.0 loaded
[webpack] emitted: loadSingletonVersion("default", "react", false, [1,19,0,0]
[webpack] exit 0: react 19.3.0 loaded

### 4. catalog: with an explicit requiredVersion ^18.0.0 (mismatch control)
[rspack] emitted: shareKey: "react", import: "react", requiredVersion: "^18.0.0"
[rspack] exit 0: react 19.3.0 loaded / [ Federation Runtime ] Version 19.3.0 from host of shared singleton module react does not satisfy the requirement of host which needs ^18.0.0)
[webpack] emitted: loadSingletonVersion("default", "react", false, [1,18,0,0]
[webpack] exit 0: react 19.3.0 loaded / Unsatisfied version 19.3.0 from rspack-mf-catalog-repro of shared singleton module react (required ^18.0.0)

### 5. catalog:, import: false, no singleton, react registered by a runtime plugin
[rspack] emitted: shareKey: "react", import: null, requiredVersion: "catalog:"
[rspack] exit 1: Error: The getter for the shared module is not a function. This may be caused by setting "shared.import: false" without the host providing the corresponding lib. #RUNTIME-012

### 6. ^19.0.0, import: false, no singleton, react registered by a runtime plugin (control)
[rspack] emitted: shareKey: "react", import: null, requiredVersion: "^19.0.0"
[rspack] exit 0: react 19.3.0 loaded
```
