var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');
var dateFilter = require('nunjucks-date-filter');

gulp.task('build', function () {
  var manageEnvironment = function(environment) {
    dateFilter.setDefaultFormat('Do MMMM YYYY');
    environment.addFilter('date', dateFilter);
  }
    
  return gulp.src('templates/*.amp.html')
    .pipe(data(function() {
      return require('./data.json')
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
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.watch('templates', gulp.series('build'));
});

gulp.task('default', gulp.series('build', 'watch'));
