'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('cicdConfiguration100Ctrl', cicdConfiguration100Ctrl);

        cicdConfiguration100Ctrl.$inject = ['$q', 'API', '$resource', '$scope', 'Entity', '$http', 'connectorService', 'currentPermissionsService', 
        'WizardHandler', 'toaster', 'CommonUtils', '$controller', '$window'];

    function cicdConfiguration100Ctrl($q, API, $resource, $scope, Entity, $http, connectorService, currentPermissionsService, 
      WizardHandler, toaster, CommonUtils, $controller, $window) {
    $controller('BaseConnectorCtrl', {
      $scope: $scope
    });
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
    $scope.envMacro = "cicd_env";
    $scope.versionControlConnector = {};
    $scope.selectedEnv = {};
    $scope.formHolder={};
    $scope.saveConnector = saveConnector;
      
    function _loadDynamicVariable(variableName) {
      var defer = $q.defer();
      var dynamicVariable = null;
      $resource(API.WORKFLOW + 'api/dynamic-variable/?offset=0&name='+variableName).get({}, function(data) {
        if (data['hydra:member'].length > 0) {
          dynamicVariable = data['hydra:member'][0].value;
        }
        defer.resolve(dynamicVariable);
      }, function(response) {
        defer.reject(response);
      });
      return defer.promise;
    }
      
    function saveConnector(saveFrom) {
      var data = angular.copy($scope.connector);
      if(CommonUtils.isUndefined(data)) {
        $scope.statusChanged = false;
        return;
      }
      if(!currentPermissionsService.availablePermission('connectors', 'update')) {
        $scope.statusChanged = false;
        return;
      }

      var newConfiguration, newConfig, deleteConfig;
      newConfiguration = false;
      if(saveFrom !== 'deleteConfigAndSave'){
        if (!_.isEmpty($scope.connector.config_schema)) {
          if (!$scope.validateConfigurationForm()) {
            return;
          }
        }
        if(!$scope.input.selectedConfiguration.id){
          newConfiguration = true;
          $scope.input.selectedConfiguration.config_id = $window.UUID.generate();
          if($scope.input.selectedConfiguration.default){
            angular.forEach(data.configuration, function(configuration) {
              if(configuration.config_id !== $scope.input.selectedConfiguration.config_id){
                configuration.default = false;
              }
            });
          }
          data.configuration.push($scope.input.selectedConfiguration);
          newConfig = $scope.input.selectedConfiguration;
        }
        delete data.newConfig;
      }

      if(saveFrom === 'deleteConfigAndSave') {
        deleteConfig = true;
      }

      var updateData = {
        connector: data.id,
        name: $scope.input.selectedConfiguration.name,
        config_id: $scope.input.selectedConfiguration.config_id,
        id: $scope.input.selectedConfiguration.id,
        default: $scope.input.selectedConfiguration.default,
        config: {},
        teams: $scope.input.selectedConfiguration.teams
      };
      $scope.saveValues($scope.input.selectedConfiguration.fields,updateData.config);
      $scope.processing = true;
      connectorService.updateConnectorConfig(updateData, newConfiguration, deleteConfig).then(function(response) {
       if(newConfig){
          $scope.connector.configuration.push(newConfig);
          if(newConfig.default){
            $scope.removeDefaultFromOthers();
          }

        }
        $scope.formHolder.connectorForm.$setPristine();
        if(!deleteConfig) {
          $scope.input.selectedConfiguration.id = response.id;
        }
        $scope.checkHealth();
        $scope.statusChanged = false;
      }, function(error){
        toaster.error({
          body: error.data.message? error.data.message: error.data['hydra:description'] 
        });
      }).finally(function(){
        $scope.processing = false;
    });
    }
      
    function close(){
        triggerPlaybook();
        $scope.$parent.$parent.$parent.$ctrl.handleClose();
    }

    function moveNext() {
        _loadDynamicVariable($scope.envMacro).then(function(dynamicVariable) {
          if (dynamicVariable !== null ){
            $scope.selectedEnv = {"picklist": JSON.parse(dynamicVariable)};
          }
        });
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
        WizardHandler.wizard('solutionpackWizard').next();
    }
      
    function moveEnvironmentNext() {
        _loadConnectorDetails($scope.versionControlConnectorName, $scope.connectorVersion, $scope.versionControlConnector);
        WizardHandler.wizard('solutionpackWizard').next();
    }

    function moveVersionControlNext() {
        WizardHandler.wizard('solutionpackWizard').next();
    }

    function movePrevious() {
        WizardHandler.wizard('solutionpackWizard').previous();
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
           $scope.selectedConnector = connector;
           $scope.loadConnector($scope.selectedConnector, false, false);
           $scope.processingConnector = false;
        });
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
}
})();