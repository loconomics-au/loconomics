'use strict';

module.exports = function(grunt) {
    /* eslint max-statements:"off" */

    var includedPatterns = ['activities/**/*.html', 'templates/**/*.html'];
    var includedDir = 'source/html/';
    var includedFiles = grunt.file.expand({
        cwd: includedDir,
        filter: grunt.file.isFile
    }, includedPatterns);

    // these are defaults and get reset by grunt/custom/buld.js
    const siteUrl = "http://localhost/loconomics";
    const sitePath = "/loconomics/";
    const apiUrl = "http://localhost/loconomics-api";

    const facebookAppID = '273905020314811';
    const facebookLang = 'en-AU';

    const googleMapsApiKey = "AIzaSyDh0PfCGxGV-5OE13OV59bAMBbLdMKKz5Q";

    var moment = require('moment');
    var version = moment().format('YYYYMMDDHHmm');
    var pkg = grunt.file.readJSON('package.json');
    var appVersion = pkg.version;
    
    // Version number as single number, 2 digits per position
    // Example: 1.1.0 -> 10100, 2.34.5 -> 23405
    var versionCode = appVersion.split('.').reverse().reduce(function(t, x, i) { return t + (x|0) * Math.pow(10, i * 2); }, 0);

    var tasks = {
        webapp: {
          files: {
            '../web/wwwroot/app.html': ['source/html/web.js.html']
          },
          options: {
            context: {
                debug: false,
                includedFiles: includedFiles,
                cordovajs: false,
                siteUrl: siteUrl,
                apiUrl: apiUrl,
                sitePath: sitePath,
                facebookAppID: facebookAppID,
                facebookLang: facebookLang,
                googleMapsApiKey: googleMapsApiKey,
                cssVersion: version,
                jsVersion: version,
                appVersion: '<%= package.version %>',
                appId: '<%= package.appId %>',
                appName: '<%= package.appName %>'
            }
          }
        },
        appDebug: {
          files: {
            'build/index.html': ['source/html/app.js.html']
          },
          options: {
            context: {
                debug: true,
                includedFiles: includedFiles,
                cordovajs: false,
                siteUrl: siteUrl,
                facebookAppID: facebookAppID,
                facebookLang: facebookLang,
                googleMapsApiKey: googleMapsApiKey,
                appVersion: '<%= package.version %>',
                appId: '<%= package.devAppId %>',
                appName: '<%= package.devAppName %>'
            }
          }
        },
        phonegap: {
          files: {
            'phonegap/www/index.html': ['source/html/app.js.html']
          },
          options: {
            context: {
                debug: false,
                includedFiles: includedFiles,
                cordovajs: true,
                siteUrl: 'https://loconomics.com.au',
                facebookAppID: facebookAppID,
                facebookLang: facebookLang,
                googleMapsApiKey: googleMapsApiKey,
                appVersion: '<%= package.version %>',
                appId: '<%= package.appId %>',
                appName: '<%= package.appName %>'
            }
          }
        },
        phonegapDev: {
          files: {
            'phonegap/www/index.html': ['source/html/app.js.html']
          },
          options: {
            context: {
                debug: true,
                includedFiles: includedFiles,
                cordovajs: true,
                siteUrl: 'https://dev.loconomics.com.au',
                facebookAppID: facebookAppID,
                facebookLang: facebookLang,
                googleMapsApiKey: googleMapsApiKey,
                appVersion: '<%= package.version %>',
                appId: '<%= package.devAppId %>',
                appName: '<%= package.devAppName %>'
            }
          }
        },
        cordovaConfigJson: {
            files: {
                'phonegap/.cordova/config.json': ['source/cordova-config.js.json']
            },
            options: {
                context: {
                    id: '<%= package.appId %>',
                    phonegapbuildId: '<%= package.phonegapbuildId %>',
                    version: '<%= package.version %>'
                }
            }
        },
        cordovaConfigXml: {
            files: {
                'phonegap/www/config.xml': ['source/cordova-config.js.xml']
            },
            options: {
                context: {
                    id: '<%= package.appId %>',
                    version: '<%= package.version %>',
                    versionCode: versionCode,
                    name: '<%= package.appName %>',
                    description: '<%= package.appDescription %>',
                    author: {
                      email: 'support@loconomics.com.au',
                      url: 'https://loconomics.com.au',
                      text: '<%= package.author %>'
                    },
                    facebookAppID: facebookAppID,
                    facebookLang: facebookLang,
                    facebookAppName: '<%= package.appName %>',
                    googleMapsApiKey: googleMapsApiKey,
                }
            }
        },
        cordovaConfigXmlDev: {
            files: {
                'phonegap/www/config.xml': ['source/cordova-config.js.xml']
            },
            options: {
                context: {
                    id: '<%= package.devAppId %>',
                    version: '<%= package.version %>',
                    versionCode: versionCode,
                    name: '<%= package.devAppName %>',
                    description: '<%= package.appDescription %>',
                    author: {
                      email: 'support@loconomics.com.au',
                      url: 'https://loconomics.com.au',
                      text: '<%= package.author %>'
                    },
                    facebookAppID: facebookAppID,
                    facebookLang: facebookLang,
                    facebookAppName: '<%= package.appName %>',
                    googleMapsApiKey: googleMapsApiKey,
                }
            }
        }
    };

    // Landing Pages
    const getLandingPagesFiles = require('./shared/getLandingPagesFiles');
    const landingPageTemplatesPatterns = ['templates/signup.html',
                                        'templates/signup-field.html',
                                        'templates/validated-password.html',
                                        'templates/select-job-title.html'];
    const landingPageTemplatesFiles = grunt.file.expand({
                cwd: includedDir,
                filter: grunt.file.isFile
            }, landingPageTemplatesPatterns);

    tasks.landingPagesBuild = {
        files: getLandingPagesFiles(grunt, 'build/welcome'),
        options: {
            context: {
                facebookAppID: facebookAppID,
                facebookLang: facebookLang,
                googleMapsApiKey: googleMapsApiKey,
                includedFiles: landingPageTemplatesFiles,
                dotVersion: '',
                cordovajs: false,
                siteUrl: 'https://dev.loconomics.com.au'
            }
        }
    };
    tasks.landingPagesWeb = {
        files: getLandingPagesFiles(grunt, '../web/wwwroot/welcome'),
        options: {
            context: {
                facebookAppID: facebookAppID,
                facebookLang: facebookLang,
                googleMapsApiKey: googleMapsApiKey,
                dotVersion: '.min.' + version,
                includedFiles: landingPageTemplatesFiles,
                cordovajs: false,
                siteUrl: ''
            }
        }
    };

    return tasks;
};
