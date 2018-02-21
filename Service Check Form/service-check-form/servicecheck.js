namespace("fx.giantFormDesign")["servicecheck"] = (function () {

	var observable = ko.observable;
	var formRecordApi = fx.DataContext.Application.formRecord;
	var missionControlAPi=fx.DataContext.Application.missionControl;

	function viewModel(params) {

		var koFormId = params.formId;
		var koGetAllResponse = observable();
		var koPingOrConfig=observable("ping");
		var koTimer=observable(10);
		var koIsD=observable(false);
		var modelNeedCheck=["auditServiceUrl","dataAccessServiceUrl","dataManipulationServiceUrl","dataSearchServiceUrl","dataSemanticServiceUrl","jobServiceUrl","logServiceUrl","messagingServiceUrl","modernizeDataAccessServiceUrl","resourceManagementServiceUrl","modernizeDataManipulationServiceUrl"];
		var serviceCheckResonses=[];
		var currentRefreshInterval=null;

		executeGetAll();
		setInterval(executeGetAll,koTimer()*1000)

		function executeGetAll() {

			serviceCheckResonses=[];
			var selectedRegion=_.find(fx.Omni.userProfile.regions(), function(region){
				return region.isSelected()
				});
			var regionUniqueName=selectedRegion.entity.name;

			missionControlAPi.getComputed(regionUniqueName,{
				success:success,
				fail:fail
			});
		}

		function success(data)
		{
			var applicationServiceUrlModel=_.find(data,function(model){
				return model.dType=="applicationServiceUrlModule";
			});

			for(var service in applicationServiceUrlModel)
			{
				if(_.contains(modelNeedCheck,service))
				{
					var javaService={};
					javaService.name=service;
					javaService.url=applicationServiceUrlModel[service];					
					serviceHealthChecking(javaService);
				}
			}

			
		}

		function fail(jqXhr,textStatus,error,event){
			event.isPreventDefault=true;
			responseString="service error";
			var serviceCheckResonse= {};
					serviceCheckResonse.serviceName=service.none;
					serviceCheckResonse.response=responseString;
					serviceCheckResonse.isHealth=false;
					serviceCheckResonses.push(serviceCheckResonse);
			koGetAllResponse(serviceCheckResonses);
		}

		function serviceHealthChecking(service)
		{
			var hostname=getHostNameByUrl(service.url);
			var host=hostname.split(':')[0];
			var port=hostname.split(':')[1];
			var options= {
				"host":host,
				"port":port,
				"pingOrConfig":koPingOrConfig(),
				"isd":koIsD()
			};

			formRecordApi.getAll(koFormId(),options, {
				success: function (response) {
					
					var serviceCheckResonse= {};
					serviceCheckResonse.serviceName=service.name;
					serviceCheckResonse.response=generateResponseString(response);
					serviceCheckResonses.push(serviceCheckResonse);	
					serviceCheckResonse.isHealth=true;
					koGetAllResponse(serviceCheckResonses);
				},
				fail: function (jqXhr,textStatus,error,event){
					event.isPreventDefault=true;
					var serviceCheckResonse= {};
					serviceCheckResonse.serviceName=service.name;
					serviceCheckResonse.response=error;
					serviceCheckResonse.isHealth=false;
					serviceCheckResonses.unshift(serviceCheckResonse);	
					koGetAllResponse(serviceCheckResonses);
				}
			})
		}


		function generateResponseString(response)
		{
			var responseString="";
			if(isJson(response[0].response))			
			{
				var jsonObj=JSON.parse(response[0].response);
				responseString= JSON.stringify(jsonObj,null,4);
			}
			else
			{
				responseString=response[0].response;
			}

			return responseString;
		}

		function isJson(value)
		{
			try{
				JSON.parse(value);
			}
			catch(e){
				return false;
			}
			return true;
		}

		function getHostNameByUrl(url){
			var hostname;

			if (url.indexOf("://") > -1) {
				hostname = url.split('/')[2];
			}
			else {
				hostname = url.split('/')[0];
			}

			return hostname;
		}

		koTimer.subscribe(function(newValue){
			if(!newValue){
				clearInterval(currentRefreshInterval);
				return;
			}

			if(currentRefreshInterval)
			clearInterval(currentRefreshInterval);

			currentRefreshInterval=setInterval(executeGetAll,newValue*1000);

		});

		var me = this;
		$.extend(me, {
			formId: koFormId,

			getAllResponse: koGetAllResponse,
			pingOrConfig: koPingOrConfig,
			isd:koIsD,
			timer:koTimer,


			executeGetAll: executeGetAll
		})
	}


	return {
		viewModel: viewModel
	}

})();