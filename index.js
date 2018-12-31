const http = require('http');
const url = require('url');
const config = require('./lib/config');
const {StringDecoder} = require('string_decoder'); 
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
const cluster = require("cluster");
const numCPU = require('os').cpus().length;


router = {
    "hello": handlers.hello,
    "users": handlers.users,
    "tokens": handlers.tokens
};

if(cluster.isMaster) {
    console.log("Master started");
    for(let i = 0; i < numCPU; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log('worker '+worker.process.pid+" is stopped");
    });
} else {
    const httpServer = http.createServer((req, res) => {
        var parsedUrl = url.parse(req.url, true);
        var path = parsedUrl.pathname;
        var trimmedPath = path.replace(/^\/+|\/+$/g, '');
        var queryStringObject = parsedUrl.query;
        var decoder = new StringDecoder('utf-8');
        var method = req.method.toLowerCase();
        var headers = req.headers;
        var buffer = '';

        req.on('data', (data) => { buffer += decoder.write(data); });

        req.on('end', () => {
            buffer += decoder.end();
            console.log("reg: ", trimmedPath, buffer);

            let handler = typeof(router[trimmedPath]) !== 'undefined' 
                            ? router[trimmedPath] : handlers.notFound;

            var data = {
                'trimmedPath': trimmedPath,
                'queryStringObject': queryStringObject,
                'method': method,
                'headers': headers,
                'payload': helpers.parseJsonToObject(buffer)
            };
            console.log(data);
            handler(data, (code, payload) => {
                code = typeof(code) !== 'number' ? code : 200;
                payload = typeof(payload) == 'object' ? payload : {};
                let payloadString = JSON.stringify(payload);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(code);
                console.log("res: ", payloadString);
                res.end(payloadString);
            });
        });
    });

    httpServer.listen(config.httpPort, () => {
        console.log("Server started listening on port: ", config.httpPort, "pid = ", process.pid);
    });
}