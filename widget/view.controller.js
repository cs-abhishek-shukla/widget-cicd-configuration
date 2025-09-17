/* Copyright start
  MIT License
  Copyright (c) 2025 Fortinet Inc
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('cicdConfiguration111Ctrl', cicdConfiguration111Ctrl);

  cicdConfiguration111Ctrl.$inject = ['$q', 'widgetUtilityService', 'API', '$resource', '$scope', 'Entity', '$http', 'connectorService', 'currentPermissionsService', 'WizardHandler', 'toaster', 'CommonUtils', '$controller', '$window', 'ALL_RECORDS_SIZE', '_', 'marketplaceService', '$state', '$timeout', '$rootScope', 'widgetBasePath', 'websocketService'];

  function cicdConfiguration111Ctrl($q, widgetUtilityService, API, $resource, $scope, Entity, $http, connectorService, currentPermissionsService, WizardHandler, toaster, CommonUtils, $controller, $window, ALL_RECORDS_SIZE, _, marketplaceService, $state, $timeout, $rootScope, widgetBasePath, websocketService) {
    $controller('BaseConnectorCtrl', {
      $scope: $scope
    });
    $scope.processingPicklist = false;
    $scope.processingConnector = false;
    $scope.envCompleted = false;
    $scope.isPlaybookExecuted = false;
    $scope.configPlaybookTaskID = '';
    $scope.close = close;
    $scope.moveNext = moveNext;
    $scope.movePrevious = movePrevious;
    $scope.moveEnvPrevious = moveEnvPrevious;
    $scope.moveEnvironmentNext = moveEnvironmentNext;
    $scope.moveVersionControlNext = moveVersionControlNext;
    $scope.moveSourceControlNext = moveSourceControlNext;
    $scope.isLightTheme = $rootScope.theme.id === 'light';
    $scope.widgetBasePath = widgetBasePath;
    $scope.startInfoGraphics = $scope.isLightTheme ? widgetBasePath + 'images/start-light.png' : widgetBasePath + 'images/start-dark.png';
    $scope.defineEnvironmentInfoGraphics = $scope.isLightTheme ? widgetBasePath + 'images/define-environment-light.png' : widgetBasePath + 'images/define-environment-dark.png';
    $scope.configureSourceControlInfoGraphics = $scope.isLightTheme ? widgetBasePath + 'images/configure-source-control-light.png' : widgetBasePath + 'images/configure-source-control-dark.png';
    $scope.selectSourceControlInfoGraphics = $scope.isLightTheme ? widgetBasePath + 'images/select-source-control-light.png' : widgetBasePath + 'images/select-source-control-dark.png';
    $scope.finishInfoGraphics = widgetBasePath + 'images/finish.png';
    $scope.saveConnector = saveConnector;
    $scope.envMacro = "cicd_env";
    $scope.formHolder = {};
    $scope.configuredEnv = {
      sourceControl: {},
      selectedEnv: {}
    };
    $scope.onEnvSelect = function ($item) {
      $scope.processingPicklist = true;
    };

    $scope.onEnvRemove = function ($item) {
      if ($scope.configuredEnv.selectedEnv.picklist.length === 0) {
        $scope.processingPicklist = false;
      }
    };

    $scope.onSourceControlSelect = function () {
      $scope.selectedSourceControl = true;
    };

    $scope.parent_wf_id = '';
    var subscription;

    $scope.$on('websocket:reconnect', function () {
      initWebsocket();
    });

    function initWebsocket() {
      websocketService.subscribe('runningworkflow', function (data) {
        if (data.parent_wf === 'null') {
          $scope.parent_wf_id = data.instance_ids;
        }
        if (data.sourceWebsocketId !== websocketService.getWebsocketSessionId()) {
          if ($scope.taskId && data.task_id && data.task_id === $scope.taskId && data.parent_wf === 'null') {
            $scope.taskId = undefined;
          }
        }
        if ((data.status === 'failed' || data.status === 'finished with error' || data.status === 'finished') && $scope.configPlaybookTaskID === data.task_id) {
          _getPlaybookResult();
        }
      }).then(function (data) {
        subscription = data;
      });
    }

    $scope.$on('$destroy', function () {
      if (subscription) {
        // Unsubscribe
        websocketService.unsubscribe(subscription);
      }
    });

    function _getPlaybookResult() {
      var endpoint = API.WORKFLOW + 'api/workflows/' + $scope.parent_wf_id + '/';
      $http.get(endpoint).then(function (response) {
        if (response.data.status === 'finished') {
          if (subscription) {
            websocketService.unsubscribe(subscription);
          }
          WizardHandler.wizard('solutionpackWizard').next();
        }
        else if (response.data.status === 'finished with error' || response.data.status === 'failed') {
          if (!$scope.isToaster) {
            toaster.warning({
              body: "The \"Setup CICD Environment\" playbook has failed. Check the playbook logs for details."
            });
            $scope.isToaster = true;
            websocketService.unsubscribe(subscription);
          }
        }
        $scope.isPlaybookExecuted = false;
      });
    }

    function _loadDynamicVariable(variableName) {
      var defer = $q.defer();
      var dynamicVariable = null;
      $resource(API.WORKFLOW + 'api/dynamic-variable/?offset=0&name=' + variableName).get({}, function (data) {
        if (data['hydra:member'].length > 0) {
          dynamicVariable = data['hydra:member'][0].value;
        }
        defer.resolve(dynamicVariable);
      }, function (response) {
        defer.reject(response);
      });
      return defer.promise;
    }

    function saveConnector(saveFrom) {
      $scope.isConnectorConfigured = true;
      $scope.configuredConnector = false;
      var data = angular.copy($scope.connector);
      if (CommonUtils.isUndefined(data)) {
        $scope.statusChanged = false;
        return;
      }
      if (!currentPermissionsService.availablePermission('connectors', 'update')) {
        $scope.statusChanged = false;
        return;
      }

      var newConfiguration, newConfig, deleteConfig;
      newConfiguration = false;
      if (saveFrom !== 'deleteConfigAndSave') {
        if (!_.isEmpty($scope.connector.config_schema)) {
          if (!$scope.validateConfigurationForm()) {
            return;
          }
        }
        if (!$scope.input.selectedConfiguration.id) {
          newConfiguration = true;
          $scope.input.selectedConfiguration.config_id = $window.UUID.generate();
          if ($scope.input.selectedConfiguration.default) {
            angular.forEach(data.configuration, function (configuration) {
              if (configuration.config_id !== $scope.input.selectedConfiguration.config_id) {
                configuration.default = false;
              }
            });
          }
          data.configuration.push($scope.input.selectedConfiguration);
          newConfig = $scope.input.selectedConfiguration;
        }
        delete data.newConfig;
      }

      if (saveFrom === 'deleteConfigAndSave') {
        $scope.isConnectorConfigured = false;
        deleteConfig = true;
        $scope.isConnectorHealthy = false;
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
      $scope.saveValues($scope.input.selectedConfiguration.fields, updateData.config);
      $scope.processing = true;
      connectorService.updateConnectorConfig(updateData, newConfiguration, deleteConfig).then(function (response) {
        if (newConfig) {
          $scope.connector.configuration.push(newConfig);
          if (newConfig.default) {
            $scope.removeDefaultFromOthers();
          }

        }
        $scope.formHolder.connectorForm.$setPristine();
        if (!deleteConfig) {
          $scope.input.selectedConfiguration.id = response.id;
          $scope.configuredConnector = true;
          $scope.isConnectorHealthy = true;
        }
        $scope.checkHealth();
        $scope.statusChanged = false;
      }, function (error) {
        toaster.error({
          body: error.data.message ? error.data.message : error.data['hydra:description']
        });
      }).finally(function () {
        $scope.processing = false;
      });
    }

    function close() {
      $timeout(function () { $window.location.reload(); }, 3000);
      $state.go('main.modules.list', { module: 'change_management' }, { reload: true });
    }

    function moveNext() {
      $scope.processingPicklist = false;
      _loadDynamicVariable($scope.envMacro).then(function (dynamicVariable) {
        if (dynamicVariable !== null) {
          var jsonDynamicVariable = JSON.parse(dynamicVariable);
          var envType = jsonDynamicVariable.env_config;
          $scope.configuredEnv.selectedEnv = { "picklist": envType };
          $scope.processingPicklist = true;
        }
      });
      var entity = new Entity('change_management');
      entity.loadFields().then(function () {
        for (var key in entity.fields) {
          if (entity.fields[key].type === 'picklist' && key === 'environment') {
            $scope.picklistField = _.reject(entity.fields.environment.options, obj => obj.itemValue === 'Undefined');
          }
        }
      });
      WizardHandler.wizard('solutionpackWizard').next();
    }

    function moveEnvironmentNext() {
      _loadConnectorDetails($scope.configuredEnv.sourceControl.name, $scope.configuredEnv.sourceControl.version, $scope.configuredEnv.sourceControl);
      WizardHandler.wizard('solutionpackWizard').next();
    }

    function moveSourceControlNext() {
      $scope.selectedSourceControl = false;
      _loadDynamicVariable($scope.envMacro).then(function (dynamicVariable) {
        if (dynamicVariable !== null) {
          var jsonDynamicVariable = JSON.parse(dynamicVariable);
          var source_control = jsonDynamicVariable.source_control;
          $scope.defaultSourceControl = source_control;
          $scope.configuredEnv.sourceControl = $scope.defaultSourceControl;
          $scope.selectedSourceControl = true;
        }
      });
      WizardHandler.wizard('solutionpackWizard').next();
    }

    function moveVersionControlNext() {
      triggerPlaybook();
    }

    function movePrevious() {
      $scope.isPlaybookExecuted = false;
      if (subscription) {
        websocketService.unsubscribe(subscription);
      }
      WizardHandler.wizard('solutionpackWizard').previous();
    }

    function moveEnvPrevious() {
      WizardHandler.wizard('solutionpackWizard').previous();
    }

    function _loadConnectorDetails(connectorName, connectorVersion, sourceControl) {
      $scope.processingConnector = true;
      $scope.configuredConnector = false;
      $scope.isConnectorHealthy = false;
      connectorService.getConnector(connectorName, connectorVersion).then(function (connector) {
        marketplaceService.getContentDetails(API.BASE + 'solutionpacks/' + sourceControl.uuid + '?$relationships=true').then(function (response) {
          $scope.contentDetail = response.data;
          if (connector.configuration.length > 0) {
            $scope.configuredConnector = true;
            $scope.isConnectorConfigured = true;
            connectorService.getConnectorHealth(response.data, connector.configuration[0].config_id, connector.configuration[0].agent).then(function (data) {
              if (data.status === "Available") {
                $scope.isConnectorHealthy = true;
              }
            });
          }
          else {
            $scope.isConnectorConfigured = false;
          }
        });
        if (!connector) {
          toaster.error({
            body: 'The Connector "' + connectorName + '" is not installed. Install the connector and re-run this wizard to complete the configuration'
          });
          return;
        }
        $scope.selectedConnector = connector;
        $scope.loadConnector($scope.selectedConnector, false, false);
        $scope.processingConnector = false;
      });
    }

    function triggerPlaybook() {
      $scope.isToaster = false;
      initWebsocket();
      var queryPayload =
      {
        "request": $scope.configuredEnv
      }
      var queryUrl = API.MANUAL_TRIGGER + '936a5236-e7ca-4c44-b3cf-cce8937df365';
      $http.post(queryUrl, queryPayload).then(function (response) {
        $scope.configPlaybookTaskID = response.data.task_id;
        $scope.isPlaybookExecuted = true;
      });
    }

    function _handleTranslations() {
      widgetUtilityService.checkTranslationMode($scope.$parent.model.type).then(function () {
        $scope.viewWidgetVars = {
          // Create your translating static string variables here
          WIDGET_LABEL: widgetUtilityService.translate('cicdConfiguration.WIDGET_LABEL'),
          BACK_BTN: widgetUtilityService.translate('cicdConfiguration.BACK_BTN'),
          NEXT_BTN: widgetUtilityService.translate('cicdConfiguration.NEXT_BTN'),
          SAVE_BTN: widgetUtilityService.translate('cicdConfiguration.SAVE_BTN'),
          CANCEL_BTN: widgetUtilityService.translate('cicdConfiguration.CANCEL_BTN'),
          SKIP_BTN: widgetUtilityService.translate('cicdConfiguration.SKIP_BTN'),
          FINISH_BTN: widgetUtilityService.translate('cicdConfiguration.FINISH_BTN'),

          START_PAGE_DESC: widgetUtilityService.translate('cicdConfiguration.START_PAGE_DESC'),
          START_PAGE_DESC1: widgetUtilityService.translate('cicdConfiguration.START_PAGE_DESC1'),
          START_PAGE_NEXT_BUTTON: widgetUtilityService.translate('cicdConfiguration.START_PAGE_NEXT_BUTTON'),

          DEFINE_ENV_PAGE_TITLE: widgetUtilityService.translate('cicdConfiguration.DEFINE_ENV_PAGE_TITLE'),
          DEFINE_ENV_PAGE_DESC: widgetUtilityService.translate('cicdConfiguration.DEFINE_ENV_PAGE_DESC'),
          DEFINE_ENV_PAGE_DESC1: widgetUtilityService.translate('cicdConfiguration.DEFINE_ENV_PAGE_DESC1'),

          SOURCE_CONTROL_TITLE: widgetUtilityService.translate('cicdConfiguration.SOURCE_CONTROL_TITLE'),
          SOURCE_CONTROL_DESC: widgetUtilityService.translate('cicdConfiguration.SOURCE_CONTROL_DESC'),
          SOURCE_CONTROL_DESC1: widgetUtilityService.translate('cicdConfiguration.SOURCE_CONTROL_DESC1'),

          CONFIG_SOURCE_CONTROL_TITLE: widgetUtilityService.translate('cicdConfiguration.CONFIG_SOURCE_CONTROL_TITLE'),

          FINISH_PAGE_SUCCESS_MSG: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_SUCCESS_MSG'),
          FINISH_PAGE_ERROR_MSG: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_ERROR_MSG'),
          FINISH_PAGE_NAVIGATE: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_NAVIGATE'),
          FINISH_PAGE_NAVIGATE1: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_NAVIGATE1'),
          FINISH_PAGE_NAVIGATE2: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_NAVIGATE2'),
          FINISH_PAGE_SUMMARY_LABEL: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_SUMMARY_LABEL'),
          FINISH_PAGE_SUMMARY_LABEL1: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_SUMMARY_LABEL1'),
          FINISH_PAGE_SUMMARY_LABEL2: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_SUMMARY_LABEL2'),
          FINISH_PAGE_SUMMARY_LABEL3: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_SUMMARY_LABEL3'),
          FINISH_PAGE_SUMMARY_LABEL4: widgetUtilityService.translate('cicdConfiguration.FINISH_PAGE_SUMMARY_LABEL4'),
        };
      });
    }

    function _init() {
      _handleTranslations();
      var queryString = {
        $limit: ALL_RECORDS_SIZE,
        name: 'Solution Pack Category'
      };
      $resource(API.BASE + 'picklist_names').get(queryString).$promise.then(function (response) {
        var sourceCodeManagementPicklist = _.find(response['hydra:member'][0].picklists, { itemValue: 'Source Code Management' });
        var queryBody = {
          "logic": "AND",
          "filters": [
            {
              "field": "category",
              "operator": "in",
              "value": [
                sourceCodeManagementPicklist["@id"]
              ]
            }
          ]
        };
        $resource(API.QUERY + 'solutionpacks').save({ $limit: ALL_RECORDS_SIZE }, queryBody).$promise.then(function (response) {
          if (response['hydra:member'] && response['hydra:member'].length > 0) {
            $scope.sourceControls = _.chain(response['hydra:member'])
              .filter(obj => obj.name === 'gitlab' || obj.name === 'github')
              .map(obj => _.pick(obj, ['name', 'label', 'version', 'uuid']))
              .value();
          }
        });
      });
    }
    _init();
  }
})();
