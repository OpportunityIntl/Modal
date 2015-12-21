module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/* <%= pkg.name %> v<%= pkg.version %> \n' +
      ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %> \n */\n',
    
    sass: {
      dev: {
        options: {
          style: 'expanded'
        },
        files: {
          'dist/OI.modal.css' : 'sass/OI.modal.scss'
        }
      },
      production: {
        options: {
          style: 'compact',
          sourcemap: 'none',
          banner: '<%= banner %>'
        },
        files: {
          'dist/OI.modal.min.css' : 'sass/OI.modal.scss'
        }
      }
    },
    
    uglify: {
      production: {
        options: {
          banner: '<%= banner %>'
        },
        files: {
          'dist/OI.modal.min.js': ['js/OI.modal.js'],
          'dist/OI.lightbox.min.js': ['js/OI.lightbox.js']
        }
      }
    },
    
    watch: {
      default: {
        files: ['sass/**/*.scss', 'js/**/*.js'],
        tasks: ['default']
      },
      options: {
        interrupt: false,
        nospawn: true,
        event: 'all',
        interval: 1000,
        debounceDelay: 1000
      },
    }
    
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', [ 'sass:dev', 'sass:production', 'uglify:production' ] );

};
