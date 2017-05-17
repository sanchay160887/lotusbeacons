dashboard.controller("CrmController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.employeeForm = {};
    $scope.UserID = '';
    $scope.Password = '';
    $scope.ConfPassword = '';
    $scope.Name = '';
    $scope.Designation = '';

    $scope.minlength = 6;
    $scope.maxlength = 8;

    //$scope.UserType = 2;

    $scope.AssignedStore = '';

    $scope.ResetPassword = false;
    $scope.UserObjectID = '';

    $scope.button_name = 'Add';
    $scope.ListInitialized = false;
    $scope.FormInitialized = true;

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

    $scope.getAllCRM = function() {
        $scope.ListInitialized = false;
        apiService.crmData().then(function(res) {
            if (!res.data.IsSuccess) {
                $scope.ListInitialized = true;
                alert(res.data.message);
                return;
            }
            $scope.crmData = res.data.data;
            $scope.O = 'Name';
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.resetControls();
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllCRM();

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });

    apiService.sectionData().then(function(res) {


        $scope.sectionData = res.data.data;

    });

    $scope.resetControls = function() {
        $scope.UserID = '';
        $scope.Password = '';
        $scope.ConfPassword = '';
        $scope.Name = '';
        $scope.Designation = '';


        $scope.AssignedStore = '';

        $scope.UserObjectID = '';
        $scope.button_name = "Add";
        $scope.ResetPassword = false;
        $scope.employeeForm.$setUntouched();
        $scope.employeeForm.$setDirty();
        $scope.employeeForm.$setPristine();
    }

    $scope.getUser = function(pUserObjectID) {
        $scope.FormInitialized = false;
        apiService.getUser(pUserObjectID).
        success(function(data, status, headers, config) {
                if (data.data) {
                    $scope.button_name = 'Update';

                    $scope.UserObjectID = pUserObjectID;
                    $scope.UserID = data.data[0].UserID;
                    $scope.Name = data.data[0].Name;
                    $scope.Designation = data.data[0].Designation;


                    // $scope.UserType = data.data[0].UserType;
                    $scope.AssignedStore = data.data[0].AssignedStore;

                } else {
                    $scope.UserObjectID = '';
                    alert('User not found. Please refresh your page');
                    $scope.button_name = 'add';
                }
                $scope.FormInitialized = true;
            })
            .error(function(data, status, headers, config) {
                console.log("failed.");
                $scope.FormInitialized = true;
                return '';
            });
    }


    $scope.processUser = function() {

        //alert($scope.button_name);

        if ($scope.employeeForm.$invalid) {
            angular.forEach($scope.employeeForm.$error, function(field) {
                angular.forEach(field, function(errorField) {
                    errorField.$setTouched();
                })
            });
            //alert("Please check all values on Form.");
            return;
        }


        if ($scope.button_name == 'Update') {
            if ($scope.Password != $scope.ConfPassword) {
                alert('Confirm Password doesnot Match with Password');
                return;
            }
        } else {
            if (!$scope.Password && !$scope.ConfPassword) {
                alert('Please Enter Password');
                return;
            } else if ($scope.Password != $scope.ConfPassword) {
                alert('Confirm Password doesnot Match with Password');
                return;
            }
        }


        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            //alert($scope.button_name); // change by arpit
            apiService.addCustomer($scope.UserID, $scope.Password, $scope.Name, $scope.Designation,
                    $scope.AssignedStore)
                .success(function(data, status, headers, config) {


                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllCRM();
                    } else {
                        alert(data.message);
                    }
                    $scope.FormInitialized = true;
                })
                .error(function(data, status, headers, config) {
                    console.log("failed.");
                    //alert(status);
                    $scope.FormInitialized = true;
                    return '';
                });
        } else {

            $scope.FormInitialized = false;
            console.log($scope.Password);
            apiService.updateCustomeExecutive($scope.UserObjectID, $scope.UserID, $scope.Password, $scope.Name,
                    $scope.AssignedStore, $scope.Designation) //($scope.Password && $scope.Password.length > 0)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllCRM();
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


        console.log($scope.button_name);






    }

    $scope.deleteCrm = function() {
        var r = confirm("Are You Sure to Delete this Record?");
        if (!r) {
            return;
        }
        $scope.FormInitialized = false;
        apiService.deleteCrm($scope.UserObjectID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('CRM User has been Deleted Successfully');
                $scope.getAllCRM();
            } else {
                alert(res.message);
            }
        });
    }


    $scope.getEmployee = function(pUserObjectID) {
        $scope.FormInitialized = false;
        apiService.getUser(pUserObjectID).
        success(function(data, status, headers, config) {
                if (data.data) {
                    $scope.button_name = 'Update';

                    $scope.UserObjectID = pUserObjectID;
                    $scope.UserID = data.data[0].UserID;
                    $scope.Name = data.data[0].Name;
                    $scope.Designation = data.data[0].Designation;


                    // $scope.UserType = data.data[0].UserType;
                    $scope.AssignedStore = data.data[0].AssignedStore;

                } else {
                    $scope.UserObjectID = '';
                    alert('User not found. Please refresh your page');
                    $scope.button_name = 'add';
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
