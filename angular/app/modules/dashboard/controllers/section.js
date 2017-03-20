dashboard.controller("SectionController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.sectionForm = {};
    $scope.UserID = '';
    $scope.Password = '';
    $scope.ConfPassword = '';
    $scope.Name = '';


    //$scope.UserType = 2;

    

    $scope.AssignedSection = '';
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

    $scope.getAllSections = function() {
        $scope.ListInitialized = false;
        apiService.secData().then(function(res) {

            if (!res.data.IsSuccess) {
                alert(res.data.message);
                return;
            }
            $scope.secData = res.data.data;
            $scope.O = 'SectionName';
            $scope.userCurrentPage = 1;
            $scope.userPageSize = 10;
            $scope.resetControls();
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllSections();

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });

   /* 
    apiService.sectionData().then(function(res) {
       


        $scope.sectionData = res.data.data;
       
    });

  */

    

    $scope.$watchCollection('[AssignedStore]', function() {
        if ($scope.FormInitialized) {
            apiService.beaconData($scope.AssignedStore).then(function(res) {
                $scope.beaconData = res.data.data;
            });
        }
    });


    $scope.resetControls = function() {
        $scope.SectionName = '';
        $scope.SectionDesc = '';
         
         $scope.selectedBeacon = '';
         
         $scope.AssignedStore = '';

        $scope.UserObjectID = '';
        $scope.button_name = "Add";
        $scope.ResetPassword = false;
        $scope.sectionForm.$setUntouched();
        $scope.sectionForm.$setDirty();
        $scope.sectionForm.$setPristine();
    }

    $scope.getSections = function(pUserObjectID) {
alert(pUserObjectID);

        $scope.FormInitialized = false;
        apiService.secData(pUserObjectID).
        success(function(data, status, headers, config) {
                if (data.data) {
                    $scope.button_name = 'Update';

                    $scope.UserObjectID = pUserObjectID;
                    $scope.SectionName = data.data[0].SectionName;
                    $scope.SectionDesc = data.data[0].SectionDesc;


                    // $scope.UserType = data.data[0].UserType;
                    $scope.AssignedStore = data.data[0].AssignedStore;

                    alert($scope.StoreName);
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

        alert($scope.button_name);

        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            alert($scope.button_name);
 apiService.addSection($scope.SectionName,$scope.SectionDesc,$scope.selectedBeacon,$scope.AssignedStore)
        .success(function(data, status, headers, config) {
            

                    if (data.IsSuccess) {
                        alert('Section Added Successfully');
                        $scope.getAllUsers();
                    } else {
                        alert(data.message);
                    }
                    $scope.FormInitialized = true;
                })
                .error(function(data, status, headers, config) {
                    console.log("failed.");
                    alert(data);
                    $scope.FormInitialized = true;
                    return '';
                });
        } else {

            $scope.FormInitialized = false;
            console.log($scope.SectionName);
            apiService.updateUser($scope.UserObjectID, $scope.UserID, ($scope.SectionName,$scope.SectionDesc,$scope.selectedBeacon,$scope.AssignedStore))
                .success(function(data, status, headers, config) {
                    alert('hello');
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
        if ($scope.sectionForm.$invalid) {
            angular.forEach($scope.sectionForm.$error, function(field) {
                angular.forEach(field, function(errorField) {
                    errorField.$setTouched();
                })
            });
            //alert("Please check all values on Form.");
            return;
        }

        /*  if ($scope.button_name == 'Update') {
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
          }*/


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

})
