module.exports = {
    moduleName: 'ts-previewer-demo',
    entry: './index.d.ts',
    out: './src/typings/types.json',
    debugOut: './src/typings/types.d.ts',
    parseExternal: () => true,
}