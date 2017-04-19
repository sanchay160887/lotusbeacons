dashboard.controller("EmployeeController", function($rootScope,$scope, apiService, $http, $interval, $location) { //
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

    $scope.getAllEmployees = function() {
        $scope.ListInitialized = false;
        apiService.employeeData().then(function(res) {

            if (!res.data.IsSuccess) {
                alert(res.data.message);
                return;
            }

            $scope.employeeData = res.data.data;
            $scope.O = 'Name';
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.resetControls();
            $scope.ListInitialized = true;


        });
    }

    $scope.getAllEmployees();

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });
	
	apiService.sectionData().then(function(res) {

        


        $scope.sectionData = res.data.data;
       
    });


    // new code section display according to store
       
       $scope.$watchCollection('[AssignedStore]', function() {
        if ($scope.FormInitialized) {
            apiService.sectionInStore($scope.AssignedStore).then(function(res) {

               // alert(res);
                $scope.sectionInStore = res.data.data;
            });
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
                    $scope.Designation = data.data[0].Designation;
      
                    
                   // $scope.UserType = data.data[0].UserType;
                    $scope.AssignedStore = data.data[0].AssignedStore;
					$scope.AssignedSection = data.data[0].AssignedSection;
                   //   alert($scope.AssignedSection);
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
		//	alert($scope.button_name); // change by arpit
            apiService.addEmployee($scope.UserID,$scope.Password,$scope.Name,$scope.Designation, 
			$scope.AssignedStore,$scope.AssignedSection)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllEmployees(); // change by Arpit
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
            apiService.updateEmployee($scope.UserObjectID, $scope.UserID, $scope.Password,  $scope.Name,
                   $scope.AssignedStore, $scope.AssignedSection,  $scope.Designation)


                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllEmployees();// $scope.getAllUsers();
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

    $scope.deleteEmployee = function() {
        var r = confirm("Are You Sure to Delete this Record?");
        if (!r) {
            return;
        }

       
        $scope.FormInitialized = false;
        
        apiService.deleteEmployee($scope.UserObjectID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Employee has been Deleted Successfully');
                $scope.getAllEmployees();
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


/*
   $http({
        method: "post",
        url: "/getEmployeeDetails",
        data: {
            EmployeeID: '58f1b37c0d6d3800117a66de',
         
        }
    });

*/
/*    $http({
        method: "post",
        url: "/fcmtest",
         data: {
            'message': 'Sanchay Description',
            'badge': 1,
            'title': 'Notification Title',
            'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
            'notification_type': 6,
        }
    });

*/

        $http({
        method: "post",
        url: "/getEmployeeDetails",
        data: {
            EmployeeID: '58b696a3e690710a48c399ee',
           
        }
    });




/*    
 $http({
        method: "post",
        url: "/getEmployeedata",
        data: {
            UserType: '3',
            
            
        }
    });
*/
/*$http({
        method: "post",
        url: "/getCrmEmployee",
        data: {
            UserType: '3',
            
            
        }
    });
*/
  /*
     $http({
        method: "post",
        url: "/userLogin",
        data: {
            username: 'ankit1',
            password: 'sis',
            UserType : 3
           
           
        }
    });
*/

    console.log('Login service called end');



})
