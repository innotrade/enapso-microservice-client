
# Introduction
HTTP/WebSocket Client (JavaScript) for [Enapso Micro-Services](https://www.innotrade.com/products/enapso-micro-services).
This module generate instances from remote micro-services public APIs, benefiting developers with the best possible "easy to use" interface.
  
# Installation
  ```bash
  npm install --save enapso-microservice-client
  ```

# Getting Started
For this example we will use a production installation of the [Enapso Enterprise Server](https://www.innotrade.com/products/enapso-enterprise-server), this is the [Enapso Dash](https://dash.innotrade.com) platform.
The library use [ES6 Promise](https://developers.google.com/web/fundamentals/getting-started/primers/promises) based APIs.

1. Creating the micro-service generator instance:
  ```js
  const MicroServiceGenerator = require('enapso-microservice-client');
  const generator = new MicroServiceGenerator({
    url: 'https://dash.innotrade.com/http',
    username: 'guest',
    password: 'guest'
  });
  ```

2. Preparing generator:
  ```js
  generator.open().then(() => {
    // generator is ready for use...
  }).catch(console.error);
  ```

2. Generating a micro-service instance (In this case the [EnapsoOntology](https://www.innotrade.com/pdf/web/?file=Innotrade-EnapsoOntologyAPI.pdf) micro-service):
  ```js
  let EOS;
  generator.getService('EnapsoOntology').then((response) => {
    EOS = response;
  }).catch(console.error);
  ```

3. Then, just invoke some methods (full example [here](https://demo.innotrade.com/enapso/demos/scripting/EnapsoOntology/))...
  ```js
  EOS.ontology.list({
    offset: 0,
    length: 50
  }).then((response) => {
      console.log(response);
  }).catch(console.error);
  ```

4. Join all together using a more elegant way, the [co library](https://www.npmjs.com/package/co):
  ```js
  const co = require('co');
  const MicroServiceGenerator = require('enapso-microservice-client');
  const generator = new MicroServiceGenerator({
    url: 'https://dash.innotrade.com/http',
    username: 'guest',
    password: 'guest'
  });

  co(function *(){
    // opening connection
    yield generator.open();
    // generate service
    let EOS = yield generator.getService('EnapsoOntology');
    // call methods...
    let response = yield EOS.ontology.list({
      offset: 0,
      length: 50
    });

    //...
    //... finally when all the work is done, close the connection
    yield generator.close();
  })
  ```

# Config params
```js
let config = {};
config.url = 'https://dash.innotrade.com/http'; // the Enapso Enterprise Server connection URL
config.username = 'guest'; // login username
config.password = 'guest'; // login password
config.autoSyncTimeout = 500; // timeout used by the HttpClient to automatically pull messages from the server. Min value: 400ms
```

# Roadmap
1. Automated test-cases generation and execution.

# Tests
```bash
$ git clone git@github.com:innotrade/enapso-microservice-client.git
$ cd enapso-microservice-client/
$ npm install
$ npm test
```