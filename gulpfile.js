var gulp = require('gulp'),
    zip = require('gulp-zip');

gulp.task('build', function () {
  gulp.src('src/*')
    .pipe(zip('image-plus.zip'))
    .pipe(gulp.dest('build'));
});

gulp.task('default', ['build']);
