'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require("http");
//var boolParser=require("express-query-boolean");
app.use(bodyParser.json());
//app.use(boolParser());
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/api/checkservice/', (req, resMain) => {
    var query=req.query;
    console.log(query); //install_addr: plan:
    var host = query.host;
    var port=query.port;
    var pingOrConfig=query.pingOrConfig;
    var isd=query.isd;
    var path="";

    if(host == null || port == null || pingOrConfig == null)
        return resMain.json("Please fill in correct paramter, host, ping or config must fill in. thanks");

    if(isd=="true")
    {
        path="/"+pingOrConfig+"?d="+isd;
    }
    else
    {
        path="/"+pingOrConfig;
    }
        

    var options={
        host:host,
        port:port,
        path:path,
        method:'GET',
        headers:{
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
			if(responseString!="pong")
			{
				var jsonArray=[JSON.parse(responseString)];
				resMain.send(jsonArray);
			}
			else{
				var jsonArray=[{"response":responseString}]
				resMain.send(jsonArray);
			}
            
        });

    })
    get_req.on('error', function (e) {
		console.log(e);
        resMain.send("error"+e);
    });
    get_req.end();
    
});

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

app.set('port', process.env.PORT || 2727);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});
