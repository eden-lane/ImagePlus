var gulp = require('gulp'),
    zip = require('gulp-zip'),
    debug = require('gulp-debug');

var files = [
  'src/**',
  '!src/*.dev*'
];

gulp.task('build', function () {
  gulp.src(files)
    .pipe(zip('image-plus.zip'))
    .pipe(gulp.dest('build'));
});

gulp.task('default', ['build']);
