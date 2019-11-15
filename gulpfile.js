/* Dependencies */
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const autoprefixer = require('gulp-autoprefixer');
const fileinclude = require('gulp-file-include');
const sass = require('gulp-sass');
const filter = require('gulp-filter')
const minimist = require('minimist');
const del = require('del');
const gulpAmpValidator = require('gulp-amphtml-validator');
const bs = require('browser-sync').create();
const autoScript = require('amphtml-autoscript').create();
const reload = bs.reload;
const nodemon = require('gulp-nodemon');
const replace = require('gulp-replace');
const noop = require('gulp-noop');
const mergeMediaQuery = require('gulp-merge-media-queries');

const nunjucksRender = require('gulp-nunjucks-render');
const data = require('gulp-data');
const dateFilter = require('nunjucks-date-filter');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const jeditor = require('gulp-json-editor');
const request = require('request');
const source = require('vinyl-source-stream');
const streamify = require('gulp-streamify');
const querystring = require('querystring');

const destination = 'ravramas.github.io'

gulp.task('build', function () {
    var manageEnvironment = function (environment) {
        dateFilter.setDefaultFormat('Do MMMM YYYY');
        environment.addFilter('date', dateFilter);
    }

    return gulp.src('templates/product-listing.amp.html')
        .pipe(data(function () {
            const data = require('./data.json')
            data.initial_list = require('./templates/partials/api/initial_list.json');
            return data
        }))
        .pipe(nunjucksRender({
            path: ['templates/'],
            envOptions: {
                tags: {
                    // blockStart: '<%',
                    // blockEnd: '%>',
                    variableStart: '<$',
                    variableEnd: '$>',
                    commentStart: '<#',
                    commentEnd: '#>'
                }
            },
            manageEnv: manageEnvironment
        }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyJS: true,
            minifyCSS: true,
            removeComments: true,
            sortClassName: true
        }))
        .pipe(autoScript())
        .pipe(rename('index.html'))
        .pipe(gulp.dest(destination));
});

// gulp.task('watch', function() {
//   gulp.watch('templates', gulp.series('build'));
// });


// Build type is configurable such that some options can be changed e.g. whether
// to minimise CSS. Usage 'gulp <task> --env development'.
const knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'dist' }
};

const options = minimist(process.argv.slice(2), knownOptions);

const paths = {
    css: {
        src: 'src/sass/**/*.scss',
        dest: 'src/css/'
    },
    html: {
        src: 'src/html/pages/*.html',
        dest: 'dist/'
    },
    images: {
        src: 'img/**/*.{gif,jpg,png,svg}',
        dest: destination + '/img'
    },
    // favicon: {
    //     src: 'src/favicon/*',
    //     dest: 'dist/'
    // },
    // rootConfig: {
    //     src: 'src/rootConfigFiles/*',
    //     dest: 'dist/'
    // },
    // server: {
    //     src: 'src/server/**/*',
    //     dest: 'dist/server'
    // }
};

/**
 * Builds the styles, bases on SASS files taken from src. The resulting CSS is
 * used as partials that are included in the final AMP HTML.
 * When SASS sees a non-ASCII character in a file, it starts the CSS file it builds with "@charset "UTF-8";".
 * That's great in CSS files, but not accepted within <style> tags.
 * So unless the SASS team takes on https://github.com/sass/sass/issues/2288, we need to remove it.
 */

// gulp.task('styles', function buildStyles() {
//     const cssEncodingDirective = '@charset "UTF-8";';

//     return gulp.src(paths.css.src)
//         .pipe(plumber())
//         .pipe(sass(options.env === 'dist' ? { outputStyle: 'compressed' } : {}))
//         .pipe(options.env === 'dev' ? replace(cssEncodingDirective, '') : noop())
//         .pipe(autoprefixer('last 10 versions'))
//         .pipe(mergeMediaQuery({log: true}))
//         .pipe(cleanCSS({compatibility: 'ie8'}))
//         .pipe(concat('normalize.css'))
//         .pipe(gulp.dest('templates/partials'))
//         // .pipe(gulp.dest(paths.css.dest));
// });

gulp.task('styles-build-normalize', function buildStyles() {
    return gulp.src('templates/partials/normalize_original.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename('normalize.css'))
        .pipe(gulp.dest('templates/partials'))
});

gulp.task('styles-build-boilerplate', function buildStyles() {
    return gulp.src('templates/partials/boilerplate_original.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename('boilerplate.css'))
        .pipe(gulp.dest('templates/partials'))
});

gulp.task('styles', gulp.series('styles-build-normalize', 'styles-build-boilerplate'));

/**
 * Copies the images to the distribution.
 */
gulp.task('images', function buildImages() {
    return gulp.src(paths.images.src)
        .pipe(gulp.dest(paths.images.dest));
});

const apiUrl = 'http://localhost:3000/'
const headers = { 'User-Agent': 'request' }

// const categories = requireJSON('categories');
gulp.task('move-apis', function buildImages() {
    return gulp.src('templates/api/*.json')
        .pipe(gulp.dest(destination + '/api'));
});

gulp.task('initial_list', function () {
    const query = {
        '_sort': 'price',
        '_order': 'desc',
        '_limit': 20,
        'price_lte': 5
    }
    return request({
        url: apiUrl + 'all?' + querystring.stringify(query),
        headers
    })
        .pipe(source('initial_list.json'))
        .pipe(streamify(jeditor(({ items }) =>
            items.map(({
                name,
                description,
                price,
                url,
                image,
                source
            }) => ({
                name,
                description,
                price,
                url,
                image,
                source
            })
            ))))
        .pipe(gulp.dest('templates/partials/api'));
});

/**
 * Copies the favicon to the distribution.
 */
// gulp.task('favicon', function buildImages() {
//     return gulp.src(paths.favicon.src)
//         .pipe(gulp.dest(paths.favicon.dest));
// });

/**
 * Copies the root config files to the distribution.
 */
// gulp.task('rootConfig', function buildImages() {
//     return gulp.src(paths.rootConfig.src)
//         .pipe(gulp.dest(paths.rootConfig.dest));
// });


/**
 * Copies the server and helper classes to the distribution.
 */
// gulp.task('server', function buildImages() {
//     return gulp.src(paths.server.src)
//         .pipe(gulp.dest(paths.server.dest));
// });

/**
 * Builds the HTML files. Only files from 'pages' are built, such that partials
 * are ignored as targets.
 */
// gulp.task('html', gulp.series('styles', function buildHtml() {
//     const pageFilter = filter(['**/pages/*.html']);
//     return gulp.src(paths.html.src)
//         .pipe(pageFilter)
//         .pipe(fileinclude({
//             prefix: '%%',
//             basepath: '@file'
//         }))
//         .pipe(autoScript())
//         .pipe(gulp.dest(paths.html.dest));
// }));

/**
 * Checks resulting output AMP HTML for validity.
 */
gulp.task('validate', function validate() {
    return gulp.src(paths.html.dest + '/*.amp.html')
        .pipe(gulpAmpValidator.validate())
        .pipe(gulpAmpValidator.format())
        .pipe(gulpAmpValidator.failAfterError());
});

/**
 * Removes all files from the distribution directory, and also the CSS build
 * directory.
 */
// gulp.task('clean', function clean() {
//     return del([
//         paths.html.dest + '/**/*',
//         paths.css.dest + '/**/*'
//     ]);
// });

/**
 * Builds the output from sources.
 */
// gulp.task('build', gulp.series('images', 'favicon', 'rootConfig', 'html', 'server', 'validate'));

/**
 * First rebuilds the output then triggers a reload of the browser.
 */
gulp.task('rebuild', gulp.series('build', function rebuild(done) {
    bs.reload();
    done();
}));

/**
 * Sets up the live browser sync.
 */
/* 
gulp.task('serve', function sync(done) {
    bs.init({
        server: {
            baseDir: 'dist/'
        }
    });
    done();
});

gulp.task('browser-sync', function sync(done) {
    bs.init(null, {
        proxy: "http://localhost:8080", // port of node server
    });
    done();
});

gulp.task('nodemon', function (cb) {
    var callbackCalled = false;
    return nodemon({script: './server/web_server.js'}).on('start', function () {
        if (!callbackCalled) {
            callbackCalled = true;
            cb();
        }
    });
});
*/
/**
 * Sets up live-reloading: Changes to HTML or CSS trigger a rebuild, changes to
 * images, favicon, root config files and server only result in images, favicon, root config files, server and helper classes being copied again to dist.
 */
gulp.task('watch', function watch(done) {
    // gulp.watch(paths.images.src, gulp.series('images'));
    // gulp.watch(paths.favicon.src, gulp.series('favicon'));
    // gulp.watch(paths.rootConfig.src, gulp.series('rootConfig'));
    // gulp.watch(paths.server.src, gulp.series('server'));
    gulp.watch('templates/*.amp..html', gulp.series('rebuild'));
    gulp.watch('templates/**/*', gulp.series('rebuild'))
    // gulp.watch(paths.css.src, gulp.series('rebuild'));
    done();
});

/**
 * Prepares a clean build.
 */
// gulp.task('prepare', gulp.series('clean', 'build'));

/**
 * Default task is to perform a clean build then set up browser sync for live
 * reloading.
 */
// gulp.task('default', gulp.series('build', 'nodemon', 'browser-sync', 'watch'));
gulp.task('default', gulp.series('styles', 'build', 'images', 'watch'));