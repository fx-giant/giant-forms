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
		var currentRefreshInterval = null;
		var serviceCheckResonses = [];

		executeGetAll();
		currentRefreshInterval = setInterval(executeGetAll, koTimer() * 1000)

		function executeGetAll() {

			var options = {
				"pingOrConfig": koPingOrConfig(),
				"isd": koIsD()
			};

			formRecordApi.getAll(koFormId(), options, {
				success: function (response) {
					serviceCheckResonses = [];

					for (var service in response) {

						if (_.isArray(response[service])) {
							var javaServices = response[service][0];
							for (var javaService in javaServices) {
								var serviceCheckResonse = {};
								serviceCheckResonse.serviceName = javaServices[javaService].serviceName;
								serviceCheckResonse.response = generateResponseString(javaServices[javaService].response);
								serviceCheckResonse.isHealth = javaServices[javaService].isHealth;
								if (serviceCheckResonse.isHealth)
									serviceCheckResonses.push(serviceCheckResonse);
								else
									serviceCheckResonses.unshift(serviceCheckResonse);

							}
						}
						else {
							var serviceCheckResonse = {};
							serviceCheckResonse.serviceName = response[service].serviceName;
							serviceCheckResonse.response = generateResponseString(response[service].response);
							serviceCheckResonse.isHealth = response[service].isHealth;
							if (serviceCheckResonse.isHealth)
								serviceCheckResonses.push(serviceCheckResonse);
							else
								serviceCheckResonses.unshift(serviceCheckResonse);
						}
					}

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
			if (_.isString(response)) {
				responseString = response;

			}
			else {
				responseString = JSON.stringify(response, null, 4);
			}

			return responseString;
		}

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