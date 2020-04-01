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
    // entry 对应的 module
    moduleName: string;
    // .d.ts 入口文件
    entry: string;
    // 项目地址，需要时绝对路径，如果是相对路径，会相对 process.cwd 来转为绝对路径
    projectDir: string;
    // 生成的类型文件地址
    out: string;
    // 指定生成的 ts 文件路径，方便查看调试
    debugOut?: string;
    // 其他的 modules 会一起合并到最终生成的类型文件里
    extraModules?: string[];
    // 其他的 reference 会一起合并到最终生成的类型文件里
    extraReferences?: string[];
    // 解析外部依赖模块的路径，返回 false 跳过该 module，否则返回 module 的 .d.ts 绝对路径
    parseExternal?: (moduleName: string) => string | boolean;
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

    protected types: ITypes = {};

    protected entry: string;

    protected projectDir: string;

    protected out: string;

    protected debugOut?: string;

    protected moduleName: string;

    protected extraModules: string[];

    protected extraReferences: string[];

    protected injectExtraFlag = false; // 是否已经注入的标志

    protected customParseExternal?: (moduleName: string) => string | boolean;

    protected externalVisited: string[] = []; // 记录已处理过的外部依赖，避免循环依赖

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

        this.projectDir = path.isAbsolute(projectDir) ? projectDir : path.resolve(process.cwd(), projectDir);
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

            Object.entries(this.types).forEach(([modulePath, types]) => {
                allTypes += `\n
//@module_path ${modulePath}
//@module_name ${types.moduleName}
${types.code}
                `;
            });
            this.writeFile(this.debugOut, allTypes);
        }

        this.writeFile(this.out, JSON.stringify(Object.values(this.types)));
    }

    protected getReferencePaths(input: string) {
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

    protected getTypeDependencies(baseFile: string, baseMod: string): string {

        if (this.types[baseFile]) {
            return this.types[baseFile].code;
        }

        const queue: ITask[] = [{
            filePath: baseFile,
            from: 'root'
        }];
        const visited: string[] = []; // 记录已处理过的文件，避免循环依赖
        const baseDir = path.dirname(baseFile);
        let content = '';

        const extractDependency = (dependency: string, dir: string) => {
            console.log(chalk.green(`extract dependency: ${dependency}`));

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
                const referencePath = path.resolve(dir, reference);
                console.log(chalk.green(`extract reference: ${reference} ${referencePath}`));

                queue.unshift({ // 如果是 reference 需要放到 queue 头部
                    filePath: referencePath,
                    from: 'reference-path'
                });
            });

            visited.push(filePath);
        }

        content = content.replace(commentsExp, ''); // remove comments

        return `${content} \n}`;
        // return `declare module "${baseMod}" { ${content} }`;
    }

    protected getRelativeModule(fromFile: string, toFile: string, baseMod: string) {
        const fromDir = path.dirname(fromFile);
        const toDir = path.dirname(toFile) + path.sep + path.basename(toFile).replace(/\.d\.ts$/, '');
        const relativePath = path.relative(fromDir, toDir).replace(/\/?index$/, '');

        return `${baseMod}${relativePath && '/'}${relativePath.replace(/\.\./g, '--')}`;
    }

    protected getModulePath(file: string, dir: string): string {

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

    protected getExternalModule(name: string): string { // get external module types
        const modPath = this.parseExternal(name);
        if (!modPath) {
            return '';
        }
        console.log(chalk.green(`get external module: ${name} ${modPath}`))

        return this.setType(modPath, name);
    }

    protected setType(modPath: string, mod: string): string {
        if (this.types[modPath]) {
            return this.types[modPath].code;
        }

        const code = this.getTypeDependencies(modPath, mod);

        this.types[modPath] = {
            code,
            moduleName: mod
        };
        console.log(chalk.green(`extract type: ${mod}`))

        return code;
    }

    protected writeFile(filePath: string, content: string) {
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
            mkdirp.sync(dir);
        }

        fs.writeFileSync(filePath, content, 'utf8');
    }

    protected parseExternal(moduleName: string): string {
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
        let typesModuleName = moduleName;
        try {
            // 先尝试查找 node_modules/@types/moduleName
            pkgPath = this.resolvePath('@types', moduleName, 'package.json');
            typesModuleName = `@types/${moduleName}`;
        } catch (error) {
            // 在查找 node_modules/moduleName
            pkgPath = this.resolvePath(moduleName, 'package.json');
        }

        const pkg = require(pkgPath);
        let dstFile = pkg.types || pkg.typings || 'index.d.ts';
        if (!path.extname(dstFile)) {
            dstFile += '.d.ts';
        }

        const joinedPath = this.joinPath(typesModuleName, dstFile);

        try {
            modulePath = this.resolvePath(joinedPath);
        } catch (error) {
            console.log(chalk.red(`can not find module ${joinedPath}`))
            return '';
        }

        return modulePath;
    }

    protected resolvePath(...paths: string[]): string {
        const joinedPath = this.joinPath(...paths);

        return require.resolve(joinedPath, {
            paths: [this.projectDir]
        });
    }

    protected joinPath(...paths: string[]): string {
        let joinedPath = paths.shift() as string;

        for (const p of paths) {
            joinedPath = `${joinedPath}/${p}`;
        }

        return joinedPath;
    }

    protected mapModuleNameToModule(name: string): string {
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
