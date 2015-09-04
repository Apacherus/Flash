'use strict';
//export PATH="$PATH:$HOME/.npm-packages/bin"
var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    browserify = require('browserify'),
    //source = require("vinyl-source-stream"),
    //reactify = require('reactify'),
    react = require('gulp-react'),
    del = require('del'),
    replace = require('gulp-replace'),
    zip = require('gulp-zip'),
    plumber = require('gulp-plumber');

var runSequence = require('run-sequence');

var path = {
    build: {
        base:'build',
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/',
        data:'build/data'
    },
    dist: {
        tmp:{
            css: 'dist/tmp/css'
        },
        js: 'dist/js',
        css: 'dist/css',
        img: 'dist/img',
        dist: ['dist/js', 'dist/css', 'dist/img'],
        base: 'dist'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/**/*.js',
        style:  'src/css/**/*.css',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*',
        data: 'src/data/**/*.*',
        sass: 'src/sass/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/css/**/*.css',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*',
        data: 'src/data/**/*.*'
    },
    clean: './build'
};

var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: false,
    host: 'localhost',
    port: 9000,
    logPrefix: "Frontend"
};

gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('clean', function (cb) {
    del(path.clean, cb);
});

gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
});



var data = function () {
    gulp.src(path.src.data)
        .pipe(gulp.dest(path.build.data))
        .pipe(reload({stream: true}));
};

gulp.task('data:build', data);

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        //.pipe(browserify())
        //.pipe(reactify)
        .pipe(react())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
});


gulp.task('js:build-prod', function () {
    gulp.src(path.src.js)
        .pipe(rigger())
        //.pipe(browserify())
        //.pipe(reactify)
        .pipe(react())
        //.pipe(sourcemaps.init())
        .pipe(uglify())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
});


gulp.task('sass:build', function(){
    return gulp.src(path.src.sass)
        .pipe(sass({
            sourceMap:true,
            errLogToConsole: true
        }))
        .pipe(gulp.dest(path.dist.tmp.css))
        .pipe(reload({stream:true}));
});

gulp.task('sass:build-prod', function(){
    return gulp.src(path.src.sass)
        .pipe(sass({
            sourceMap:false,
            errLogToConsole: true
        }))
        .pipe(gulp.dest(path.dist.tmp.css))
        .pipe(reload({stream:true}));
});



gulp.task("style-after-sass:build", function() {
    return gulp.src(path.dist.tmp.css)
        .pipe(prefixer({
            browsers: ['last 15 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.init())
        .pipe(cssmin())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

gulp.task("style-after-sass:build-prod", function() {
    return gulp.src(path.dist.tmp.css)
        .pipe(prefixer({
            browsers: ['last 15 versions'],
            cascade: false
        }))
        //.pipe(sourcemaps.init())
        .pipe(cssmin())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});


gulp.task("style:build", function() {
    return gulp.src(path.src.style)
        .pipe(prefixer({
            browsers: ['last 15 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.init())
        .pipe(cssmin())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

gulp.task("style:build-prod", function() {
    return gulp.src(path.src.style)
        .pipe(prefixer({
            browsers: ['last 15 versions'],
            cascade: false
        }))
        //.pipe(sourcemaps.init())
        .pipe(cssmin())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

gulp.task('dist:copy', function(){
    return gulp.src(['dist/**/*.*','!dist/tmp/**/*.*'])
        .pipe(gulp.dest(path.build.base));
});

gulp.task('images:build', function () {
    return gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

gulp.task('fonts:build', function() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('images:copy', function(){
    return gulp.src(path.src.img)
        .pipe(gulp.dest(path.build.img));
});

gulp.task('app-paid-ios', function(cb){
        return gulp.src(['src/index.html','src/index_ru.html'])
            .pipe(replace('_APP_PAID_TYPE_', 'app-paid'))
            .pipe(replace('_APP_PLATFORM_', 'app-iOS'))
            .pipe(gulp.dest('app/iOS/paid'));
});

gulp.task('app-free-ios', function(cb){
    return gulp.src(['src/index.html','src/index_ru.html'])
        .pipe(replace('_APP_PAID_TYPE_', 'app-free'))
        .pipe(replace('_APP_PLATFORM_', 'app-iOS'))
        .pipe(gulp.dest('app/iOS/free'));
});

gulp.task('app-paid-android', function(cb){
    return gulp.src(['src/index.html','src/index_ru.html'])
        .pipe(replace('_APP_PAID_TYPE_', 'app-paid'))
        .pipe(replace('_APP_PLATFORM_', 'app-android'))
        .pipe(gulp.dest('app/android/paid'));
});

gulp.task('app-free-android', function(cb){
    return gulp.src(['src/index.html','src/index_ru.html'])
        .pipe(replace('_APP_PAID_TYPE_', 'app-free'))
        .pipe(replace('_APP_PLATFORM_', 'app-android'))
        .pipe(gulp.dest('app/android/free'));
});

gulp.task('zip-android-free', function(){
   return gulp.src('app/android/free/**/*.*')
       .pipe(zip('android-free.zip'))
       .pipe(gulp.dest('app/'));
});

gulp.task('zip-android-paid', function(){
    return gulp.src('app/android/paid/**/*.*')
        .pipe(zip('android-paid.zip'))
        .pipe(gulp.dest('app/'));
});

gulp.task('zip-ios-paid', function(){
    return gulp.src('app/iOS/paid/**/*.*')
        .pipe(zip('iOS-paid.zip'))
        .pipe(gulp.dest('app/'));
});

gulp.task('zip-ios-free', function(){
    return gulp.src('app/iOS/free/**/*.*')
        .pipe(zip('iOS-free.zip'))
        .pipe(gulp.dest('app/'));
});


gulp.task('ios-free-copy', function(){
    return gulp.src('build/**/*.*')
        .pipe(gulp.dest('app/iOS/free'));
});


gulp.task('ios-paid-copy', function(){
    return gulp.src('build/**/*.*')
        .pipe(gulp.dest('app/iOS/paid'));
});

gulp.task('android-free-copy', function(){
    return gulp.src('build/**/*.*')
        .pipe(gulp.dest('app/android/free'));
});


gulp.task('android-paid-copy', function(){
    return gulp.src('build/**/*.*')
        .pipe(gulp.dest('app/android/paid'));
});



gulp.task('pre-build', function(cb){
    runSequence('build', cb);
});

gulp.task('paid', function(cb){
    runSequence('clean', 'build-prod', 'app-paid', cb);
});

gulp.task('free', function(cb){
    runSequence('clean', 'build-prod', 'app-free', cb);
});

gulp.task('build', [
    'data:build',
    'html:build',
    'js:build',
    'sass:build',
    'style-after-sass:build',
    'style:build',
    'fonts:build',
    'images:build',
    'dist:copy',
    'webserver',
    'watch'
]);

gulp.task('build-prod', [
    'data:build',
    'html:build',
    'js:build-prod',
    'sass:build-prod',
    'style-after-sass:build-prod',
    'style:build-prod',
    'fonts:build',
    'images:build',
    'dist:copy'
]);

gulp.task('zip', [
    'zip-android-free',
    'zip-android-paid',
    'zip-ios-free',
    'zip-ios-paid'
]);

gulp.task('build-prod-ios-free', function(cb){
    return runSequence('build-prod', 'ios-free-copy', 'app-free-ios',  cb);
});

gulp.task('build-prod-ios-paid', function(cb){
    return runSequence('build-prod', 'ios-paid-copy', 'app-paid-ios',  cb);
});

gulp.task('build-prod-android-free', function(cb){
    return runSequence('build-prod', 'android-free-copy', 'app-free-android',  cb);
});

gulp.task('build-prod-android-paid', function(cb){
    return runSequence('build-prod', 'android-paid-copy', 'app-paid-android',  cb);
});

gulp.task('prod', function(cb){
    return runSequence('clean', 'build-prod-ios-free','build-prod-ios-paid','build-prod-android-free','build-prod-android-paid', 'zip',cb);
});


gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.src.sass], function(event, cb) {
        gulp.start('sass:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('images:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
    watch([path.watch.data], function(event, cb) {
        gulp.start('data:build');
    });
    watch([path.dist.base], function(event, cb) {
        gulp.start('dist:copy');
    });
});


gulp.task('default', ['pre-build']);
gulp.task('prodX', ['build-prod']);