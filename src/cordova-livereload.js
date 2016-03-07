/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
/// <reference path="../typings/xml2js/xml2js.d.ts" />
"use strict";
var child_process = require("child_process");
var fs = require('fs');
var path = require('path');
var Q = require('q');
var xml2js = require('xml2js');
var exec = child_process.execSync;
var CordovaLiveReload = (function () {
    function CordovaLiveReload() {
    }
    CordovaLiveReload.run = function () {
        var platform;
        if (process.argv.length < 3) {
            console.error("missing platform id ios or android");
            return;
        }
        platform = process.argv[2];
        this.setupConfigXML()
            .then(function () {
            console.log("done editting");
        })
            .catch(function (error) {
            console.error(error);
        });
        console.log('exec: cordova run', platform);
        /*
        exec("cordova run",{
          "stdio":"inherit"
        });
        */
    };
    CordovaLiveReload.setupConfigXML = function () {
        return ConfigXml.setConfigXml(process.cwd(), {
            errorWhenNotFound: true,
            devServer: "http://9.1.2.3"
        });
    };
    return CordovaLiveReload;
}());
var ConfigXml = (function () {
    function ConfigXml() {
    }
    ConfigXml.loadToJson = function (appDirectory) {
        var d = Q.defer();
        if (!appDirectory) {
            appDirectory = process.cwd();
        }
        var configXmlPath = path.join(appDirectory, 'config.xml');
        var file = path.join(appDirectory, 'config.xml');
        fs.readFile(configXmlPath, { encoding: 'utf8' }, function (err, data) {
            if (err)
                return d.reject(err);
            xml2js.parseString(data, function (err, configJson) {
                if (err)
                    return d.reject(err);
                d.resolve(configJson);
            });
        });
        return d.promise;
    };
    ConfigXml.setConfigXml = function (appDirectory, options) {
        var madeChange = false;
        if (!appDirectory) {
            appDirectory = process.cwd();
        }
        console.log('ConfigXml.setConfigXml', appDirectory, options);
        var configXmlPath = path.join(appDirectory, 'config.xml');
        if (!fs.existsSync(configXmlPath)) {
            // working directory does not have the config.xml file
            if (options.errorWhenNotFound) {
                return Q.reject('Unable to locate config.xml file. Please ensure the working directory is at the root of the app where the config.xml should be located.');
            }
        }
        return this.loadToJson(appDirectory)
            .then(function (configJson) {
            if (!configJson.widget) {
                throw new Error('\nYour config.xml file is invalid. You must have a <widget> element.');
            }
            else if (configJson.widget && !configJson.widget.content) {
                throw new Error('\nYour config.xml file does not have a <content> element. \nAdd something like: <content src="index.html"/>');
            }
            if (options.devServer) {
                if (!configJson.widget.content[0].$['original-src']) {
                    configJson.widget.content[0].$['original-src'] = configJson.widget.content[0].$.src;
                    madeChange = true;
                }
                if (configJson.widget.content[0].$.src !== options.devServer) {
                    configJson.widget.content[0].$.src = options.devServer;
                    madeChange = true;
                }
            }
            else if (options.resetContent) {
                if (configJson.widget.content[0].$['original-src']) {
                    configJson.widget.content[0].$.src = configJson.widget.content[0].$['original-src'];
                    delete configJson.widget.content[0].$['original-src'];
                    madeChange = true;
                }
            }
            if (madeChange) {
                var xmlBuilder = new xml2js.Builder();
                var configString = xmlBuilder.buildObject(configJson);
                fs.writeFileSync(configXmlPath, configString);
            }
        });
    };
    return ConfigXml;
}());
module.exports = CordovaLiveReload;
//# sourceMappingURL=cordova-livereload.js.map