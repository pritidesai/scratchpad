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
  * @param {string} action_name - Name of the action to be created
  * @param {string} action_data - Base64 encoded compressed data containing
  *     action files and packaging file. Must have index.js and can have
  *     package.json. For example, run:
  *         zip -rq action.zip action_files/
  *         cat action.zip | base64 -
  * 
  *
  * In this case, the params variable looks like:
  *     {
  *         "action_name": "xxxx",
  *         "action_data": "xxxx",
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

    var actionName = params.action_name;
    var actionData = params.action_data;

    var fs = require('fs');
    var exec = require('child_process').exec;

    console.log("Action Data", actionData);

    var zipFileDir = "/tmp/" + actionName + '/';
    var zipFileName = actionName + ".zip";
    var zipFile = zipFileDir + zipFileName;

    actionData += actionData.replace('+', ' ');
    binaryActionData = new Buffer(actionData, 'base64').toString('binary');

    return new Promise(function (resolve, reject) {
        // create a temporary directory
        cmd = 'mkdir ' + zipFileDir;
        exec(cmd, function (err, data) {
            // rejects the promise with `err` as the reason
            if (err) {
                reject(err);
            }
            // fulfills the promise with `data` as the value
            console.log(data);
            resolve(data);
        })
    })     
    .then(function () {
        return new Promise(function (resolve, reject) {
            // write a zip file with base64 encoded action data
            fs.writeFile(zipFile, binaryActionData, "binary", function (err, data) {
                if (err) {
                    reject(err);
                }
                console.log(data);
                resolve(data);
            })
        })
    })
    .then (function () {
        // extract all the files/data from action data with
        // unzip -o -d /tmp/ /tmp/action.zip && rm /tmp/action.zip
        cmd = 'unzip -o ' + zipFile + ' && rm ' + zipFile;
        return new Promise(function (resolve, reject) {
            exec(cmd, {cwd: zipFileDir}, function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
                console.log(data);
            })
        })
    })
    .then(function () {
        cmd = 'npm install --production';
        return new Promise(function (resolve, reject) {
            exec(cmd, {cwd: zipFileDir}, function (err, data) {
                if (err) {
                    console.log('Failed to install npm packages ', err);
                    reject(err);
                } else {
                    console.log('successfully installed npm packages', data);
                    resolve(data);
                }
            })
        })
    })
    .then (function () {
        cmd = 'cd ' + zipFileDir + ' && zip -rq ' + zipFileName + ' *';
        return new Promise(function (resolve, reject) {
            exec(cmd, {cwd: zipFileDir}, function (err, data) {
                if (err) {
                    console.log('Failed to install npm packages ', err);
                    reject(err);
                } else {
                    console.log('successfully installed npm packages', res);
                    resolve(data);
                }
            })
        })
    })
    .then (function () {
        // require the OpenWhisk npm package
        var openwhisk = require("openwhisk");
         // instantiate the openwhisk instance before you can use it
        wsk = openwhisk();
        const actionData = fs.readFileSync(zipFile)
        return wsk.actions.create({actionName, actionData})
        .then (result => {
            console.log('action created');
        })
        .catch (err => {
            console.error('failed to create action', err);
        })
    })
    // catch handler
    .catch(function (err) {
        console.error('Error: ', err);
        return {error: err};
    });

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
    else if (params.action_data === undefined) {
        return ('No action data provided, please specify action_data.');
    }
    else {
        return undefined;
    }
}

function writeZipFile(encodedActionData, zipFile) {

    encodedActionData += encodedActionData.replace('+', ' ');
    binaryActionData = new Buffer(encodedActionData, 'base64').toString('binary');

    return new Promise(function (resolve, reject) {
        // Create a zip file with base64 encoded action data
        fs.writeFile(zipFile, binaryActionData, "binary", function (err, data) {
            // rejects the promise with `err` as the reason
            if (err) {
                reject(err);
            }
            console.log('Successfully created zip file: ', zipFile);
            // fulfills the promise with `data` as the value
            resolve(data);
        })
    // catch handler - create a zip file
    }).catch(function (err) {
        console.log('Failed to create a zip file: ', zipFile);
        console.error('Error: ', err);
        return undefined;
    });
}

function extractActionFiles(zipFileDir, zipFile) {
    // extract all the files/data from action data
    var cmd = 'unzip -o -d ' + zipFileDir + ' ' + zipFile;
    return new Promise(function (resolve, reject) {
        exec(cmd, {cwd: zipFileDir}, function (err, res, body) {
            if (err) {
                reject(err);
            }
            console.log('Successfully extracted action files/data: ', res);
            resolve();
        })
    // catch handler - extract zip file
    }).catch(function (err) {
        console.log('Failed to extract action files/data: ', zipFile);
        console.error('Error: ', err);
        return undefined;
    })
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
