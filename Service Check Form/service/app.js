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
var _ = require('underscore');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var checkTypes = {
    mongoDd: "Mongodb",
    redis: "Redis",
    postgres: "Postgres",
    rabbitmq: "RabbitMq",
    orientdb: "OrientDb",
    elasticsearch: "Elasticsearch",
    service: "Service"
};

app.use('/api/healthCheck/', (req, resMain) => {
    var query = req.query;

    //get missioncontrol url
    var missioncontrolUrl = process.env.MC;


    http.get(missioncontrolUrl, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            var responseData = JSON.parse(data);
            checkServiceAndDatabase(responseData, query, resMain);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

});



async function checkServiceAndDatabase(data, query, resMain) {

    var responseJson = [];

    var serviceResponse = await checkJavaService(data, query);
	//console.log("serviceResponse- " +serviceResponse);

    var mongoResponse = await checkMongoDbConnection(data);

    var postgreResponse = await checkPostgreConnection(data);

    var orientdbResponse = await checkOrientdbConnection(data);

    var redisResponse = await checkRedisConnection(data);

    var rabbitmqResponse = await checkRabbitMQConnection(data);

    var indexElasticSearchResponse = await checkIndexElasticsearchConnection(data);

    var loggingElasticsearchResponse = await checkLoggingElasticsearchConnection(data);

    responseJson.push(serviceResponse);

    if (mongoResponse.isHealth)
        responseJson.push(mongoResponse);
    else
        responseJson.unshift(mongoResponse);

    if (postgreResponse.isHealth)
        responseJson.push(postgreResponse);
    else
        responseJson.unshift(postgreResponse);

    if (orientdbResponse.isHealth)
        responseJson.push(orientdbResponse);
    else
        responseJson.unshift(orientdbResponse);

    if (redisResponse.isHealth)
        responseJson.push(redisResponse);
    else
        responseJson.unshift(redisResponse);

    if (rabbitmqResponse.isHealth)
        responseJson.push(rabbitmqResponse);
    else
        responseJson.unshift(rabbitmqResponse);

    if (indexElasticSearchResponse.isHealth)
        responseJson.push(indexElasticSearchResponse);
    else
        responseJson.unshift(loggingElasticsearchResponse);

    if (loggingElasticsearchResponse.isHealth)
        responseJson.push(loggingElasticsearchResponse);
    else
        responseJson.unshift(loggingElasticsearchResponse);

    resMain.send(responseJson);

}

function checkJavaService(data, query) {

    return new Promise((resolve, reject) => {

        var applicationServiceUrlModel = _.find(data, function (model) {
            return model.dType == "applicationServiceUrlModule";
        });

        var modelNeedCheck = ["auditServiceUrl", "dataAccessServiceUrl", "dataManipulationServiceUrl", "dataSearchServiceUrl", "dataSemanticServiceUrl", "jobServiceUrl", "logServiceUrl", "messagingServiceUrl", "modernizeDataAccessServiceUrl", "resourceManagementServiceUrl", "modernizeDataManipulationServiceUrl"];
        var allJavaServices = [];
        var options = [];
        for (var service in applicationServiceUrlModel) {
            if (_.contains(modelNeedCheck, service)) {


                var serviceUrl = applicationServiceUrlModel[service];
                var hostname = getHostNameByUrl(serviceUrl);
                var host = hostname.split(':')[0];
                var port = hostname.split(':')[1];
                var pingOrConfig = query.pingOrConfig;
                var isd = query.isd;

                var path = "";
                if (host == null || port == null || pingOrConfig == null)
                    response.response = "host, ping or config cannot be null";

                if (isd == "true") {
                    path = "/" + pingOrConfig + "?d=" + isd;
                }
                else {
                    path = "/" + pingOrConfig;
                }


                var option = {
                    service: service,
                    host: host,
                    port: port,
                    path: path,
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json"
                    },
                };

                options.push(option);
            }
        }

        Promise.all(options.map(doRequest)).then(function (value) {
            allJavaServices.push(value);
            resolve(allJavaServices);

        }).catch(function (error) {
            //allJavaServices.unshift(error);
			//console.log("all service - " +allJavaServices);
            //reject(error);

        });

    });

}

function doRequest(option) {
    return new Promise((resolve, reject) => {
		
		 var response = {};
            response.serviceName = option.service;
        var get_req = http.request(option, function (res) {

           
            var responseString = ''
            res.on('data', function (chunk) {
                responseString += chunk;
            });
            res.on('end', function (e) {
                if (responseString != "pong") {
                    if (isJson(responseString))
                        response.response = JSON.parse(responseString);
                    else
                        response.response = responseString;

                    response.isHealth = true;
                    resolve(response);
                }
                else {
                    response.response = responseString;
                    response.isHealth = true;
                    resolve(response);
                }

            });

        });

        get_req.on('error', function (e) {
			response.response ="server error";
            response.isHealth = false;
            resolve(response);
        });

        get_req.end();

    });
}

function isJson(value) {
    try {
        JSON.parse(value);
    }
    catch (e) {
        return false;
    }
    return true;
}



function getHostNameByUrl(url) {
    var hostname;

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    return hostname;
}

function checkMongoDbConnection(data) {

    return new Promise((resolve, reject) => {
        var mongoDbStorageModule = _.find(data, function (model) {
            return model.dType == "mongoDbStorageModule";
        });
        var url = mongoDbStorageModule.applicationMetadata.connectionString;
        var MongoClient = mongodb.MongoClient;
        var connectingDb;
        var response = {};
        response.serviceName = checkTypes.mongoDd;

        connectingDb = MongoClient.connect(url, function (err, db) {

            if (err) {
                response.response = "Unable to connect to the mongoDB server. Error:" + err;
                response.isHealth = false;
                reject(response);
            }
            else {
                response.response = "Connection established to Mongo Server";
                response.isHealth = true;
                resolve(response);
            }
        });
    });
}

function checkPostgreConnection(data) {

    return new Promise((resolve, reject) => {
        var postgresDbStorageModule = _.find(data, function (model) {
            return model.dType == "postgresDbStorageModule";
        });

        var connectionstring = "postgres://" + postgresDbStorageModule.applicationBuilderMetadata.userName + ":" + postgresDbStorageModule.applicationBuilderMetadata.password + "@" + postgresDbStorageModule.applicationBuilderMetadata.serverName + ":" + postgresDbStorageModule.applicationBuilderMetadata.port + "/" + postgresDbStorageModule.applicationBuilderMetadata.database;

        var client = new pg.Client(connectionstring);

        var response = {};
        response.serviceName = checkTypes.postgres;

        client.connect((err => {
            if (err) {
                response.response = "Unable to connect to the OrientDb server. Error:" + err.stack;
                response.isHealth = false;
                reject(response);
            }
            else {
                response.response = "Connection established to Postgre Server";
                response.isHealth = true;
                resolve(response);
            }
        }));
    });

}

function checkOrientdbConnection(data) {
    return new Promise((resolve, reject) => {
        var orientDbStorageModule = _.find(data, function (model) {
            return model.dType == "orientDbStorageModule";
        });

        var host = "http://" + orientDbStorageModule.dataSemanticMetadata.serverName + ":2480";
        var username = orientDbStorageModule.dataSemanticMetadata.userName;
        var password = orientDbStorageModule.dataSemanticMetadata.password;
        var database = orientDbStorageModule.dataSemanticMetadata.database;
        var response = {};
        response.serviceName = checkTypes.orientdb;

        var db = orientdb.connect({
            host: host,
            user: username,
            password: password,
            database: database
        });

        db.on('connect', function () {
            response.response = "Connection established to Mongo Server";
            response.isHealth = true;
            resolve(response);
        });

        db.on('error', function (err) {
            response.response = "Unable to connect to the OrientDb server. Error:" + err;
            response.isHealth = false;
            reject(response);
        });
    });
}

function checkRedisConnection(data) {
    return new Promise((resolve, reject) => {
        var redisServiceUrlModule = _.find(data, function (model) {
            return model.dType == "redisServiceUrlModule";
        });
        var connectionstring;

        if (redisServiceUrlModule.applicationRedisServiceUrl.password)
            connectionstring = "redis://auth:" + redisServiceUrlModule.applicationRedisServiceUrl.password + "@" + redisServiceUrlModule.applicationRedisServiceUrl.serverName + ":" + redisServiceUrlModule.applicationRedisServiceUrl.port;
        else
            connectionstring = "redis://" + redisServiceUrlModule.applicationRedisServiceUrl.serverName + ":" + redisServiceUrlModule.applicationRedisServiceUrl.port;
        //have password
        var redis;

        var response = {};
        response.serviceName = checkTypes.redis;

        try {
            redis = new ioredis(connectionstring, { lazyConnect: true });

            redis.connect()
                .then(function (result) {
                    response.response = "Connection established to Redis Server";
                    response.isHealth = true;
                    redis.disconnect();
                    resolve(response);
                })
                .catch(function (err) {
                    response.response = "Unable to connect to the Redis server, Error: " + err;
                    response.isHealth = false;
                    reject(response);
                });

        }
        catch (err) {
            response.response = "Unable to connect to the Redis server, Error: " + err;
            response.isHealth = false;
            reject(response);
        }
    });
}

function checkRabbitMQConnection(data) {
    return new Promise((resolve, reject) => {
        var rabbitMqServiceUrlModule = _.find(data, function (model) {
            return model.dType == "rabbitMqServiceUrlModule";
        });
        var connectionstring;
        //have password 
        if (rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.password)
            connectionstring = "amqp://" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.userName + ":" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.password + "@" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.serverName;
        else
            connectionstring = "amqp://" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.serverName;

        var response = {};
        response.serviceName = checkTypes.rabbitmq;

        amqp.connect(connectionstring + "?heartbeat=60", function (err, conn) {

            if (err) {
                response.response = "Unable to connect to the OrientDb server. Error:" + err;
                response.isHealth = false;
                reject(response);
            } else {
                conn.on("error", function (err) {
                    if (err.message !== "Connection closing") {
                        response.response = "Unable to connect to the OrientDb server. Error:" + err.message;
                        response.isHealth = false;
                        reject(response);
                    }
                });

                conn.on("close", function () {
                    response.response = "Unable to connect to the RabbitMQ server, reconnecting";
                    response.isHealth = false;
                    reject(response);
                });

                response.response = "Connection established to RabbitMQ Server";
                response.isHealth = true;
                resolve(response);
            }
        });
    });
}

function checkIndexElasticsearchConnection(data) {
    return new Promise((resolve, reject) => {
        var elasticsearchStorageModule = _.find(data, function (model) {
            return model.dType == "elasticsearchStorageModule";
        });

        var moduleName = "Index " + checkTypes.elasticsearch;

        var host = elasticsearchStorageModule.indexMetadata.serverName;
        var port = 9200;

        var client = new elasticsearch.Client({
            host: host + ":" + port,
            log: 'trace'
        });

        client.ping({
            requestTimeout: Infinity,
            hello: "elasticsearch!"
        }, function (err) {
            var response = {};
            response.serviceName = moduleName;
            if (err) {
                response.response = "Unable to connect to the Elasticsearch server. Error:" + err;
                response.isHealth = false;
                reject(response);
            } else {
                response.response = "Connection established to Elasticsearch Server";
                response.isHealth = true;
                resolve(response);
            }
        });
    });
}

function checkLoggingElasticsearchConnection(data) {
    return new Promise((resolve, reject) => {
        var elasticsearchStorageModule = _.find(data, function (model) {
            return model.dType == "elasticsearchStorageModule";
        });
        var moduleName = "Logging " + checkTypes.elasticsearch;

        var host = elasticsearchStorageModule.indexMetadata.serverName;
        var port = 9200;

        var client = new elasticsearch.Client({
            host: host + ":" + port,
            log: 'trace'
        });

        client.ping({
            requestTimeout: Infinity,
            hello: "elasticsearch!"
        }, function (err) {
            var response = {};
            response.serviceName = moduleName;
            if (err) {
                response.response = "Unable to connect to the Elasticsearch server. Error:" + err;
                response.isHealth = false;
                reject(response);
            } else {
                response.response = "Connection established to Elasticsearch Server";
                response.isHealth = true;
                resolve(response);
            }
        });
    });
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
