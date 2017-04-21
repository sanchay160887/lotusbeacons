// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//

var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};

dashboard.directive("compareTo", compareTo);

dashboard.controller("UserController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.userForm = {};
    $scope.UserID = '';
    $scope.Password = '';
    $scope.ConfPassword = '';
    $scope.Name = '';
    $scope.Email = '';
    $scope.Designation = '';
    $scope.UserType = 2;
    $scope.MobileNo = '';
    $scope.AssignedStore = '';
    $scope.ResetPassword = false;
    $scope.UserObjectID = '';

    $scope.minlength = 6;
    $scope.maxlength = 8;

    
    //$scope.emailregex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    $scope.emailregex = /^(?=[^@]{4,}@)([\w\.-]*[a-zA-Z0-9_]@(?=.{4,}\.[^.]*$)[\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z])$/;
    $scope.useridregex = /[a-z][0-9]/;
    $scope.passwordregex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,15}$/;
    $scope.phoneregex = /^[0-9]*$/;

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

    $scope.getAllUsers = function() {
        $scope.ListInitialized = false;
        apiService.userData().then(function(res) {
            if (!res.data.IsSuccess) {
                alert(res.data.message);
                return;
            }
            $scope.userData = res.data.data;
            $scope.O = 'Name';
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.resetControls();
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllUsers();

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });

    $scope.resetControls = function() {
        $scope.UserID = '';
        $scope.Password = '';
        $scope.ConfPassword = '';
        $scope.Name = '';
        $scope.Email = '';
        $scope.Designation = '';
        $scope.MobileNo = '';
        $scope.AssignedStore = '';
        $scope.UserObjectID = '';
        $scope.button_name = "Add";
        $scope.ResetPassword = false;
        $scope.userForm.$setUntouched();
        $scope.userForm.$setDirty();
        $scope.userForm.$setPristine();
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
                    $scope.Email = data.data[0].Email;
                    $scope.Designation = data.data[0].Designation;
                    $scope.MobileNo = data.data[0].MobileNo;
                    $scope.UserType = data.data[0].UserType;
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
        console.log($scope.button_name);
        if ($scope.userForm.$invalid) {
            angular.forEach($scope.userForm.$error, function(field) {
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
            apiService.addUser($scope.UserID, $scope.Password, $scope.Email, $scope.Name, $scope.Designation,
                    $scope.MobileNo, $scope.AssignedStore)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllUsers();
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
        } else {
            $scope.FormInitialized = false;
            console.log($scope.Password);
            apiService.updateUser($scope.UserObjectID, $scope.UserID, ($scope.Password && $scope.Password.length > 0), $scope.Password, $scope.Email, $scope.Name,
                    $scope.Designation, $scope.MobileNo, $scope.AssignedStore)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllUsers();
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

    }

    $scope.deleteUser = function() {
        var r = confirm("Are You Sure to Delete this Record?");
        if (!r) {
            return;
        }
        $scope.FormInitialized = false;
        apiService.deleteUser($scope.UserObjectID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Manager has been Deleted Successfully');
                $scope.getAllUsers();
            } else {
                alert(res.message);
            }
        });
    }

})
