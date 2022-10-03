/* eslint-disable no-return-assign */
/**
 * GLOBAL
 */
const gulp = require('gulp');
const fs = require('fs');
const browsersync = require('browser-sync');
const sourcemap = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const gulpData = require('gulp-data');
const clean = require('gulp-clean');

/**
 * HANDLEBARS - HTML
 */
const hbsCompiler = require('gulp-compile-handlebars');
const handlebarsHelper = require('./src/views/handlebars');
const htmlMin = require('gulp-htmlmin');

/**
 * JAVASCRIPT
 */
const terser = require('gulp-terser');
const concat = require('gulp-concat');

/**
 * SCSS
 */
const sass = require('gulp-sass')(require('sass'));
const prefix = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');

/**
 * IMAGES
 */
const minifiyImg = require('gulp-imagemin');
const convertWebp = require('gulp-webp');

/**
 * DOCUMENTATION
 */
const jsdoc = require('gulp-jsdoc3');
const jsdocConfig = require('./jsdoc.config.json');

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
    gulp.watch(['src/views/**/*.hbs', 'src/assets/data/**/*.json'], gulp.parallel('html'));
    gulp.watch('src/js/**/*.js', gulp.parallel('js'));
    gulp.watch('src/scss/**/*.scss', gulp.parallel('scss'));
    gulp.watch('src/assets/img/**/*', gulp.parallel('img'));
});

gulp.task('html', () =>
    gulp
        .src('src/views/pages/**/*.hbs')
        .pipe(
            gulpData(() => {
                const dataDir = './src/assets/data/';
                let data;
                fs.readdirSync(dataDir).forEach(file => {
                    data = JSON.parse(fs.readFileSync(dataDir + file));
                });
                return data;
            })
        )
        .pipe(
            hbsCompiler(
                { handlebars: handlebarsHelper },
                // eslint-disable-next-line no-undef
                (options = {
                    batch: ['./src/views/partials/', './src/views/layout/'],
                })
            )
        )
        .pipe(rename({ extname: '.html' }))
        .pipe(gulp.dest('./dev/'))
        .pipe(browsersync.stream())
);

gulp.task('js', () =>
    gulp
        .src('src/js/**/*.js')
        .pipe(sourcemap.init())
        .pipe(sourcemap.write())
        .pipe(concat('app.min.js'))
        .pipe(gulp.dest('./dev/js'))
        .pipe(browsersync.stream())
);

gulp.task('scss', () =>
    gulp
        .src('src/scss/**/*.scss')
        .pipe(sourcemap.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemap.write())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('./dev/css'))
        .pipe(browsersync.stream())
);

gulp.task('img', () =>
    gulp
        .src('src/assets/img/**/*')
        .pipe(convertWebp())
        .pipe(minifiyImg())
        .pipe(gulp.dest('./dev/assets/images'))
);

gulp.task('jsdoc', cb => {
    gulp.src(['src/js/**/*.js'], { read: false }).pipe(jsdoc(jsdocConfig, cb));

    gulp.src('./assets/jsdoc.favicon.png').pipe(gulp.dest('./docs/js_doc/assets/'));
});

gulp.task('clear-dev', () => gulp.src('./dev/', { read: false }).pipe(clean()));

gulp.task('clear-dist', () => gulp.src('./dist/', { read: false }).pipe(clean()));

gulp.task('clear-docs', () => gulp.src('./docs/', { read: false }).pipe(clean()));

gulp.task('build', () => {
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

    gulp.src('./dev/**/*.css').pipe(cleanCss()).pipe(prefix()).pipe(gulp.dest('./dist/css'));

    gulp.src('./dev/**/*.js').pipe(terser()).pipe(gulp.dest('./dist/js'));

    return gulp
        .src('./dev/**/*(?:jpg|png|jpeg)')
        .pipe(convertWebp())
        .pipe(minifiyImg())
        .pipe(gulp.dest('./dist/assets/images'));
});

gulp.task('dev', gulp.series(gulp.parallel('html', 'js', 'scss', 'img', 'sync', 'watch')));
