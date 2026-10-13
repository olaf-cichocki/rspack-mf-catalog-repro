# Rspack copies `catalog:` into a shared module's `requiredVersion`

`react` is declared as `"catalog:"` (pnpm catalog). `build.mjs` builds the same Module Federation host with Rspack and with webpack, then runs each output.

```sh
pnpm install
pnpm repro
```

```
=== rspack ===
emitted: requiredVersion: "catalog:"
react 19.3.0 loaded
[ Federation Runtime ] Version 19.3.0 from host of shared singleton module react does not satisfy the requirement of host which needs catalog:)

=== webpack ===
emitted: (no requiredVersion string emitted)
react 19.3.0 loaded
```
