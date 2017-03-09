dashboard.controller("EmployeeController", function($rootScope,$scope, apiService, $http, $interval, $location) { //
    $scope.employeeForm = {};
    $scope.UserID = '';
    $scope.Password = '';
    $scope.ConfPassword = '';
    $scope.Name = '';
    $scope.Designation = '';

    
   
    //$scope.UserType = 2;
   
    $scope.AssignedStore = '';
	$scope.AssignedSection = '';
    $scope.ResetPassword = false;
    $scope.UserObjectID = '';
    //$scope.emailregex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  /*  $scope.emailregex = /^(?=[^@]{4,}@)([\w\.-]*[a-zA-Z0-9_]@(?=.{4,}\.[^.]*$)[\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z])$/;
    $scope.useridregex = /[a-z]/;
    $scope.passwordregex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,15}$/;
    $scope.phoneregex = /^[0-9]*$/;
*/
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
	    $scope.AssignedSection = '';
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
      
                    
                   // $scope.UserType = data.data[0].UserType;
                    $scope.AssignedStore = data.data[0].AssignedStore;
					$scope.AssignedSection = data.data[0].AssignedSection;
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
		
		 $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
			alert($scope.button_name);
            apiService.addEmployee($scope.UserID,$scope.Password,$scope.Name,$scope.Designation, 
			$scope.AssignedStore,$scope.AssignedSection)
                .success(function(data, status, headers, config) {
					
					
                    if (data.IsSuccess) {
                        alert('Employee Added Successfully');
                        $scope.getAllUsers();
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
            apiService.updateUser($scope.UserObjectID, $scope.UserID, ($scope.Password && $scope.Password.length > 0), $scope.Password,  $scope.Name,
                    $scope.Designation, $scope.MobileNo, $scope.AssignedStore)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert('User Updated Successfully');
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

		
        console.log($scope.button_name);
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
                alert('Confirm password doesnot match with password');
                return;
            }
        } else {
            if (!$scope.Password && !$scope.ConfPassword) {
                alert('Password should not be empty.');
                return;
            } else if ($scope.Password != $scope.ConfPassword) {
                alert('Confirm password doesnot match with password');
                return;
            }
        }

       
    }

    $scope.deleteUser = function() {
        var r = confirm("Are you sure to delete this record ?");
        if (!r) {
            return;
        }
        $scope.FormInitialized = false;
        apiService.deleteUser($scope.UserObjectID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Employee Deleted Successfully');
                $scope.getAllUsers();
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
					$scope.AssignedSection = data.data[0].AssignedSection;
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



    $http({
        method: "post",
        url: "/userLogin",
        data: {
            username: 'admin12345',
            password: 'sis12345@',
            fromApp: '1'
        }
    });

/*  $http({
        method: "post",
        url: "/getdata",
        data: {
            UserID: '58b696a3e690710a48c399ee',
            
             BeaconID: ["00:A0:50:B3:77:11"],
        }
    });
*/


    console.log('Login service called end');



})
