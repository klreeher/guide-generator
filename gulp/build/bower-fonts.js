var gulp = require('gulp'),
    config = require('../../gulp.config'),
    flatten = require('gulp-flatten'),
    concat = require('gulp-concat'),
    del = require('del');

gulp.task('clean:bower-fonts', function() {
    return del(config.build + config.appFonts);
});

gulp.task('bower-fonts', ['clean:bower-fonts'], function() {
    return gulp
        .src([].concat(
            config.bowerFiles + '*/fonts/**/*',
            config.src + config.appFonts + '**/*'
        ))
        .pipe(flatten())
        .pipe(gulp.dest(config.build + config.appFonts))
});
