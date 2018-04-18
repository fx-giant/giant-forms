namespace("fx.giantFormDesign")["servicecheck"] = (function () {

	var observable = ko.observable;
	var formRecordApi = fx.DataContext.Application.formRecord;
	var missionControlAPi = fx.DataContext.Application.missionControl;

	function viewModel(params) {

		var koFormId = params.formId;
		var koGetAllResponse = observable();
		var koPingOrConfig = observable("ping");
		var koTimer = observable(10);
		var koIsD = observable(false);
		var modelNeedCheck = ["auditServiceUrl", "dataAccessServiceUrl", "dataManipulationServiceUrl", "dataSearchServiceUrl", "dataSemanticServiceUrl", "jobServiceUrl", "logServiceUrl", "messagingServiceUrl", "modernizeDataAccessServiceUrl", "resourceManagementServiceUrl", "modernizeDataManipulationServiceUrl"];
		var serviceCheckResonses = [];
		var currentRefreshInterval = null;
		var checkTypes = {
			mongoDd: "Mongodb",
			redis: "Redis",
			postgres: "Postgres",
			rabbitmq: "RabbitMq",
			orientdb: "OrientDb",
			elasticsearch: "Elasticsearch",
			service: "Service"
		};

		executeGetAll();
		currentRefreshInterval = setInterval(executeGetAll, koTimer() * 1000)

		function executeGetAll() {

			serviceCheckResonses = [];
			var selectedRegion = _.find(fx.Omni.userProfile.regions(), function (region) {
				return region.isSelected()
			});
			var regionUniqueName = selectedRegion.entity.name;

			missionControlAPi.getComputed(regionUniqueName, {
				success: success,
				fail: fail
			});
		}

		//#region mission control api options
		function success(data) {
			checkJavaService(data);

			//checkMongoDbConnection(data);

			//checkPostgreConnection(data);

			//checkOrientdbConnection(data);

			//checkRedisConnection(data);

			//checkRabbitMQConnection(data);

			//checkIndexElasticsearchConnection(data);

			//checkLoggingElasticsearchConnection(data);

		}

		function fail(jqXhr, textStatus, error, event) {
			event.isPreventDefault = true;
			responseString = "service error";
			var serviceCheckResonse = {};
			serviceCheckResonse.serviceName = service.none;
			serviceCheckResonse.response = responseString;
			serviceCheckResonse.isHealth = false;
			serviceCheckResonses.push(serviceCheckResonse);
			koGetAllResponse(serviceCheckResonses);
		}

		//#endregion end mission control api options

		//region database checking part
		function checkMongoDbConnection(data) {

			var mongoDbStorageModule = _.find(data, function (model) {
				return model.dType == "mongoDbStorageModule";
			});

			var url = mongoDbStorageModule.applicationMetadata.connectionString;
			//console.log(url);

			var options = {
				"checkType": checkTypes.mongoDd,
				"url": url
			};

			callFormAPI(options, checkTypes.mongoDd);

		}

		function checkPostgreConnection(data) {
			var postgresDbStorageModule = _.find(data, function (model) {
				return model.dType == "postgresDbStorageModule";
			});

			var connectionstring = "postgres://" + postgresDbStorageModule.applicationBuilderMetadata.userName + ":" + postgresDbStorageModule.applicationBuilderMetadata.password + "@" + postgresDbStorageModule.applicationBuilderMetadata.serverName + ":" + postgresDbStorageModule.applicationBuilderMetadata.port + "/" + postgresDbStorageModule.applicationBuilderMetadata.database;
			console.log("postgresDbStorageModule "+connectionstring);

			var options = {
				"checkType": checkTypes.postgres,
				"connectionstring": connectionstring
			};

			callFormAPI(options, checkTypes.postgres);

		}

		function checkOrientdbConnection(data) {
			var orientDbStorageModule = _.find(data, function (model) {
				return model.dType == "orientDbStorageModule";
			});

			var options = {
				"checkType": checkTypes.orientdb,
				"host": orientDbStorageModule.dataSemanticMetadata.serverName,
				"port": 2480,
				"username": orientDbStorageModule.dataSemanticMetadata.userName,
				"password": orientDbStorageModule.dataSemanticMetadata.password,
				"database": orientDbStorageModule.dataSemanticMetadata.database
			};

			console.log("orientDbStorageModule: "+options);
			callFormAPI(options, checkTypes.orientdb);
		}

		function checkRedisConnection(data) {
			var redisServiceUrlModule = _.find(data, function (model) {
				return model.dType == "redisServiceUrlModule";
			});
			var connectionstring;

			if (redisServiceUrlModule.applicationRedisServiceUrl.password)
				connectionstring = "redis://auth:" + redisServiceUrlModule.applicationRedisServiceUrl.password + "@" + redisServiceUrlModule.applicationRedisServiceUrl.serverName + ":" + redisServiceUrlModule.applicationRedisServiceUrl.port;
			else
				connectionstring = "redis://" + redisServiceUrlModule.applicationRedisServiceUrl.serverName + ":" + redisServiceUrlModule.applicationRedisServiceUrl.port;
			//have password 

			//console.log(connectionstring);

			var options = {
				"checkType": checkTypes.redis,
				"connectionstring": connectionstring
			};

			callFormAPI(options, checkTypes.redis);

		}

		function checkRabbitMQConnection(data) {
			var rabbitMqServiceUrlModule = _.find(data, function (model) {
				return model.dType == "rabbitMqServiceUrlModule";
			});
			var connectionstring;
			//have password 
			if (rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.password)
				connectionstring = "amqp://" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.userName + ":" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.password + "@" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.serverName;
			else
				connectionstring = "amqp://" + rabbitMqServiceUrlModule.applicationRabbitMqServiceUrl.serverName;
			console.log("rabbitMqServiceUrlModule: "+connectionstring);

			var options = {
				"checkType": checkTypes.rabbitmq,
				"connectionstring": connectionstring
			};

			callFormAPI(options, checkTypes.rabbitmq);
		}

		function checkIndexElasticsearchConnection(data) {
			var elasticsearchStorageModule = _.find(data, function (model) {
				return model.dType == "elasticsearchStorageModule";
			});

			var options = {
				"checkType": checkTypes.elasticsearch,
				"host": elasticsearchStorageModule.indexMetadata.serverName,
				"port": 9200
			};
			var moduleName = "Index " + checkTypes.elasticsearch;
			callFormAPI(options, moduleName);
		}

		function checkLoggingElasticsearchConnection(data) {
			var elasticsearchStorageModule = _.find(data, function (model) {
				return model.dType == "elasticsearchStorageModule";
			});

			var options = {
				"checkType": checkTypes.elasticsearch,
				"host": elasticsearchStorageModule.loggingMetadata.serverName,
				"port": 9202
			};
			var moduleName = "Logging " + checkTypes.elasticsearch;
			callFormAPI(options, moduleName);
		}

		//#endregions database checking part done

		//#region java service checking part
		function checkJavaService(data) {
			var applicationServiceUrlModel = _.find(data, function (model) {
				return model.dType == "applicationServiceUrlModule";
			});

			for (var service in applicationServiceUrlModel) {
				if (_.contains(modelNeedCheck, service)) {
					var javaService = {};
					javaService.name = service;
					javaService.url = applicationServiceUrlModel[service];
					serviceHealthChecking(javaService);
				}
			}
		}



		function serviceHealthChecking(service) {
			var hostname = getHostNameByUrl(service.url);
			var host = hostname.split(':')[0];
			var port = hostname.split(':')[1];
			var options = {
				"checkType": checkTypes.service,
				"host": host,
				"port": port,
				"pingOrConfig": koPingOrConfig(),
				"isd": koIsD()
			};

			callFormAPI(options, service.name);
		}

		//#endregion java service checking part

		//#region common function
		function callFormAPI(options, moduleName) {
			formRecordApi.getAll(koFormId(), options, {
				success: function (response) {

					var serviceCheckResonse = {};
					serviceCheckResonse.serviceName = moduleName;
					serviceCheckResonse.response = generateResponseString(response);
					serviceCheckResonses.push(serviceCheckResonse);
					serviceCheckResonse.isHealth = true;
					koGetAllResponse(serviceCheckResonses);
				},
				fail: function (jqXhr, textStatus, error, event) {
					event.isPreventDefault = true;
					var serviceCheckResonse = {};
					serviceCheckResonse.serviceName = moduleName;
					serviceCheckResonse.response = error;
					serviceCheckResonse.isHealth = false;
					serviceCheckResonses.unshift(serviceCheckResonse);
					koGetAllResponse(serviceCheckResonses);
				}
			})
		}


		function generateResponseString(response) {
			var responseString = "";
			if (isJson(response[0].response)) {
				var jsonObj = JSON.parse(response[0].response);
				responseString = JSON.stringify(jsonObj, null, 4);
			}
			else {
				responseString = response[0].response;
			}

			return responseString;
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

		//#endregion common function end

		koTimer.subscribe(function (newValue) {
			if (!newValue) {
				clearInterval(currentRefreshInterval);
				return;
			}

			if (currentRefreshInterval)
				clearInterval(currentRefreshInterval);

			currentRefreshInterval = setInterval(executeGetAll, newValue * 1000);

		});

		var me = this;
		$.extend(me, {
			formId: koFormId,

			getAllResponse: koGetAllResponse,
			pingOrConfig: koPingOrConfig,
			isd: koIsD,
			timer: koTimer,

			currentRefreshInterval: currentRefreshInterval,
			executeGetAll: executeGetAll
		})
	}

	viewModel.prototype.dispose = function () {
		var currentRefreshInterval = this.currentRefreshInterval;

		if (currentRefreshInterval)
			clearInterval(currentRefreshInterval);
	}

	return {
		viewModel: viewModel
	}

})();