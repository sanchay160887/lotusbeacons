dashboard.controller("DeptMangController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.deptmangForm = {};
    $scope.UserID = '';
    $scope.Password = '';
    $scope.ConfPassword = '';
    $scope.Name = '';
    $scope.Designation = '';

    $scope.minlength = 6;
    $scope.maxlength = 8;

    //$scope.UserType = 2;

    $scope.AssignedStore = '';
    $scope.AssignedEmployee = [];
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

    $scope.getAllDeptManagerData = function() {
        $scope.ListInitialized = false;
        apiService.deptmanagerData().then(function(res) {

            if (!res.data.IsSuccess) {
                $scope.ListInitialized = true;
                alert(res.data.message);
                return;
            }

            $scope.deptmanagerData = res.data.data;
            $scope.O = 'Name';
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.resetControls();
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllDeptManagerData();

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });

    $scope.EmployeeInitialized = true;

    // new code section display according to store
    $scope.$watchCollection('[AssignedStore]', function() {
        if ($scope.FormInitialized) {
            if ($scope.AssignedStore) {
                $scope.EmployeeInitialized = false;
                $scope.AssignedEmployee = [];
                apiService.EmployeeDataByStore($scope.AssignedStore).then(function(res) {
                    $scope.EmployeeDataByStore = res.data.data;
                    $scope.EmployeeInitialized = true;
                });
            }
        }
    });
    ////////////////// end///////////////////

    $scope.resetControls = function() {
        $scope.UserID = '';
        $scope.Password = '';
        $scope.ConfPassword = '';
        $scope.Name = '';
        $scope.Designation = '';
        $scope.AssignedStore = '';
        $scope.EmployeeDataByStore = [];
        $scope.AssignedEmployee = [];
        $scope.UserObjectID = '';
        $scope.button_name = "Add";
        $scope.ResetPassword = false;
        $scope.deptmangForm.$setUntouched();
        $scope.deptmangForm.$setDirty();
        $scope.deptmangForm.$setPristine();
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
                    $scope.AssignedEmployee = [];

                    // $scope.UserType = data.data[0].UserType;
                    $scope.AssignedStore = data.data[0].AssignedStore;
                    apiService.EmployeeDataByStore(data.data[0].AssignedStore).then(function(res) {
                        $scope.EmployeeDataByStore = res.data.data;
                        setTimeout(function() {
                            $scope.AssignedEmployee = data.data[0].AssignedEmployee;
                            $scope.FormInitialized = true;
                        }, 500);
                    });
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

        if ($scope.deptmangForm.$invalid) {
            angular.forEach($scope.deptmangForm.$error, function(field) {
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

        if (!$scope.AssignedEmployee || $scope.AssignedEmployee.length <= 0) {
            alert('Please Assign Employee');
            return;
        }


        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            //  alert($scope.button_name); // change by arpit
            apiService.addDeptManager($scope.UserID, $scope.Password, $scope.Name, $scope.Designation,
                    $scope.AssignedStore, $scope.AssignedEmployee)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllDeptManagerData(); // change by Arpit
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
            //console.log($scope.Password);
            apiService.updateDeptManager($scope.UserObjectID, $scope.UserID, $scope.Password, $scope.Name, $scope.Designation,
                $scope.AssignedStore, $scope.AssignedEmployee)


            .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllDeptManagerData(); // $scope.getAllUsers();
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


        //console.log($scope.button_name);



    }

    $scope.deleteDepartmentManager = function() {
        var r = confirm("Are You Sure to Delete this Record?");
        if (!r) {
            return;
        }


        $scope.FormInitialized = false;

        apiService.deleteDepartmentManager($scope.UserObjectID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Department Manager has been Deleted Successfully');
                $scope.getAllDeptManagerData();
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
                    $scope.AssignedEmployee = data.data[0].AssignedEmployee;
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
