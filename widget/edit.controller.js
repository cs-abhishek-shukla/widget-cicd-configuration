'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editCicdConfiguration100DevCtrl', editCicdConfiguration100DevCtrl);

    editCicdConfiguration100DevCtrl.$inject = ['$scope', '$uibModalInstance', 'config'];

    function editCicdConfiguration100DevCtrl($scope, $uibModalInstance, config) {
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
