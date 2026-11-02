// Makes `import ... from 'shellies'` resolve to these types.
// Include this package once in your project, e.g. via tsconfig
// `"types": ["shellies-types"]` or `/// <reference types="shellies-types" />`.
declare module 'shellies' {
    import shellies = require('shellies-types/shellies');
    export = shellies;
}
