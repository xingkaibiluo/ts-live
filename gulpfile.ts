import path from 'path';
import minimist from 'minimist';
import isPathCwd from 'is-path-cwd';
import isPathInCwd from 'is-path-in-cwd';
import glob from 'glob';
import gulp from 'gulp';
import ts from 'gulp-typescript';
import less from 'gulp-less';
import minifyCss from 'gulp-minify-css';
import rename from 'gulp-rename';
import merge from 'merge2';
import config from './tsconfig.json';

const babel = require('gulp-babel');
const clean = require('gulp-clean');

function resolve(p: string): string {
    return path.resolve(process.cwd(), p);
}

const files = [
    'packages/*/src/**/*.ts',
    'packages/*/src/**/*.tsx',
    '!packages/**/__tests__/**'
];

const params = minimist(process.argv.slice(2));

gulp.task('build-ts', () => {

    const realConfig = Object.assign({}, config.compilerOptions, {
        module: 'esnext',
        target: 'es2018',
        rootDir: resolve('.'),
        outDir: resolve('dist/ts'),
        declaration: true,
        declarationDir: resolve('dist/ts')
    });

    const result = gulp.src(files).pipe(ts(realConfig));

    return merge([
        result.js.pipe(gulp.dest('dist/ts')),
        result.dts.pipe(gulp.dest('dist/js'))
    ]);
});

gulp.task('build-js', () => {

    let stream = gulp
        .src(['dist/ts/**'])
        .pipe(babel({
            presets: [
                [
                    '@babel/preset-env',
                    {
                        modules: 'commonjs',
                        targets: {
                            browsers: [
                                '> 1%',
                                'last 2 versions',
                                'not ie <= 8'
                            ]
                        }
                    }
                ],
                '@babel/preset-react'
            ],
            plugins: [
                [
                    '@babel/plugin-proposal-class-properties',
                    {
                        loose: false
                    }
                ]
            ]
        }));

    return stream.pipe(gulp.dest('dist/js'));
});

gulp.task('build-css', () => {

    const cssComponent = gulp
        .src('packages/*/style/index.less', {base: 'packages'})
        .pipe(less())
        .pipe(minifyCss())
        .pipe(rename(p => p.extname = '.css'))
        .pipe(gulp.dest('dist/style'));

    return merge([
        cssComponent
    ]);
});


gulp.task('clean', () => {
    return gulp.src([
        './dist/*',
        // 删除编译后的文件
        `./packages/*/dist`,
        `./packages/*/style/*.css`
    ]).pipe(clean({force: true}));
});

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
    const copyCssTask = `copy-css-${name}`;

    // copy src 下所有非 ts、less 文件
    gulp.task(copyJsonTask, () => {
        const result = gulp.src([
            `packages/${name}/src/**/**`,
            `!packages/${name}/src/**/*.ts`,
            `!packages/${name}/src/**/style/**`
        ], {
            allowEmpty: true,
            dot: true
        });

        return result.pipe(gulp.dest(p + '/' + name + '/dist'));
    });

    gulp.task(copyJsTask, () => {
        const js = gulp
            .src(['dist/js/' + name + '/src/**'])
            .pipe(gulp.dest(p + '/' + name + '/dist'));


        if (!dev) {
            return merge([js]);
        }

        const other = gulp
            .src(['packages/' + name + '/package.json'])
            .pipe(gulp.dest(p + '/' + name));

        return merge([js, other]);
    });

    gulp.task(copyCssTask, () => {
        const css = gulp
            .src(['dist/style/' + name + '/style/**'])
            .pipe(gulp.dest(p + '/' + name + '/style'));

        return merge([css]);
    });

    return [copyJsonTask, copyJsTask, copyCssTask];
}

const tasks = glob.sync('packages/*').reduce((_tasks: string[], name) => {

    const keys = name.split('/');

    const tasks = createCopyTask(keys[keys.length - 1]);

    return _tasks.concat(...tasks);
}, []);

gulp.task('default', gulp.series(
    'clean',
    'build-ts',
    'build-js',
    'build-css',
    ...tasks
));

gulp.task('watch-ts', () => {
    gulp.watch(files, gulp.series('default'));
});

gulp.task('watch', gulp.series('default', 'watch-ts'));

