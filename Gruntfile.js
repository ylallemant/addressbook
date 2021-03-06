module.exports = function(grunt) {

  // load all grunt tasks matching the `grunt-*` pattern
  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('test', ['mochaTest']);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['package.json', 'Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
    },
    watch: {
      scripts: {
        files: '**/*.js',
        tasks: ['default'],
        options: {
          livereload: true
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          bail: true,
          "no-exit": true,
          reporter: 'dot'
        },
        src: ['test/**/*.spec.js']
      }
    }
  });
};