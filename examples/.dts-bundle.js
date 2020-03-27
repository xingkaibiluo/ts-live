module.exports = {
    moduleName: 'ts-previewer-demo',
    entry: './index.d.ts',
    out: './src/dts/types.json',
    // debugOut: './src/dts/types.d.ts',
    parseExternal: () => true,
}