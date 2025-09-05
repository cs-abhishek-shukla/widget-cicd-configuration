/* Copyright start
  MIT License
  Copyright (c) 2025 Fortinet Inc
  Copyright end */
'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editCicdConfiguration111Ctrl', editCicdConfiguration111Ctrl);

    editCicdConfiguration111Ctrl.$inject = ['$scope', '$uibModalInstance', 'config'];

    function editCicdConfiguration111Ctrl($scope, $uibModalInstance, config) {
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.config = config;

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function save() {
            $uibModalInstance.close($scope.config);
        }

    }
})();
