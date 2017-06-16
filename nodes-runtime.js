/*
 * Copyright 2015-2016 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
  * This is the action to compile nodejs action files.
  *
  * main() will be invoked when you run this action.
  *
  * @param whisk actions accept a single parameter,
  *        which must be a JSON object with following keys.
  *
  * @param {string} action_name         - Name of the action to be created
  * @param {string} action_location     - Directory containing action files
  *        which must have index.js and can have package.json
  *
  * In this case, the params variable looks like:
  *     {
  *         "action_name": "xxxx",
  *         "action_location": "xxxx",
  *     }
  *
  * @return which must be a JSON object. It will be the output of this action.
  *
  */


function main(params) {
    // validate parameters
    var errorMsg = validateParams(params);

    if (errorMsg) {
        return { error: errorMsg };
    }

    var action_name = params.action_name;
    var action_location = params.action_location;

    // assuming for now that action_location is base64 encoded zip file content
    const fs = require('fs');
    var file = fs.readFileSync(action_location, {encoding: 'base64'});
    console.log(file);


/*    var exec = require('child_process').exec;
    return new Promise(function (resolve, reject) {
        console.log('I am inside of promise');
        exec('echo Hello', {
            stdio: 'inherit',
            shell: true,
            cwd: action_location 
        }, (err, stdout, stderr) => {
            console.log(action_location);
            if (err) {
                console.log(err);
                console.error(`Error running npm install: ${err}`);
                reject(err);
            } else {
                console.log(stdout)
                console.log(`npm install was successful ${stdout}`);
                resolve();
            }
        });
    });
*/

    var spawn = require('child_process').exec;
    var promise = new Promise(function(resolve, reject) {
        var child = spawn('cat app.js');
// npm install', {cwd: action_location});
        var tmp = {stdout: "", stderr: "", code: "undefined"};
        console.log("Child STDOUT");
        child.stdout.on('data', function (data) {
            tmp.stdout = tmp.stdout + data;
        });
        child.stderr.on('data', function (data) {
            tmp.stderr = tmp.stderr + data;
        });
        child.on('close', function (code) {
            tmp.code = code;
            if (tmp.code === 0) {
                console.log(tmp.stdout);
                resolve({msg: tmp.stdout});
            } else {
                console.log(tmp.stderr);
                resolve({msg: tmp.stderr});
            }

        });
    });

    return promise;

}

/**
 *  Checks if all required params are set.
 *  Required parameters are:
 *      action_name
 *      action_location
 */
function validateParams(params) {
    if (params.action_name === undefined) {
        return ('No action name provided, please specify action_name.');
    }
    else if (params.action_location === undefined) {
        return ('No action location provided, please specify action_location.');
    }
    else {
        return undefined;
    }
}

/**
 * Run npm install --prefix <action_location> --production
 * run npm install if package.json file exists at action_location
 * package.json file contains list of dependencies
 * npm install reads the list of dependencies from package.json file and
 * install required packages.
 * Running npm install wihtout package.json fails with "enoent" - 
 *      ENOENT: no such file or directory, open <action_location>/package.json
 */

/**
 * Prune package directories under node_modules to delete test/ and tests/ directories
 */

/**
 * Zip the whole directory including package.json, index.js, and node_modules.
 * Maintain the same directory structure while zipping so that index.js
 * and/or package.json is still at the root which is must for zipped actions.
 * https://www.npmjs.com/package/archiver
 */
