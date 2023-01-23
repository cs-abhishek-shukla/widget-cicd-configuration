    'use strict';
    (function () {
        angular
            .module('cybersponse')
            .controller('cicdConfiguration100Ctrl', cicdConfiguration100Ctrl);

        cicdConfiguration100Ctrl.$inject = ['$scope', 'Entity', '$http', 'ModalService', 'widgetService', 'WizardHandler'];

        function cicdConfiguration100Ctrl($scope, Entity, $http, ModalService, widgetService, WizardHandler) {
        $scope.processing = false;
        $scope.loadAttributes = loadAttributes;
        $scope.moveNext = moveNext;
        $scope.movePrevious = movePrevious;
        $scope.finish = finish;
        $scope.envCompleted = false;

        function moveNext() {
            WizardHandler.wizard('solutionpackWizard').next();

        }

        function movePrevious() {
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
            var queryUrl = '/api/triggers/1/notrigger/936a5236-e7ca-4c44-b3cf-cce8937df365';
            $http.post(queryUrl, queryPayload).then(function (response) {
                console.log(response);
            });
        }
        
        _init();
    }
})();
