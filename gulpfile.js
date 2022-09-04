/**
 * GLOBAL
 */
const gulp = require('gulp'),
    fs = require('fs'),
    browsersync = require('browser-sync'),
    sourcemap = require('gulp-sourcemaps'),
    rename = require('gulp-rename'),
    gulpData = require('gulp-data'),
    rcs = require('gulp-rcs');

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
    postcss = require('gulp-postcss'),
    prefix = require('gulp-autoprefixer'),
    cleanCss = require('gulp-clean-css'),
    decSorter = require('css-declaration-sorter');

/**
 * IMAGES
 */
const minifiyImg = require('gulp-imagemin'),
    convertWebp = require('gulp-webp');

/**
 * DOCUMENTATION
 */
const jsdoc = require('gulp-jsdoc3');

gulp.task('dev', () => {
    browsersync.init({
        server: {
            baseDir: 'dist',
        },
        port: 3010,
        open: true,
    });
    // gulp.watch("src/views/pages/**/*.hbs", gulp.parallel("html"))
    gulp.watch('src/js/**/*.js', gulp.parallel('js'));
    gulp.watch('src/scss/**/*.scss', gulp.parallel('scss'));
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
        .pipe(gulp.dest('./dist/'))
        .pipe(browsersync.stream());
});

gulp.task('js', () => {
    return gulp
        .src('src/js/**/*.js')
        .pipe(sourcemap.init())
        .pipe(terser())
        .pipe(sourcemap.write())
        .pipe(concat('app.min.js'))
        .pipe(gulp.dest('./dist/js'))
        .pipe(browsersync.stream());
});

gulp.task('scss', () => {
    return gulp
        .src('src/scss/**/*.scss')
        .pipe(postcss([decSorter({ order: 'concentric-css' })]))
        .pipe(sourcemap.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCss())
        .pipe(prefix())
        .pipe(sourcemap.write())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('./dist/css'))
        .pipe(browsersync.stream());
});

gulp.task('imgs', () => {
    return gulp
        .src('src/assets/img/**/*')
        .pipe(convertWebp())
        .pipe(minifiyImg())
        .pipe(gulp.dest('./dist/img'));
});

gulp.task('jsdoc', function (cb) {
    const config = require('./jsdoc.config.json');
    gulp.src(['src/js/**/*.js'], { read: false }).pipe(jsdoc(config, cb));

    gulp.src('./assets/jsdoc.favicon.png').pipe(
        gulp.dest('./docs/js_doc/assets/')
    );
});
