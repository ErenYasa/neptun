/**
 * GLOBAL
 */
const gulp = require('gulp'),
    fs = require('fs'),
    browsersync = require('browser-sync'),
    sourcemap = require('gulp-sourcemaps'),
    rename = require('gulp-rename'),
    gulpData = require('gulp-data'),
    clean = require('gulp-clean');

/**
 * HANDLEBARS - HTML
 */
const hbsCompiler = require('gulp-compile-handlebars'),
    handlebarsHelper = require('./src/views/handlebars'),
    htmlMin = require('gulp-htmlmin');

/**
 * JAVASCRIPT
 */
const terser = require('gulp-terser'),
    concat = require('gulp-concat');

/**
 * SCSS
 */
const sass = require('gulp-sass')(require('sass')),
    prefix = require('gulp-autoprefixer'),
    cleanCss = require('gulp-clean-css');

/**
 * IMAGES
 */
const minifiyImg = require('gulp-imagemin'),
    convertWebp = require('gulp-webp');

/**
 * DOCUMENTATION
 */
const jsdoc = require('gulp-jsdoc3');

gulp.task('sync', () => {
    browsersync.init({
        server: {
            baseDir: 'dev',
        },
        port: 3010,
        open: true,
    });
});

gulp.task('watch', () => {
    gulp.watch(
        ['src/views/**/*.hbs', 'src/assets/data/**/*.json'],
        gulp.parallel('html')
    );
    gulp.watch('src/js/**/*.js', gulp.parallel('js'));
    gulp.watch('src/scss/**/*.scss', gulp.parallel('scss'));
    gulp.watch('src/assets/img/**/*', gulp.parallel('img'));
});

gulp.task('html', () => {
    return gulp
        .src('src/views/pages/**/*.hbs')
        .pipe(
            gulpData(function () {
                const dataDir = './src/assets/data/';
                let data;
                fs.readdirSync(dataDir).forEach((file) => {
                    data = JSON.parse(fs.readFileSync(dataDir + file));
                });
                return data;
            })
        )
        .pipe(
            hbsCompiler(
                { handlebars: handlebarsHelper },
                (options = {
                    batch: ['./src/views/partials/', './src/views/layout/'],
                })
            )
        )
        .pipe(rename({ extname: '.html' }))
        .pipe(gulp.dest('./dev/'))
        .pipe(browsersync.stream());
});

gulp.task('js', () => {
    return gulp
        .src('src/js/**/*.js')
        .pipe(sourcemap.init())
        .pipe(sourcemap.write())
        .pipe(concat('app.min.js'))
        .pipe(gulp.dest('./dev/js'))
        .pipe(browsersync.stream());
});

gulp.task('scss', () => {
    return gulp
        .src('src/scss/**/*.scss')
        .pipe(sourcemap.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemap.write())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('./dev/css'))
        .pipe(browsersync.stream());
});

gulp.task('img', () => {
    return gulp
        .src('src/assets/img/**/*')
        .pipe(convertWebp())
        .pipe(minifiyImg())
        .pipe(gulp.dest('./dev/assets/images'));
});

gulp.task('jsdoc', function (cb) {
    const config = require('./jsdoc.config.json');
    gulp.src(['src/js/**/*.js'], { read: false }).pipe(jsdoc(config, cb));

    gulp.src('./assets/jsdoc.favicon.png').pipe(
        gulp.dest('./docs/js_doc/assets/')
    );
});

gulp.task('clear-dev', function () {
    return gulp.src('./dev/', { read: false }).pipe(clean());
});

gulp.task('clear-dist', function () {
    return gulp.src('./dist/', { read: false }).pipe(clean());
});

gulp.task('build', function () {
    gulp.src('./dev/**/*.html')
        .pipe(
            htmlMin({
                collapseWhitespace: true,
                removeComments: true,
                removeCommentsFromCDATA: true,
                minifyJS: false,
                minifyCSS: false,
                ignoreCustomFragments: [/{{[\s\S]*?}}/],
            })
        )
        .pipe(gulp.dest('./dist/'));

    gulp.src('./dev/**/*.css')
        .pipe(cleanCss())
        .pipe(prefix())
        .pipe(gulp.dest('./dist/css'));

    gulp.src('./dev/**/*.js').pipe(terser()).pipe(gulp.dest('./dist/js'));

    return gulp
        .src('./dev/**/*(?:jpg|png|jpeg)')
        .pipe(convertWebp())
        .pipe(minifiyImg())
        .pipe(gulp.dest('./dist/assets/images'));
});

gulp.task(
    'dev',
    gulp.series(gulp.parallel('html', 'js', 'scss', 'img', 'sync', 'watch'))
);
