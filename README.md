# Loconomics

Root folders include documentation (/docs and /styleguide*1) and sub-projects (/app, /web and the /iCalendarLib library).

*1: Styleguide is currently obsolete, the design is implemented in /app.

## App
It's a web app that targets mobile (using Phonegap) and the front-end for the web.

It uses:
- Web platform: html, css, js
- Preprocessors: Stylus (CSS), Browserify (js), Bliss (html)
- Main libraries: jQuery-2, Bootstrap-3, Knockoutjs-3.3, polyfills for ES5 and ES6-Promise, momentjs.
- Nodejs to assist front-end development, using Grunt as tasks runner.

### Prepare dev environment
- Clone the git repository, master branch.
- Install NodeJS (minimum version 0.10, not tested with the newest ones like 4.1 but must work): https://nodejs.org/ (it has packages/installers for Windows, Mac and Linux)
- From the command line, use the NodeJS Package Manager (npm) to globally install
  - [Grunt](http://gruntjs.com/), type:

    > npm install -g grunt-cli
  - [Phonegap](http://phonegap.com/), type:

    > npm install -g phonegap
  
  Linux and Mac may require root/elevated rights in order to install globally.
- From the command line at the project directory type

  > npm install

  It will install all the modules listed on the package.json file, needed to build the app source code.

### Organization (main folders)
**- /app: all the code for the app**
  - /source: source code of the app and templates of configuration files
    - /html/activities: HTML source code. Each file needs to have a matching /js/activities file and optionally /css/activities.   
    - /css/activities: CSS code for matching HTML files. Each file needs to be included in app/source/css/app.styl.   
    - /js/activities: JS code for matching HTML files. Each file needs to be included in app/source/js/app.activities.js.   
    - /js/models: JS code that defines the data from the rest api as javascript objects. Referenced in both JS activities and JS AppModels.   
    - /js/appmodel: JS code for matching JS models that includes actions for that model (update, delete, cancel a booking, etc.) Each file needs to included in app/source/js/appmodel/appmodel.js
  - /build: automatic content, generated by the build process from source
  - /phonegap: automatic content, generated by the build process targetting Phonegap.
  - /build/latest.zip: It's a compressed bundled of the /phonegap content, ready to use in the PhoneGap Build service, used to compile the project for iOS and Android in the cloud (file ignored by git).
  - /node_modules: automatic content, managed by npm
  - /grunt: javascript files that define automated tasks using the Grunt task runner.
  - /trials: some testing files for things being developed, to try in a isolated context, temporary content.
  - /vendor: third party modules that are not at npm, or needed some custom build, or forked third party modules.
  - /package.js: NodeJS package definition file, keeps modules dependencies (npm) and some set-up variables.
  - /Gruntfile.js: file required by the Grunt task runner on the project root folder; more code is organized in the /grunt folder to don't have a fat Gruntfile.js file.
**- /web: all server-side and API files**
    - /_DBUpdate: MS SQL files of any changes to the dev database to ensure the test and live databases get updated accordingly.
    - /api/v1: CSHTML files that communicate with the server and retrieve API data
      - /me: Information about a user requesting information about themselves, mostly private  
      - /user: Information about a user requesting information about another user, mostly public  
    - /App_Code/LcPricing: C# files that implements.....
    - /App_Code/LcRest: C# files that implements the schemes for specific objects in the REST API, and static methods/queries/updates for database operations
    - /en-US/EmailCommunications: CSTHML files for all e-mail communcations sent to users
      - /Admin: Communications to users their account (welcome, password resets, etc.) 
        - /Internal: Communications sent to employees about important user actions (background check/license verification requests)
      - /Booking: Communications to users about bookings
        - /BookNow: All communications for BookNow bookings (from a service professional's website)
        - /Marketplace: All communications for Marketplace bookings (from the Loconomic's website/app)
        - /ServiceProfessionalBooking: All communications for bookings made by the service professional 
        
### Adding new pages or data to the app
**Step 1: Is there an existing endpoint/call/method already in the REST API (another page using it)?**
- If no proceed to Step 2.
- If yes, process to Step 4. 
**Step 2: Is the data you need already in the database?**
- If yes, proceed to Step 3. If not, continue.
- Avoid renaming or deleting fields.
- For schema changes (new columns, tables, drops,..), if your program to access database generates SQLs for the task, save them in a file at the _DBUpdate with extension ".sql".
- The naming of ".sql" files is : 'Release-' and release number, dash, a consecutive letter, dash, consecutive number, dash, a short descriptive name of the change. I see sometimes I forgot the last dash but doesn't matters, what is **important is to keep the order** in which changes were done. I use the letters to group changes that are part of a same consecutive task (like in this case, 1-add new column, 2-insert new data, both with the same letter that is the next one available -right now the D in Release-7.1).
- Why the order is important? Because if you changes the order things can break, breaking *live* database and its data.
- For data updates: if applied on *system* tables (the ones that we keep manually, no interaction from the code except to read it; like countries, statuses, types and that kind of things), I have a TestDBSync page to help with that, but may require create some SQL templates first, let to me for now.
- for data updates: if applied over *user* tables, that's more complicated and need a manually written and well tested SQL script. Rare cases need it, mostly when changing how some existent data is stored.

**Step 3: Add new data to the REST API**
- Create sample SQL with sample query parameters. 
- If there are updates/additions to database, record them in web/_DBUpdate as .sql files with proper release in file name per Step 2.
- Find, copy and rename an example .cs file from web/App_Code/LcRest using the name of the DB table if possible
- Revise code to match the sample SQL. 
- Revise any existing functions removing or updating them to match your data.
- Add any new necessary functions (you may find similar examples in other files).
- Determine where it should go in the web/api/v1:
  - /: Information not related to specific users
  - /me: Information about a user requesting information about themselves, mostly private  
  - /user: Information about a user requesting information about another user, mostly public  
- Find, copy and rename an example .cshtml file from the chosen folder.
- Define functions for the API in this file.
- TEST API call (IAGO PLEASE FILL IN INSTRUCTIONS)
- Find, copy and rename an example .js file from app/source/js/models or model.js if there isn't a good example.
- Revise or write code that defines the javascript objects you'll need.
- Determine if you'll need an appmodel file (includes actions for that model). If so: 
  - Find, copy and rename an example .js file from app/source/js/appmodel.
  - Revise or write code that create the actionss you'll need paying special attention to utilities referenced from the /js/utils folder.
  - Add file name to: app/source/js/appmodel/appmodel.js

**Step 4: create new files for front-end code**
- Find, copy and rename an example .html file from app/source/html/activities.
- Optional: Find, copy and rename an example .css file from app/source/css/activities & add file name to app/source/css/app.styl.
- Find, copy and rename an example .js file from app/source/js/activities & add file name to app/source/js/app.activities.js.

**Step 5: Edit your new html, css, js /activity files**
- Change data-activity name to new name. Review and revise .js file to reference the appopriate /models and /appmodel files and functions. 
- Change data-activity name to new name. Review and revise .html & .css files to have front end appearance you want. 
- Change references the appopriate js functions in html.
- Test any data you're using by placing console.log(data) in the .js file
- 
**Add new files in (copy an existing example and rename):**
- app/source/html/activities
- app/source/css/activities
- app/source/js/activities

**Add line reference to new activity in (copy an existing line & edit with new activity name):**
- app/source/css/app.styl
- app/source/js/app.activities.js



**To access the new page:**
- http://localhost:8811/app.html#!/newActivity

### Build the source code
**All next commands must be executed in a command line/terminal at the project directory**

Run next command:
> grunt build

It will recreate the content of the /build and /phonegap folders.

To test the webapp in the browser, a lightweight built-in http server is being used (*connect*), to start it, run next command and keep the task alive:
> grunt connect:atbuild

But *it's better* to run next special task, that performs the previous one and other things:
> grunt atwork

- runs the *connect* server at http://localhost:8811/
- runs the *watch* task that will listen for changes on source files to automatically rebuild the needed files
(specific builds are performed, like build-js, build-css, depending on the modified files;
when they finish, the browser can be refreshed to try latest changes).
- by modifying the package.json file (to update the version number, for example :-), the *watch* task will
run the *grunt build* task, rebuilding everything; when it finishs, the /build/latest.zip file is ready to be sent
to PhoneGap Build, and the phonegap folder is ready to perform local PhoneGap builds.
- when the build ends, a notification is sent to the system (more info at https://github.com/dylang/grunt-notify).

**PhoneGap Build** cloud service is used to create the intallation packages for iOS and Android.

To perform that task in your own computer, you need the SDKs of each platform:
- Apple XCode installed to create the iOS app; run the command:

  > phonegap build ios
  
- Android SDKs installed to create the Android app; run the command:

  > phonegap build android
  
Remember that the Phonegap plugins must be installed previously in order to be included in the local build.
It's done by placing you in the /app/phonegap directory from the command line/terminal and running something like:

> phonegap plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-inappbrowser.git

The file /app/source/cordova-config.js.xml has a list of all the plugins in use (look at the *gap:plugin* elements),
this config is used by the PhoneGap Build service to automatically install them. The version in use is there too, but not
git URL, the package name can be used to locate it at [npm](https://www.npmjs.com/) and found the project git URL there.




## Filing Github Issues

We use Github to track all development issues, marketing tasks, and a repository for for other related project information.

When filing an issue, you must do the following:
- Select which milestone to attach it to:
  - **Information Repository** Meeting Notes, People to connect with, Journalists to contact, Knowledge Base, etc.
  - **Sandbox** All development issues not yet included in an upcoming release. Follow format outlined in milestone.
  - **Marketing** All outstanding marketing items not yet included in specific marketing milestones.
  - **Release X.XX** Issues to be completed and closed for a specific app release. Only @dani0198 or @iagosrl should add or remove issues from these.
- Label approriately the issue:
  - **Sandbox** 
    - Include: 
    - **Gray label** (issue type): 
      - Bug 
      - Content
      - Feature 
      - Enhancement (to an existing feature)
      - Usability (front end changes to make feature more usable)
      - Optimization (of an existing feature)
    - **Blue label** (feature area)
    - **P label** (priority:
      - P1 (The issue will be seen by all users.)
      - P2 (The issue will be seen by most users.)
      - P3 (The issue will be seen by about half of users.)
      - P4 (The issue will not be seen by most users. Usually the issue is a very specific use case or corner case.)
    - **R label** (readiness):
      - R1 (The issue is ready to be put into a release with all supporting documentation completed. 
        - **NEW ISSUE CREATED WITH CLEAN FORMAT & OLD ISSUE CLOSED & REFERENCED**)
      - R2 (The issue has been deemed necessary by users and business team. Supporting documentation is being completed.)
      - R3 (The issue is a well formed idea able to be articulated to users. Should be shared so that they may vote on it.)
      - R4 (The issue is just an idea with no or little supporting documentation.)
    - **S label** (severity-ONLY FOR BUGS):
      - S1 (The issue is blocking an impending release.)
      - S2 (The issue causes data loss, crashes or hangs salt processes, makes the system unresponsive, etc.)
      - S3 (The issue reports incorrect functionality, bad functionality, a confusing user experience, etc.)
      - S4 (The issue reports cosmetic items, formatting, spelling, colors, etc.)

Steps to adding data to the API:
   - Is there an existing endpoint/call/method already in the REST API?
   - Yes, find an example of where it's already used, and try and copy it
   - No, do these steps to add an endpoint to the API:
   -    - Ensure database table is up-to-date. 
   -        - If you add/rename fields (DO NOT REMOVE FIELDS), create .sql records of any changes and add to _DBUPDATE
   -        - Find an existing example of a similar table in the LcRest folder
   -        - Decide if it's only data being pulled or if data needs to be updated/inserted
   -        - Revise SQL statements in newly copied .cs file and test in dev database using Razor
   -        - Create file in LcREST with data functions to query, update, etc.
   -        - Add a cshtml file into api/v1 and decide if it should go into a me (information about user requesting, usuall private) or user (others, usually public).
   -        - Define functions for the API in this file
   -        - Decide- do I need a app/source/js activity, model, appmodel (one or all?)
   -        


