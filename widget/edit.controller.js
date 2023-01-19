'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editCicdConfiguration100Ctrl', editCicdConfiguration100Ctrl);

    editCicdConfiguration100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config'];

    function editCicdConfiguration100Ctrl($scope, $uibModalInstance, config) {
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
