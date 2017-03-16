/*
 Copyright (C) 2017 Innotrade GmbH <https://innotrade.com>

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
const WebSocketClient = require('enapso-client-js').WebSocketClient;
const parse = require('./lib/parser.js');

class MicroServiceGenerator {
    constructor(config) {
        this.config = config;
        this.client = (config.url || 'http').startsWith('http') ? new HttpClient({
            url: config.url || 'https://dash.innotrade.com/http',
            username: config.username || 'guest',
            password: config.password || 'guest',
            autoSyncTimeout: config.autoSyncTimeout || 400
        }) : new WebSocketClient({
            url: config.url || 'wss://heprdlxdemo01.innotrade.com',
            username: config.username || 'guest',
            password: config.password || 'guest'
        });
    }

    open() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.client.open().then(() => {
                return self.client.login();
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
    }

    close() {
        return this.client.close();
    }
}

module.exports = MicroServiceGenerator;