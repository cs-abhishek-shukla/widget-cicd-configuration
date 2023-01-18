    'use strict';
    (function () {
        angular
            .module('cybersponse')
            .controller('cicdConfiguration100DevCtrl', cicdConfiguration100DevCtrl);

        cicdConfiguration100DevCtrl.$inject = ['$scope', 'appModulesService', 'Entity', 'API', '$resource', '$http', 'ModalService', 'widgetService', 'WizardHandler'];

        function cicdConfiguration100DevCtrl($scope, appModulesService, Entity, API, $resource, $http, ModalService, widgetService, WizardHandler) {
        $scope.processing = false;
        $scope.loadAttributes = loadAttributes;
        $scope.moveNext = moveNext;
        $scope.movePrevious = movePrevious;
        $scope.finish = finish;
        $scope.currentStepNumber = 1;
        $scope.widgetCompleted = $scope.config.metadata.completed ? true : false;
        $scope.envCompleted = false;

        function moveNext() {
            $scope.currentStepNumber = $scope.currentStepNumber + 1;
            WizardHandler.wizard('solutionpackWizard').next();

        }

        function movePrevious() {
            $scope.currentStepNumber = $scope.currentStepNumber - 1;
            WizardHandler.wizard('solutionpackWizard').previous();
        }

        function finish() {
            var message = 'Please Confirm?';
            ModalService.confirm(message).then(function (result) {
                if (!result) {
                    return;
                }
                $scope.envCompleted = true;
                triggerPlaybook();
                $scope.config.metadata['completed'] = true;
                widgetService.updateWidget($scope.config.uuid, $scope.config).then(angular.noop);
            });
        }

        function _init() {
            $scope.config = {};
            loadAttributes();
        }
        function loadAttributes() {
            $scope.processing = true;
            var entity = new Entity('change_management');
            entity.loadFields().then(function () {
                for (var key in entity.fields) {
                    if (entity.fields[key].type === 'picklist' && key === 'environment') {
                        $scope.pickListField = entity.fields.environment;
                    }
                    $scope.processing = false;
                }
                console.log($scope.pickListField);
            });
        }

        function triggerPlaybook() {
            var queryPayload =
            {
                  "request": $scope.config.picklist
            }
            var queryUrl = '/api/triggers/1/notrigger/704ba250-5891-48b3-af40-3a9481c87966';
            $http.post(queryUrl, queryPayload).then(function (response) {
                console.log(response);
            });
        }
        
        _init();
    }
})();
