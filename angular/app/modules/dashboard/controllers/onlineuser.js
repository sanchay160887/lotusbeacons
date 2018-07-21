dashboard.controller("OnlineuserController", function($rootScope, $scope, apiService, $http, $interval, $location) {
	 //
    $scope.ListInitialized = false;

    if (!$rootScope.loggedInUser) {
        apiService.checkloginUser().then(function(res) {
            if (typeof(res.data.user) != undefined && res.data.user) {
                $rootScope.loggedInUser = res.data.user;
            } else {
                $location.path("/");
            }
        });
    }

    $scope.connection = true;
    $scope.connection_msg = false;
    $interval(function() {
        if (Offline.state == 'down') {
            $scope.connection = false;
        } else {
            if (!$scope.connection) {
                $scope.connection = true;
                $scope.connection_msg = true;
            }
        }
    }, 2000)

    $scope.$watchCollection('[connection_msg]', function() {
        if ($scope.connection_msg) {
            setTimeout(function() {
                $scope.connection_msg = false;
            }, 2000);
        }
    });

    var vm = this;

    $scope.userCurrentPage = 1;
    $scope.userPageSize = 10;
    $scope.pageChangeHandler2 = function(num) {
        console.log('going to page ' + num);
    };

    $scope.getAllEmployees = function() {
		//alert('onlineCtrl');
        $scope.ListInitialized = false;
        apiService.employeeData().then(function(res) {
            if (!res.data.IsSuccess) {
                $scope.ListInitialized = true;
                alert(res.data.message);
                return;
            }

            $scope.employeeData = res.data.data;
            $scope.O = 'Name';
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.ListInitialized = true;
			
        });
    }

    $scope.getAllEmployees();

})
