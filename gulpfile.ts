import path from 'path';
import minimist from 'minimist';
import isPathCwd from 'is-path-cwd';
import isPathInCwd from 'is-path-in-cwd';
import del from 'del';
import glob from 'glob';
import gulp from 'gulp';
import ts from 'gulp-typescript';
import merge from 'merge2';
import config from './tsconfig.json';

function resolve(p: string): string {
    return path.resolve(process.cwd(), p);
}

const files = [
    'packages/*/src/**/*.ts',
    '!packages/**/__tests__/**'
];

const params = minimist(process.argv.slice(2));

gulp.task('build-ts', () => {

    const realConfig = Object.assign({}, config.compilerOptions, {
        target: 'es2018',
        rootDir: resolve('.'),
        outDir: resolve('dist/ts'),
        declarationDir: resolve('dist/ts')
    });

    const result = gulp.src(files).pipe(ts(realConfig));

    return merge([
        result.js.pipe(gulp.dest('dist/ts')),
        result.dts.pipe(gulp.dest('dist/ts'))
    ]);
});

gulp.task('del-dist', () => del(['dist']));

function createCopyTask(name: string): string[] {
    const dev: boolean = !!params.dev;
    const target: string | void = params.target;
    let p: string;

    if (dev) {
        if (typeof target !== 'string' || target === '') {
            throw new Error('dev mode need target option');
        }

        p = resolve(target);

        if (isPathCwd(p) || isPathInCwd(p)) {
            throw new Error('dev mode need target not in current work dir');
        }
    } else {
        p = resolve('packages');
    }

    const copyJsonTask = `copy-json-${name}`;
    const copyJsTask = `copy-js-${name}`;

    // copy src 下所有非 ts 文件
    gulp.task(copyJsonTask, () => {
        const result = gulp.src([`packages/${name}/src/**/**`, `!packages/${name}/src/**/*.ts`], {
            allowEmpty: true,
            dot: true
        });

        return result.pipe(gulp.dest(p + '/' + name + '/dist'));
    });

    gulp.task(copyJsTask, () => {
        const js = gulp
            .src(['dist/ts/' + name + '/src/**'])
            .pipe(gulp.dest(p + '/' + name + '/dist'));


        if (!dev) {
            return merge([js]);
        }

        const other = gulp
            .src(['packages/' + name + '/package.json'])
            .pipe(gulp.dest(p + '/' + name));

        return merge([js, other]);
    });

    return [copyJsonTask, copyJsTask];
}

const tasks = glob.sync('packages/*').reduce((_tasks: string[], name) => {

    const keys = name.split('/');

    const tasks = createCopyTask(keys[keys.length - 1]);

    return _tasks.concat(...tasks);
}, []);

gulp.task('default', gulp.series(
    'del-dist',
    'build-ts',
    ...tasks
));

gulp.task('watch-ts', () => {
    gulp.watch(files, gulp.series('default'));
});

gulp.task('watch', gulp.series('default', 'watch-ts'));

