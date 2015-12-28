var path = require('path');
var gulp = require('gulp');
var debug = require('gulp-debug');
var gutil = require('gulp-util');
var babel = require("gulp-babel");
var uglify = require('gulp-uglify');
var htmllint = require('gulp-htmllint');
var htmlmin = require('gulp-htmlmin');
var csslint = require('gulp-csslint');
var minifyCss = require('gulp-cssnano');
var eslint = require('gulp-eslint');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var isparta = require('isparta');
var excludeGitignore = require('gulp-exclude-gitignore');
var del = require('del');

gulp.task('process-html', function () {
  return gulp.src('src/views/**/*.html')
    .pipe(excludeGitignore())
    .pipe(htmllint({}, htmllintReporter))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('views'));
});

gulp.task('process-css', function () {
  return gulp.src(['src/css/**/*.css', '!src/css/*.min.css'])
    .pipe(excludeGitignore())
    .pipe(csslint())
    .pipe(csslint.reporter())
    .pipe(minifyCss())
    .pipe(gulp.dest('css'));
});

gulp.task('jslint', function () {
  return gulp.src(['src/js/**/*.js', '!node_modules/**', '!coverage/**'])
    .pipe(excludeGitignore())
    .pipe(debug({ title: 'linting:' }))
    .pipe(eslint({extends: 'eslint:recommended',
        ecmaFeatures: {
            'modules': true
        }, envs: [
            'browser', 'node' , 'commonjs', 'mocha', 'jquery', 'es6', 'shelljs'
        ]}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())    
    .pipe(babel())
    .pipe(uglify({
      mangle: true
    }))
    .pipe(gulp.dest('js'));
});

gulp.task('nsp', function (cb) {
  nsp({ package: path.resolve('package.json') }, cb);
});

gulp.task('clean', function () {
  return del(['js', 'views', 'css']);
});

function htmllintReporter(filepath, issues) {
  if (issues.length > 0) {
    issues.forEach(function (issue) {
      gutil.log(gutil.colors.cyan('[gulp-htmllint] ') + gutil.colors.white(filepath + ' [' + issue.line + ',' + issue.column + ']: ') + gutil.colors.red('(' + issue.code + ') ' + issue.msg));
    });

    process.exitCode = 1;
  }
}

gulp.task('pre-test', function () {
  return gulp.src(['src/js/**/*.js'])
  // Covering files
    .pipe(istanbul({ includeUntested: true,
      instrumenter: isparta.Instrumenter }))
  // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src(['tests/**/*.js'])
    .pipe(plumber())
    .pipe(mocha({ reporter: 'spec' }))
    .on('error', function (err) {
      console.error(err);
    })
  // Creating the reports after tests ran
    .pipe(istanbul.writeReports());
  // Enforce a coverage of at least 90%
  //  .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
});

gulp.task('default', ['clean', 'jslint', 'nsp', 'process-html', 'process-css', 'test']);
