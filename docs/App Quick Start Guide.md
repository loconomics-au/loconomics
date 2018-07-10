# App Quick Start Guide

## Download or clone the master branch of the Loconomics Github repository
- [Download](https://github.com/loconomics/loconomics/archive/master.zip)
- Cloning link: https://github.com/loconomics/loconomics.git
- [Help with cloning](https://help.github.com/articles/cloning-a-repository/)

## Install Node.js

You'll need to [download Node.js v8.9.3](https://nodejs.org/en/download/) or newer (macOS, Windows, Linux) and install on your local machine.
*Note: if a problem is detected when using a newer version of Node, please post errors in [a new issue](https://github.com/loconomics/loconomics/issues/new), we want to support newest versions.*

## Install Yarn

We use [Yarn](https://yarnpkg.com) as our package manager. You'll need to [install it](https://yarnpkg.com/en/docs/install) before continuing.

## Install modules (from the command line in the /app folder of the project directory)
```
yarn --ignore-engines
```
It will install all the modules listed on the package.json file, needed to build the app source code.

## Build the app source code

Ensure you're in the project's /app folder and run:
```
yarn grunt build
```
It will recreate the content of the /build folder.

After do that you may want to [build the native apps using Phonegap](Deploying the App.md) or debug the app.

## Debug the app on localhost

**Ensure you're in the project's /app folder **

#### Build for development
Before load and start debugging the app, you need to build it --almost the first time or when switching between branches.

You should use and alternate version of the 'build' command:
```
yarn grunt build --dev
```

With the `--dev` modifier, we ensure the files includes source maps and debugging symbols. And optimization/minification steps
are not executed with this, being a bit faster (they are not used when debugging anyway).

##### Building landing pages
To test landing pages created in the /welcome folder, you must build them separately using the following commands:
```
grunt build-landingPages
```
Make that build available at web folder to prepare upload: 
```
grunt publish-landingPages
```
Working just on landing pages: 
```
grunt atwork --target=landing_pages
```
Landing pages will be available at http://localhost:8811/welcome/.
#### Start local server
Allows you to test the webapp in the browser, a lightweight built-in http server is being used (connect), to start it, run next command and keep the task alive.
```
yarn start
```

This will:
- run the connect server at http://localhost:8811/ (calls internally to `grunt connect:atbuild`)
- perform a dev build, ensuring you have an up-to-date copy; since `browserify-incremental` is used, builds following first one should be fast (calls internally to `grunt build --dev`)
- run the watch task that will listen for changes on source files to automatically rebuild the needed files (specific builds are performed, like build-js, build-css, depending on the modified files; when they finish, the browser can be refreshed to try latest changes).
  **Important:** the 'watch' task is unable to detect new created files of some types, requiring us to manually restart task to let detect further changes. Any help fixing this is welcome, at [#28](https://github.com/loconomics/loconomics/issues/28).
- by modifying the package.json file, e.g. to update the version number, the watch task will run the `grunt build` task, rebuilding everything.
- when the build ends, a notification is sent to the system. [More info on this](https://github.com/dylang/grunt-notify)

## Open the app

Open your browser and open:
```
http://localhost:8811
```

The **index.html** available at localhost:8811 loads non-minimized and source mapped files, better for debugging. It's the preferred one for development, while tasks named 'webapp' creates another html file under the `/web` directory that contains minimized files without source maps, that is what we use in production; just in case there are doubts about minimizing options that could break something (not normally, may happens on trying new options to optimize or upgrading/changing minifiers) we can use this to test and verify.
*Note:* All JS, CSS and HTML is being bundled on single files right now, with the project getting bigger it starts to be a huge load for browsers and debuggers, we have in mind the need to split project files and load them on demand (good for debugging and for webapp load times). Help wanted at [#460]((https://github.com/loconomics/loconomics/issues/460) [#203]((https://github.com/loconomics/loconomics/issues/203)

## Point your local storage to a database

The App/Webapp needs to know where is the REST Service to access data.
At start-up, the app looks for a `siteUrl` key at localStorage; if nothing, looks for a `data-site-url` attribute at the html
element; if nothing, uses the document base URL (the domain from where the document is being served).

### To set up a different REST Service URL:
Open the Web console with the page opened (can be the local development server created by 'yarn start', or our Webapp dev.loconomics.com) and replace the `local siteUrl`:

#### For our dev database (ignore security warnings):
```
localStorage.siteUrl = 'http://dev.loconomics.com';
```
#### For your local database:
```
localStorage.siteUrl = 'http://localhost/loconomics';
```
#### To restore it and have the App/Webapp use the default URL:
```
delete localStorage.siteUrl;
```

## API Access & Testing
Create a user account on http://dev.loconomics.com and request access from [@iagosrl](mailto:iago@loconomics.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com)
http://dev.loconomics.com/tests/testrest
