module.exports = {
    moduleName: '@byte-design/ui',
    entry: '../packages/react-previewer/dist/index.d.ts',
    out: './dist/types.json',
    debugOut: './dist/types.debug.json',
    parseExternal: () => true,
}