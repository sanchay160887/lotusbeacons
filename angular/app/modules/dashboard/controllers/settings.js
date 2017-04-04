dashboard.controller("SettingController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.settingForm = {};

    $scope.GeoFancingRange = 0;
    $scope.MinStayTimeOfCustomerForEmployee = 0;

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

    $scope.getAllSetting = function() {
        $scope.ListInitialized = false;
        apiService.settingData().then(function(res) {
            if (!res.data.IsSuccess) {
                alert(res.data.message);
                return;
            }
            $scope.settingData = res.data.data;
            $scope.settingData = $scope.settingData[0];
            $scope.GeoFancingRange = Number($scope.settingData.GeoFancingRange);
            $scope.MinStayTimeOfCustomerForEmployee = Number($scope.settingData.MinStayTimeOfCustomerForEmployee);
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllSetting();



    $scope.processUser = function() {
        alert('hello');

        /*  if ($scope.button_GeoFancingRange == 'Update') {
              if ($scope.GeoFancingRange == '') {
                  alert('Please Enter GeoFancingRange');
                  return;
              }
               }
           else if ($scope.button_MinStayTimeOfCustomerForEmployee== 'Update') {

            if($scope.MinStayTimeOfCustomerForEmployee == '') {
                  alert('Min Stay Time field required');
                  return;
              }

          }
         */

        $scope.FormInitialized = false;
        alert($scope.GeoFancingRange);
        alert($scope.MinStayTimeOfCustomerForEmployee);



        apiService.updateSettingData($scope.GeoFancingRange, $scope.MinStayTimeOfCustomerForEmployee)
            .success(function(data, status, headers, config) {
                if (data.IsSuccess) {
                    alert('Settings Updated Successfully');
                    $scope.getAllSetting();
                } else {
                    alert(data.message);
                }
                $scope.FormInitialized = true;
            })
            .error(function(data, status, headers, config) {
                console.log("failed.");
                $scope.FormInitialized = true;
                return '';
            });
    }

})
