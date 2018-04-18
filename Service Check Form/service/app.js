'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require("http");
var mongodb = require("mongodb");
var orientdb = require("node-orientdb-http");
var pg = require("pg");
var ioredis = require("ioredis");
var elasticsearch = require('elasticsearch');
var amqp = require('amqplib/callback_api');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/api/healthCheck/', (req, resMain) => {
    var query = req.query;
    console.log(query);
    var checkType = query.checkType;
    var checkTypes = {
        mongoDd: "Mongodb",
        redis: "Redis",
        postgres: "Postgres",
        rabbitmq: "RabbitMq",
        orientdb: "OrientDb",
        elasticsearch: "Elasticsearch",
        service: "Service"
    };

    if (checkType == checkTypes.elasticsearch)
        checkElasticsearchConnection(query, resMain);
    else if (checkType == checkTypes.mongoDd)
        checkMongodbConnection(query, resMain);
    else if (checkType == checkTypes.orientdb)
        checkOrinetDbConnection(query, resMain);
    else if (checkType == checkTypes.postgres)
        checkPostgreConnection(query, resMain);
    else if (checkType == checkTypes.rabbitmq)
        checkRabbitMqConnection(query, resMain);
    else if (checkType == checkTypes.redis)
        checkRedisConnection(query, resMain);
    else if (checkType == checkTypes.service)
        checkServiceHealth(query, resMain);
});

function checkElasticsearchConnection(query, resMain) {
    var host = query.host;
    var port = query.port;

    var client = new elasticsearch.Client({
        host: host + ":" + port,
        log: 'trace'
    });

    client.ping({
        requestTimeout: Infinity,
        hello: "elasticsearch!"
    }, function (err) {
        if (err) {
			var jsonArray = [{ "response": "Unable to connect to the Elasticsearch server. Error:" + err }];
                resMain.send(jsonArray);
            //resMain.send("Unable to connect to the Elasticsearch server. Error:" + err);
        } else {
			var jsonArray = [{ "response": "Connection established to Elasticsearch Server" }];
                resMain.send(jsonArray);
            //resMain.send("Connection established to Elasticsearch " + host);
        }
    });
}

function checkMongodbConnection(query, resMain) {
    var url = query.url;
    var MongoClient = mongodb.MongoClient;
    var connectingDb;

    connectingDb = MongoClient.connect(url, function (err, db) {
                if (err) {
					var jsonArray = [{ "response": "Unable to connect to the mongoDB server. Error:" + err }];
                    resMain.send(jsonArray);
                }
                else {
                    //console.log("can sonnection");
					var jsonArray = [{ "response": "Connection established to Mongo Server" }];
                    resMain.send(jsonArray);
                }
            });

}

function checkOrinetDbConnection(query, resMain) {
    var host = "http://" + query.host + ":" + query.port;
    var username = query.username;
    var password = query.password;
    var database = query.database;
    var connectingDb;

    var db = orientdb.connect({
        host: host,
        user: username,
        password: password,
        database: database
    });

    connectingDb = new Promise(
        function (resolve, reject) {

            db.on('connect', function () {
				var jsonArray = [{ "response": "Connection established to Mongo Server"}];
                resMain.send(jsonArray);
            });

            db.on('error', function (err) {
				var jsonArray = [{ "response": "Unable to connect to the OrientDb server. Error:" + err }];
                resMain.send(jsonArray);
            });
        });
}

function checkPostgreConnection(query, resMain) {
    var connectionstring = query.connectionstring;

    var client = new pg.Client(connectionstring);

    client.connect((err => {
        if (err)
		{
			var jsonArray = [{ "response": "Unable to connect to the OrientDb server. Error:" + err.stack }];
			resMain.send(jsonArray);
			
		}
        else
		{
			var jsonArray = [{ "response": "Connection established to Postgre Server"}];
                resMain.send(jsonArray);
		}
    }));

}

function checkRabbitMqConnection(query, resMain) {
    var connectionstring = query.connectionstring;

    amqp.connect(connectionstring + "?heartbeat=60", function (err, conn) {

        if (err) {
			var jsonArray=[{"response": "Unable to connect to the OrientDb server. Error:"+err}];
            resMain.send(jsonArray);
        }else
        {
            conn.on("error", function (err) {
                if (err.message !== "Connection closing") {
                   var jsonArray=[{"response": "Unable to connect to the OrientDb server. Error:"+err.message}];
					resMain.send(jsonArray);
                    return;
                }
            });
    
            conn.on("close", function () {
				var jsonArray=[{"response": "Unable to connect to the RabbitMQ server, reconnecting"}];
				resMain.send(jsonArray);
                return;
            });
    
			var jsonArray = [{ "response": "Connection established to RabbitMQ Server"}];
            resMain.send(jsonArray);
        }
      
    });
}

function checkRedisConnection(query, resMain) {
    var connectionstring = query.connectionstring;
    var redis;

    try {
        redis = new ioredis(connectionstring, { lazyConnect: true });

        redis.connect()
        .then(function(result){
			var jsonArray = [{ "response":"Connection established to Redis Server"}];
            resMain.send(jsonArray);   
            redis.disconnect();       
        })
        .catch(function (err) {
			var jsonArray = [{ "response":"Unable to connect to the Redis server, Error: " + err}];
            resMain.send(jsonArray);
        });

    }
    catch (err) {
       var jsonArray = [{ "response":"Unable to connect to the Redis server, Error: " + err}];
            resMain.send(jsonArray);
    }

}

function checkServiceHealth(query, resMain) {
    var host = query.host;
    var port = query.port;
    var pingOrConfig = query.pingOrConfig;
    var isd = query.isd;
    var path = "";
    if (host == null || port == null || pingOrConfig == null)
        return resMain.json("Please fill in correct paramter, host, ping or config must fill in. thanks");

    if (isd == "true") {
        path = "/" + pingOrConfig + "?d=" + isd;
    }
    else {
        path = "/" + pingOrConfig;
    }


    var options = {
        host: host,
        port: port,
        path: path,
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        },
    };

    console.log(options);

    var get_req = http.request(options, function (res) {

        var responseString = ''
        res.on('data', function (chunk) {
            responseString += chunk;
        });

        res.on('end', function (e) {
            if (responseString != "pong") {
                var jsonArray = [JSON.parse(responseString)];
                resMain.send(jsonArray);
            }
            else {
                var jsonArray = [{ "response": responseString }]
                resMain.send(jsonArray);
            }

        });

    })
    get_req.on('error', function (e) {
        console.log(e);
        resMain.send("error" + e);
    });
    get_req.end();
}


app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});
