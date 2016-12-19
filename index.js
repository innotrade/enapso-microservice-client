/*
 Copyright (C) 2016 Innotrade GmbH <https://innotrade.com>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const HttpClient = require('enapso-client-js').HttpClient;
const EventEmitter = require('eventemitter2').EventEmitter2;

const parse = (client, service, response) => {
    let api = response.API;
    // iterating by app controllers
    for (let cname in api) {
        // controller object
        let controller = {};
        // getting controller API
        let capi = api[cname];
        // setting controller description
        controller.description = capi.description;
        controller.name = cname;
        // generating controller methods
        for (let index in capi.methods) {
            let method = capi.methods[index].name;
            let length = capi.methods[index].length;

            if (!capi.methods[index].portable) {
                (function (cname, method, length) {
                    controller[method] = function () {
                        return client.callMethod(service.name, cname, method,
                            Array.prototype.slice.call(arguments, 0, length));
                    };
                })(cname, method, length);
            } else {
                (function (mapi) {
                    controller[mapi.name] = function () {
                        let args = arguments;

                        return new Promise((resolve, reject) => {
                            return new Function("return {f: " + mapi.sourceCode + "}")
                                ()["f"].call(mapi.scope, {
                                    data: arguments[0],
                                    reply: function (msg) {
                                        msg.code = 0;
                                        resolve(msg);
                                    },
                                    fail: function (msg) {
                                        msg.code = -1;
                                        reject(msg);
                                    }
                                });
                        });
                    }
                })(capi.methods[index]);
            }
        }
        // setting controller in app object
        service[cname] = controller;
    }

    return service;
};

class MicroServiceGenerator extends EventEmitter {
    constructor(config) {
        super({
            wildcard: true,
            newListener: true
        });

        this.config = config;
        this.client = new HttpClient({
            url: config.url || 'https://dash.innotrade.com/http',
            username: config.username || 'guest',
            password: config.password || 'guest',
            autoSyncTimeout: config.autoSyncTimeout || 400
        });
    }

    open() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.getClient().open().then(() => {
                return self.getClient().login();
            }).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    callMethod(servicename, objectId, method, args) {
        return new Promise((resolve, reject) => {
            this.client.send({
                ns: 'com.enapso.plugins.scripting',
                type: 'callMethod',
                method: method,
                objectId: objectId,
                app: servicename,
                args: args
            }).then(resolve).catch(reject);
        });
    }

    getService(name) {
        let client = this.client;
        let self = this;
        let service = {};

        // adding utility methods
        service.name = name;

        // generating app controllers
        return new Promise((resolve, reject) => {
            client.send({
                ns: 'com.enapso.plugins.scripting',
                type: 'getClientAPI',
                app: name
            }).then((response) => {
                resolve(parse(self, service, response));
            }).catch((err) => {
                reject(err);
            });
        });

        /*
        client.send({

        }, {
            OnSuccess: function (aResponse) {
                var lAPI = aResponse.API;
                // iterating by app controllers
                for (var lCName in lAPI) {
                    // controller object
                    var lC = {};
                    // getting controller API
                    var lCAPI = lAPI[lCName];
                    // setting controller description
                    lC.description = lCAPI.description;
                    lC.name = lCName;
                    // generating controller methods
                    for (var lIndex in lCAPI.methods) {
                        var lMethod = lCAPI.methods[lIndex].name;
                        var lLength = lCAPI.methods[lIndex].length;

                        if (!lCAPI.methods[lIndex].portable) {
                            (function (aCName, aMethod, aLength) {
                                lC[aMethod] = function () {
                                    lWSC.callScriptAppMethod(aApp, aCName, aMethod,
                                        Array.prototype.slice.call(arguments, 0, aLength),
                                        arguments[aLength]);
                                };
                            })(lCName, lMethod, lLength);
                        } else {
                            (function (aMethodAPI) {
                                lC[aMethodAPI.name] = function () {
                                    var lArgs = arguments;
                                    return new Function("return {f: " + aMethodAPI.sourceCode + "}")
                                        ()["f"].call(aMethodAPI.scope, {
                                            data: arguments[0],
                                            reply: function (aMsg) {
                                                aMsg.code = 0;

                                                if ("function" === typeof lArgs[1]) {
                                                    lArgs[1](aMsg);
                                                } else {
                                                    if (lArgs[1]["OnSuccess"]) {
                                                        lArgs[1]["OnSuccess"](aMsg);
                                                    }
                                                    if (lArgs[1]["OnResponse"]) {
                                                        lArgs[1]["OnResponse"](aMsg);
                                                    }
                                                }
                                            },
                                            fail: function (aMsg) {
                                                aMsg.code = -1;

                                                if ("function" === typeof lArgs[1]) {
                                                    lArgs[1](aMsg);
                                                } else {
                                                    if (lArgs[1]["OnFailure"]) {
                                                        lArgs[1]["OnFailure"](aMsg);
                                                    }
                                                    if (lArgs[1]["OnResponse"]) {
                                                        lArgs[1]["OnResponse"](aMsg);
                                                    }
                                                }
                                            }
                                        });
                                };
                            })(lCAPI.methods[lIndex]);
                        }
                    }
                    // setting controller in app object
                    service[lCName] = lC;
                }

                lWSC.addPlugIn({
                    processToken: function (aToken) {
                        if (aApp === aToken.ns && "event" === aToken.type) {
                            if ("function" === typeof service[aToken.data.name]) {
                                service[aToken.data.name](aToken.data);
                            }
                        }
                    }
                });

                // calling success callback
                aSuccessFn(service);
            },
            OnFailure: function (aToken) {
                aFailureFn(aToken);
            }
        });

        return service;
    }
    */
    }

    close() {
        return this.client.close();
    }

    getClient() {
        return this.client;
    }
}

module.exports = MicroServiceGenerator;