'use strict';

module.exports = {
    build: ['./build'],
    plugins: ['./phonegap/plugins'],
    platforms: ['./phonegap/platforms'],
    // next throws error 'cannot delete files outside the current working directory'
    //webapp: ['../web/wwwroot/assets/**.*', '../web/wwwroot/welcome/**.*']
};
