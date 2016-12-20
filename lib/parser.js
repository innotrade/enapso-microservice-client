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

module.exports = (generator, service, response) => {
    let api = response.API;
    // iterating by service controllers
    for (let cname in api) {
        // controller object
        let controller = {};
        // getting controller API
        let capi = api[cname];
        // setting controller description
        controller.description = capi.description;
        // setting controller name
        controller.name = cname;
        // generating controller methods
        for (let index in capi.methods) {
            let method = capi.methods[index].name;
            let length = capi.methods[index].length;

            if (!capi.methods[index].portable) {
                // processing server-side controller methods
                (function (cname, method, length) {
                    controller[method] = function () {
                        return generator.callMethod(service.name, cname, method,
                            Array.prototype.slice.call(arguments, 0, length));
                    };
                })(cname, method, length);
            } else {
                // processing client-side controller methods
                (function (mapi) {
                    controller[mapi.name] = function () {
                        let args = arguments;
                        return new Promise((resolve, reject) => {
                            // considering server-side event-bus API (reply, fail)
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
        // upgrading the service object with the new controller
        service[cname] = controller;
    }

    // registering server2client event listener
    generator.client.on('message', (msg) => {
        if (service.name === msg.ns && "event" === msg.type) {
            if ("function" === typeof service[msg.data.name]) {
                service[msg.data.name](msg.data);
            }
        }
    });

    return service;
}