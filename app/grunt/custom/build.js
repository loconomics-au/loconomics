/**
 * Task 'build' with modifiers.
 * Check ../aliases for other tasks with prefix 'build-', while this one
 * is just 'build' plus console parameters, accepted now:
 * - '--dev' Development mode: enable source maps, debugging versions of some
 *      modules. Other Grunt tasks/settings read this parameter too, keep in
 *      sync.
 */
'use strict';
var envOptions = require('../shared/envOptions');
var buildConfigurations = require('../shared/buildConfigurations');
const TASK_NAME = 'build';
/**
 * Tasks list to build for Production environment
 * @const {Array<string>}
 */
const PRODUCTION_TASKS = [
    //// Using parallel mode:
    //'parallel:build-app'
    // Using standard sequential mode:
    'build-js',
    'build-css',
    'build-html',
    'build-images',
    'build-fonts'
];
/**
 * Tasks list to build for Development environment
 * @const {Array<string>}
 */
const DEV_TASKS = [
    'mkdir:build-assets-js',
    'browserify:appCommon',
    'prepare-bootstrap-variables',
    'concat:css-libs',
    'stylus:app',
    'copyto:images',
    'build-fonts',
    'bliss:appDebug'
];
/**
 * Grunt task factory
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    
    grunt.registerTask(TASK_NAME, 'Build App', function(configuration) {
        const isDevEnv = envOptions.inDev();
        
        if (configuration != undefined)
        {            
            var config = {};
            config = buildConfigurations(grunt, configuration);
            if (config != undefined)
            {
                grunt.config.set('bliss.webapp.options.context.apiUrl', config.apiUrl);
                grunt.config.set('bliss.webapp.options.context.sitePath', config.sitePath);
                grunt.config.set('bliss.appDebug.options.context.apiUrl', config.apiUrl);
            }
        }
        
        let tasks;
        if (isDevEnv) {
            tasks = DEV_TASKS;
        }
        else {
            tasks = PRODUCTION_TASKS;
        }
        // Run
        grunt.task.run.apply(grunt.task, tasks);
    });
};
