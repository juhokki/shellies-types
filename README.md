# shellies-types

TypeScript type definitions for [node-shellies](https://github.com/alexryd/node-shellies)
(`shellies` v1.7, first generation Shelly devices).

Covers the `shellies` singleton, typed events (`discover`, `add`, `remove`,
`stale`, device `change`/`change:<prop>`/`online`/`offline`), the CoAP and HTTP
helpers, `StatusUpdatesListener`, and all 40 supported device models.
`createDevice('SHSW-25', ...)` returns the matching device type.

## Usage

```
npm install shellies shellies-types
```

Make TypeScript load the types by listing the package in `tsconfig.json`
(this registers the `shellies` module declaration):

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "types": ["node", "shellies-types"]
  }
}
```

Alternatively, add `/// <reference types="shellies-types" />` to any file in
your project.

```ts
import shellies from 'shellies'

shellies.on('discover', device => {
  device.on('change', (prop, newValue, oldValue) => {
    console.log(prop, oldValue, '->', newValue)
  })
})

shellies.start()
```

Types for individual devices are available as `shellies.Shelly25`,
`shellies.ShellyHT`, etc. (e.g. `shellies.getDevice(...) as shellies.Shelly1`).

## Development

```
npm install
npm test   # type-checks index.d.ts against test/shellies-tests.ts
```
