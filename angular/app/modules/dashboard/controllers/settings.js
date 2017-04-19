dashboard.controller("SettingController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.settingForm = {};

    $scope.GeoFancingRange = 0;
    $scope.MinStayTimeOfCustomerForEmployee = 0;
    $scope.CustomerWelcomeMessage = 'Welcome «CUSTNAME», Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for';
    $scope.EmployeeCustomerIntimation = 'Check your «CUSTNAME» is nearby you';

    $scope.isEditMode = false;
    $scope.FormInitialized = false;

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
        $scope.FormInitialized = false;
        apiService.settingData().then(function(res) {
            if (!res.data.IsSuccess) {
                alert(res.data.message);
                return;
            }
            var settingData = res.data.data;
            settingData = settingData[0];
            $scope.GeoFancingRange = Number(settingData.GeoFancingRange);
            $scope.MinStayTimeOfCustomerForEmployee = Number(settingData.MinStayTimeOfCustomerForEmployee);
            if (settingData.CustomerWelcomeMessage){
                $scope.CustomerWelcomeMessage = settingData.CustomerWelcomeMessage;    
            }  

             if (settingData.EmployeeCustomerIntimation){
                $scope.EmployeeCustomerIntimation = settingData.EmployeeCustomerIntimation;    
            }              
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.FormInitialized = true;
        });
    }

    $scope.getAllSetting();

       $scope.enableSetting = function() {
          $scope.isEditMode = true;

       }



    $scope.processSetting = function() {
        $scope.GeoFancingRange = Number($scope.GeoFancingRange);

        if (!$scope.GeoFancingRange) {
            alert('Please Enter GeoFancingRange');
            return;
        }


        $scope.MinStayTimeOfCustomerForEmployee = Number($scope.MinStayTimeOfCustomerForEmployee);
        if (!$scope.MinStayTimeOfCustomerForEmployee) {
            alert('Please Enter Minimum Stay Time field.');
            return;
        }

        if (!$scope.CustomerWelcomeMessage) {
            alert('Please Enter Customer Welcome Message.');
            return;
        }

        if (!$scope.EmployeeCustomerIntimation) {
            alert('Please Enter Employee Customer Intimation.');
            return;
        }

        $scope.FormInitialized = false;
        apiService.updateSettingData($scope.GeoFancingRange, $scope.MinStayTimeOfCustomerForEmployee, $scope.CustomerWelcomeMessage, $scope.EmployeeCustomerIntimation)
            .success(function(data, status, headers, config) {
                if (data.IsSuccess) {
                    alert('Settings Updated Successfully');
                    $scope.FormInitialized = true;
                    $scope.getAllSetting();
                } else {
                    alert(data.message);
                    $scope.FormInitialized = true;
                }                
            })
            .error(function(data, status, headers, config) {
                $scope.FormInitialized = true;
                return '';
            });
    }

})
