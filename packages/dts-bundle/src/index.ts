import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import chalk from 'chalk';

const bomOptExp = /^\uFEFF?/;

const pathExp = /^([\./].*|.:.*)$/;

// https://regex101.com/r/Jxa3KX/4
const requireExp = /(const|let|var)(.|\n)*? require\(('|")(.*)('|")\);?$/;

//  https://regex101.com/r/hdEpzO/4
const es6Exp = /(import|export)((?!from)(?!require)(?!;)(.|\n))*?(from|require\()\s?('|")(.*)('|")\)?;?$/gm;

const commentsExp = /(\/\*(.*?)\*\/)|((?:^|\s)\/\/(.+?)$)/gms;

export interface IOptions {
    moduleName: string; // entry 对应的 module
    entry: string;
    projectDir: string;
    out: string;
    debugOut?: string;
    extraModules?: string[];
    extraReferences?: string[];
    parseExternal?: (moduleName: string) => string | boolean; // 返回 false 跳过该 module，否则返回 module 的 .d.ts 绝对路径
}

export interface IType {
    code: string;
    moduleName: string;
}

export interface ITypes {
    [path: string]: IType;
}

interface ITask {
    filePath: string;
    from: 'root' | 'relative' | 'external' | 'reference-type' | 'reference-path';
}

export class DtsBundle {

    private types: ITypes = {};

    private entry: string;

    private projectDir: string;

    private out: string;

    private debugOut?: string;

    private moduleName: string;

    private extraModules: string[];

    private extraReferences: string[];

    private injectExtraFlag = false; // 是否已经注入的标志

    private customParseExternal?: (moduleName: string) => string | boolean;

    private externalVisited: string[] = []; // 记录已处理过的外部依赖，解决循环依赖

    constructor(options: IOptions) {
        const {
            entry,
            projectDir,
            out,
            moduleName,
            debugOut,
            parseExternal,
            extraModules = [],
            extraReferences = []
        } = options;

        this.projectDir = projectDir;
        this.entry = path.resolve(this.projectDir, entry);
        this.out = out;
        this.moduleName = moduleName;
        this.customParseExternal = parseExternal;
        this.debugOut = debugOut;
        this.extraModules = extraModules;
        this.extraReferences = extraReferences;
    }

    public bundle() {

        this.setType(this.entry, this.moduleName);

        if (this.debugOut) {
            let allTypes = '';

            Object.values(this.types).forEach(types => {
                allTypes += '\n' + types.code;
            });
            this.writeFile(this.debugOut, allTypes);
        }

        this.writeFile(this.out, JSON.stringify(Object.values(this.types)));
    }

    private getReferencePaths(input: string) {
        const rx = /<reference path="([^"]+)"\s\/>/;

        return (input.match(new RegExp(rx.source, 'g')) || []).map(s => {
            const match = s.match(rx);
            if (match && match.length >= 2) {
                return match[1];
            } else {
                throw new Error(`Error parsing: "${s}".`);
            }
        });
    }

    private getTypeDependencies(baseFile: string, baseMod: string): string {

        if (this.types[baseFile]) {
            return this.types[baseFile].code;
        }

        const queue: ITask[] = [{
            filePath: baseFile,
            from: 'root'
        }];
        const visited: string[] = []; // 记录已处理过的文件，解决循环依赖
        const baseDir = path.dirname(baseFile);
        let content = '';

        const extractDependency = (dependency: string, dir: string) => {

            const modulePath = this.getModulePath(dependency, dir);

            queue.push({
                filePath: modulePath,
                from: pathExp.test(modulePath) ? 'relative' : 'external'
            });

            if (pathExp.test(dependency)) { // 如果导入的是相对文件，则把路径替换为相对 module
                const mod = this.getRelativeModule(baseFile, modulePath, baseMod);
                content = content.replace(dependency, mod);
            }
        };


        if (!this.injectExtraFlag) { // 外部注入只在第一次注入
            this.extraReferences.forEach(reference => {
                queue.push({ // 注入额外的依赖，必须注入 extraModules 之前，以防止注入到 external module
                    filePath: path.resolve(baseDir, reference),
                    from: 'reference-path'
                });
            });

            this.extraModules.forEach(mod => { // 注入额外的依赖
                extractDependency(mod, baseDir);
            });
            this.injectExtraFlag = true;
        }

        while (queue.length > 0) {

            const task = queue.shift();

            if (!task) {
                break;
            }

            const {
                filePath,
                from
            } = task;

            if (visited.indexOf(filePath) > -1) {
                continue;
            }
            let sourceCode = '';

            if (from === 'external') { // 处理导入的外部 module
                const visited = this.externalVisited.includes(filePath);

                this.externalVisited.push(filePath);
                if (!visited) {
                    this.getExternalModule(filePath);
                }

                continue;
            } else { // 处理导入的内部 module
                const mod = from === 'root' ? baseMod : this.getRelativeModule(baseFile, filePath, baseMod);

                sourceCode = fs.readFileSync(filePath, 'utf8').replace(bomOptExp, '').replace(/\s*$/, '');

                if (from === 'reference-path') {
                    content += `\n ${sourceCode} \n `;
                } else if (from === 'root') {
                    content += `\n declare module "${mod}" { \n ${sourceCode} \n `;
                } else {
                    content += `\n } \n declare module "${mod}" { \n ${sourceCode} \n `;
                }
            }

            let match;
            const references = this.getReferencePaths(sourceCode);
            const dir = path.dirname(filePath);

            while ((match = es6Exp.exec(sourceCode)) !== null) {
                if (match[6]) {
                    extractDependency(match[6], dir);
                }
            }

            while ((match = requireExp.exec(sourceCode)) !== null) {
                if (match[5]) {
                    extractDependency(match[5], dir);
                }
            }

            references.forEach(reference => {
                queue.unshift({ // 如果是 reference 需要放到 queue 头部
                    filePath: path.resolve(dir, reference),
                    from: 'reference-path'
                });
            });

            visited.push(filePath);
        }

        content = content.replace(commentsExp, ''); // remove comments

        return `${content} \n}`;
        // return `declare module "${baseMod}" { ${content} }`;
    }

    private getRelativeModule(fromFile: string, toFile: string, baseMod: string) {
        const fromDir = path.dirname(fromFile);
        const toDir = path.dirname(toFile) + path.sep + path.basename(toFile).replace(/\.d\.ts$/, '');
        const relativePath = path.relative(fromDir, toDir).replace(/\/?index$/, '');

        return `${baseMod}${relativePath && '/'}${relativePath.replace(/\.\./g, '--')}`;
    }

    private getModulePath(file: string, dir: string): string {

        if (!file.startsWith('.')) { // external module
            return file;
        }

        file = path.resolve(dir, file);
        if (!fs.existsSync(file)) { // 尝试查找 xxx.d.ts
            file += '.d.ts';
        }

        if (fs.lstatSync(file).isDirectory()) { // 如果是目录，尝试查找 index.d.ts
            file = path.join(file, 'index.d.ts');
        }

        if (this.types[file]) {
            return this.types[file].code;
        }

        return file;
    }

    private getExternalModule(name: string): string { // get external module types
        const modPath = this.parseExternal(name);
        if (!modPath) {
            return '';
        }
        return this.setType(modPath, name);
    }

    private setType(modPath: string, mod: string): string {
        if (this.types[modPath]) {
            return this.types[modPath].code;
        }

        const code = this.getTypeDependencies(modPath, mod);

        this.types[modPath] = {
            code,
            moduleName: mod
        };

        return code;
    }

    private writeFile(filePath: string, content: string) {
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
            mkdirp.sync(dir);
        }

        fs.writeFileSync(filePath, content, 'utf8');
    }

    private parseExternal(moduleName: string): string {
        // moduleName = this.mapModuleNameToModule(moduleName);

        let modulePath = '';
        let customParseRet: string | boolean = true;

        if (this.customParseExternal) {
            customParseRet = this.customParseExternal(moduleName);
        }
        if (typeof customParseRet === 'string') {
            return customParseRet;
        } else if (customParseRet === false) {
            return '';
        }

        let pkgPath = '';
        try {
            // 先尝试查找 node_modules/@types/moduleName
            pkgPath = require.resolve(this.joinPath('@types', moduleName, 'package.json'));
        } catch (error) {
            // 在查找 node_modules/moduleName
            pkgPath = require.resolve(this.joinPath(moduleName, 'package.json'));
        }

        if (fs.existsSync(pkgPath)) {
            const pkg = require(pkgPath);
            const dstFile = pkg.types || pkg.typings || 'index.d.ts';

            try {
                modulePath = require.resolve(this.joinPath(moduleName, dstFile));
            } catch (error) {
                return '';
            }
        }

        return modulePath;
    }

    private joinPath(...paths: string[]): string {
        const sep = path.sep;
        let joinedPath = paths.shift() as string;

        for (const p of paths) {
            joinedPath = `${joinedPath}${sep}${p}`;
        }

        return joinedPath;
    }

    private mapModuleNameToModule(name: string): string {
        // in node repl:
        // > require("module").builtinModules
        const builtInNodeMods = [
            'assert',
            'async_hooks',
            'base',
            'buffer',
            'child_process',
            'cluster',
            'console',
            'constants',
            'crypto',
            'dgram',
            'dns',
            'domain',
            'events',
            'fs',
            'globals', 'http', 'http2', 'https', 'index',
            'inspector', 'module', 'net', 'os', 'path',
            'perf_hooks', 'process', 'punycode', 'querystring',
            'readline', 'repl', 'stream', 'string_decoder',
            'timers', 'tls', 'trace_events', 'tty', 'url',
            'util', 'v8', 'vm', 'worker_threads', 'zlib'
        ];

        if (builtInNodeMods.includes(name)) {
            return 'node';
        }

        return name;
    }

}
