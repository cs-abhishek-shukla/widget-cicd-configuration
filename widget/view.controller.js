'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('cicdConfiguration100Ctrl', cicdConfiguration100Ctrl);

        cicdConfiguration100Ctrl.$inject = ['$scope', 'Entity', '$http', 'connectorService', 'WizardHandler', 'toaster', 'CommonUtils'];

    function cicdConfiguration100Ctrl($scope, Entity, $http, connectorService, WizardHandler, toaster, CommonUtils) {
    $scope.processingPicklist = false;
    $scope.processingConnector = false;
    $scope.envCompleted = false;
    $scope.close = close;
    $scope.moveNext = moveNext;
    $scope.movePrevious = movePrevious;
    $scope.moveEnvironmentNext = moveEnvironmentNext;
    $scope.moveVersionControlNext = moveVersionControlNext;
    $scope.versionControlConnectorName = 'github';
    $scope.connectorVersion = '100.9.9';
    $scope.versionControlConnector = {};
    $scope.selectedEnv = {};

    function _saveValues(parameters, config) {
        angular.forEach(parameters, function(parameter) {
            if (parameter.type == 'password'){
                config[parameter.name] = CommonUtils.isUndefined(parameter.value) ? 'NULL' : parameter.value;
            }
            else {
                config[parameter.name] = CommonUtils.isUndefined(parameter.value) ? '' : parameter.value;
            }
          if(parameter.parameters){//nested fields
            _saveValues(parameter.parameters, config);
          }
        });
    }
      
    function _saveConnectorConfig(connector){
        let newConfig = false;
        let data = angular.copy(connector);
        data = {
          connector: data.id,
          name: data.configName,
          connector_name: data.name,
          connector_version: data.verion,
          config_id: data.config,
          id: data.configId,
          default: true,
          config: {}
        };
        if(data.config_id === null){
          newConfig = true;
        }
        _saveValues(connector.configFields, data.config);

        connectorService.updateConnectorConfig(data, newConfig, false).then(function (response) {
          if (newConfig) {
              toaster.success({
                  body: 'Configuration created successfully.'
              });
          } else if (!deleteConfig) {
              toaster.success({
                  body: 'Configuration updated successfully.'
              });
        }
        }, function (error) {
          toaster.error({
            body: error.data.message ? error.data.message : error.data['hydra:description']
           });
        });
    }
      
    function close(){
        triggerPlaybook();
        $scope.$parent.$parent.$parent.$ctrl.handleClose();
    }

    function moveNext() {
        WizardHandler.wizard('solutionpackWizard').next();
    }
      
    function moveEnvironmentNext() {
        _loadConnectorDetails($scope.versionControlConnectorName, $scope.connectorVersion, $scope.versionControlConnector);
        WizardHandler.wizard('solutionpackWizard').next();
    }

    function moveVersionControlNext() {
        _saveConnectorConfig($scope.versionControlConnector);
        WizardHandler.wizard('solutionpackWizard').next();
    }

    function movePrevious() {
        WizardHandler.wizard('solutionpackWizard').previous();
    }

    function _init() {
        $scope.config = {};
        _loadAttributes();
    }

    function _loadConnectorDetails(connectorName, connectorVersion, connectorDetails){
        $scope.processingConnector = true;
        connectorService.getConnector(connectorName, connectorVersion).then(function(connector) {
           if (!connector){
             toaster.error({
              body: 'The Connector "' + connectorName + '" is not installed. Istall the connector and re-run thiz wizard to complete the configuration'
            });
             return;
           }
           connectorDetails.version  = connector.version;
           connectorDetails.configFields = connector.config_schema.fields;
           connectorDetails.name = connector.name;
           connectorDetails.id = connector.id;
           if (connector.configuration.length > 0) {
               var defaultConfig = _.find(connector.configuration, function (config) {
                  return config.default;
               });
               if (defaultConfig) {
                 connectorDetails.configuration = defaultConfig;
                 connectorDetails.configId = defaultConfig.id;
                 connectorDetails.config = defaultConfig.config_id;
                 connectorDetails.configName = defaultConfig.name;
               } else {
                 connectorDetails.configuration = connector.configuration[0];
                 connectorDetails.configId = connector.configuration[0].id;
                 connectorDetails.config = connector.configuration[0].config_id;
                 connectorDetails.configName = connector.configuration[0].name;
               }
           } else {
               connectorDetails.configuration = [];
               connectorDetails.configId = null;
               connectorDetails.config = null;
               connectorDetails.configName = 'Default Configuration';
           }
           $scope.processingConnector = false;
        });
    }
      
    function _loadAttributes() {
        $scope.processingPicklist = true;
        var entity = new Entity('change_management');
        entity.loadFields().then(function () {
            for (var key in entity.fields) {
                if (entity.fields[key].type === 'picklist' && key === 'environment') {
                    $scope.picklistField = entity.fields.environment;
                    $scope.processingPicklist = false;
                }
            }
        });
        console.log('fetched picklist details');
    }
      
    function triggerPlaybook() {
        var queryPayload =
        {
              "request": $scope.selectedEnv
        }
        var queryUrl = '/api/triggers/1/notrigger/936a5236-e7ca-4c44-b3cf-cce8937df365';
        $http.post(queryUrl, queryPayload).then(function (response) {
            console.log(response);
        });
    }
    
    _init();
}
})();