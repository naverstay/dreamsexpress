var gulp = require('gulp');
var wt = require('gulp-wt');
var sass = require('gulp-sass');
var pug = require('gulp-pug');
var htmlmin = require('gulp-htmlmin');
var plumber = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');

// Development Tasks
// -----------------

// Start browserSync server
gulp.task('browserSync', function () {
    browserSync({
        server: {
            baseDir: 'app',
            port: 3030
        }
    })
})

gulp.task('jade', function () {
    gulp.src(['app/views/*.pug', '!app/views/_*.pug'])
        .pipe(plumber())
        .pipe(pug({
            pretty: true,
            locals: {
                dev: true,
                user: {email: '123@321', data: []},
                all_products: [],
                breadcrumbs: [['Главная', 'Каталог'], ['/', '/catalog']]
            }
        }))
        .pipe(gulp.dest('app/'))
    // .pipe(browserSync.reload({stream: true}))
    ;
})

gulp.task('wt', function () {
    gulp.src('app/scss/main_global.scss')
        .pipe(wt({
            css: 'app/css',
            sass: 'scss'
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('app/css'));
})

gulp.task('sass', function () {
    return gulp.src('app/scss/main_global.scss') // Gets all files ending with .scss in app/scss and children dirs
        .pipe(sass()) // Passes it through a gulp-sass
        .pipe(cssnano()) // Passes it through a gulp-sass
        .pipe(gulp.dest('app/css')) // Outputs it in the css folder
        // .pipe(gulp.dest('app/public')) // Outputs it in the css folder
        // .pipe(browserSync.reload({ // Reloading with Browser Sync
        //     stream: true
        // }))
        ;
})

// Watchers
gulp.task('watch', function () {
    gulp.watch('app/**/*.scss', ['wt']);
    // gulp.watch(['app/**/*.jade', 'app/**/*.pug'], ['jade']);
    gulp.watch('app/js/**/*.js', browserSync.reload);
})

// Optimization Tasks
// ------------------

// Optimizing CSS and JavaScript
gulp.task('useref', function () {
    return gulp.src('app/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulpIf('*.css', cssnano()))
        //.pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('app/'))
        .pipe(gulp.dest('app/public'));
});

// Optimizing Images
gulp.task('images', function () {
    return gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
        .pipe(cache(imagemin({
            interlaced: true,
        })))
        .pipe(gulp.dest('public/images'))
});

// Copying fonts
gulp.task('fonts', function () {
    return gulp.src('app/fonts/**/*')
        .pipe(gulp.dest('public/fonts'))
})

// Copying minified css files
gulp.task('copy_min_css', function () {
    return gulp.src('app/public/css/**/*')
        .pipe(gulp.dest('app/css'))
})

// Copying minified js files
gulp.task('copy_min_js', function () {
    return gulp.src('app/public/js/**/*')
        .pipe(gulp.dest('app/js'))
})

// Cleaning
gulp.task('clean', function () {
    return del.sync('public').then(function (cb) {
        return cache.clearAll(cb);
    });
})

gulp.task('clean:public', function () {
    return del.sync(['public/**/*', '!public/*__', '!public/*__/**/*', '!public/images', '!public/images/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function (callback) {
    runSequence([
            'wt',
            // 'jade',
            // 'browserSync',
            'watch'
        ],
        callback
    )
})

gulp.task('build', function (callback) {
    runSequence(
        'clean:public',
        'wt',
        'jade',
        [
            'useref',
            // 'images',
            // 'fonts'
        ],
        'copy_min_css',
        'copy_min_js',
        callback
    )
})
