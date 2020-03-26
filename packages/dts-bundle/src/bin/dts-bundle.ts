#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import program from 'commander';
import packageInfo from '../../package.json';
import {
    DtsBundle,
    IOptions
} from '../index';

program.version(packageInfo.version)
    .description(packageInfo.description)
    .usage('[options]')
    .option('-c, --config [configPath]', '配置路径')
    .action(option => {
        main();
    });

program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ dts-bundle');
    console.log('  $ dts-bundle [options]');
});

program.parse(process.argv);


function main() {
    const {
        config = './.dts-bundle.js'
    } = program;
    const cwd = process.cwd();
    let configPath: string = config;

    if (!path.isAbsolute(config)) {
        configPath = path.resolve(cwd, config);
    }

    assert(fs.existsSync(configPath), `Cannot find config file '${configPath}'.`);

    const defaultOptions: Partial<IOptions> = {
        projectDir: cwd
    };
    const options: IOptions = Object.assign(defaultOptions, require(configPath));

    assert(options.moduleName && options.entry && options.out && options.projectDir, `options moduleName、entry、out、projectDir must be present.`);

    const dts = new DtsBundle(options);

    dts.bundle();
}