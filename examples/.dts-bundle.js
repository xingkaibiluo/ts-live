module.exports = {
    moduleName: 'ts-previewer-demo',
    entry: './index.d.ts',
    out: './dist/types.json',
    debugOut: './dist/types.d.ts',
    parseExternal: () => true,
}