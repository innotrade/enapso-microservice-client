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

const expect = require("chai").expect;
const MS = require("./index.js");

const generator = new MS({
    url: 'https://dash.innotrade.com/http',
    username: 'guest',
    password: 'guest'
});

describe('Promise based API', () => {
    describe('connection', () => {
        it('open', (done) => {
            generator.open().then(done);
        });
    });

    describe('generating micro-service', () => {
        let EOS;

        it('getting EnapsoOntology micro-service...', (done) => {
            generator.getService('EnapsoOntology').then((response) => {
                EOS = response;
                done();
            });
        });

        it('calling EOS.ontology.list micro-service method...', (done) => {
            EOS.ontology.list({
                offset: 0,
                length: 1000
            }).then((response) => {
                expect(response.result.data.total > 0).to.equal(true);
                done();
            });
        });

        it('calling EOS.individual.get micro-service method...', (done) => {
            EOS.individual.get({
                ontologyAlias: "EnapsoUnits",
                IRI: "I_afd5f9fa6049bdbec3365abcc96567fb",
                deepSearch: true
            }).then((response) => {
                expect(response.code === 0).to.equal(true);
                done();
            });
        });
    });

    describe('disconnect', () => {
        it('close', (done) => {
            generator.close().then(done);
        });
    });
});