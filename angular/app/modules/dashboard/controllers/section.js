dashboard.controller("SectionController", function($rootScope, $scope, apiService, $http, $interval, $location) { //
    $scope.sectionForm = {};
    $scope.UserID = '';
    $scope.Password = '';
    $scope.ConfPassword = '';
    $scope.Name = '';

    $scope.isEditMode = false;
    //$scope.UserType = 2;

    var temporaryBeacon = [];
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

    $scope.BeaconInitialized = true;
    $scope.$watchCollection('[AssignedStore]', function() {
        $scope.isEditMode = false;
        if ($scope.FormInitialized && $scope.AssignedStore) {
            $scope.BeaconInitialized = false;
            $scope.selectedBeacon = [];
            apiService.beaconData($scope.AssignedStore).then(function(res) {
                $scope.beaconData = res.data.data;
                $scope.BeaconInitialized = true;
            });
        }

    });

    $scope.resetControls = function() {
        $scope.SectionName = '';
        $scope.SectionDesc = '';
        $scope.selectedBeacon = [];
        $scope.AssignedStore = '';
        $scope.UserObjectID = '';
        $scope.button_name = "Add";
        $scope.ResetPassword = false;
        $scope.sectionForm.$setUntouched();
        $scope.sectionForm.$setDirty();
        $scope.sectionForm.$setPristine();
    }

    $scope.getSection = function(pUserObjectID) {
        $scope.FormInitialized = false;
        apiService.getSection(pUserObjectID).
        success(function(data, status, headers, config) {
                var SectionData = data.data;
                if (data.data && data.data.length > 0) {
                    $scope.button_name = 'Update';

                    $scope.UserObjectID = pUserObjectID;
                    $scope.SectionName = data.data[0].SectionName;
                    $scope.SectionDesc = data.data[0].SectionDesc;
                    $scope.AssignedStore = SectionData[0].AssignedStore;
                    $scope.BeaconInitialized = false;
                    apiService.beaconData(SectionData[0].AssignedStore).then(function(res) {
                        $scope.beaconData = res.data.data;
                        setTimeout(function() {
                            $scope.selectedBeacon = SectionData[0].BeaconID;
                            $scope.FormInitialized = true;
                            $scope.BeaconInitialized = true;
                        }, 300);
                    });
                } else {
                    $scope.UserObjectID = '';
                    alert('Section not found. Please refresh your page');
                    $scope.button_name = 'add';
                    $scope.FormInitialized = true;
                }

            })
            .error(function(data, status, headers, config) {
                console.log("failed.");
                $scope.FormInitialized = true;
                return '';
            });
    }


    $scope.processUser = function() {
        if ($scope.sectionForm.$invalid) {
            angular.forEach($scope.sectionForm.$error, function(field) {
                angular.forEach(field, function(errorField) {
                    errorField.$setTouched();
                })
            });
            return;
        }

        if ($scope.selectedBeacon.length <= 0) {
            alert('Please select atleast one Beacon for a Section');
            return;
        }

        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            apiService.addSection($scope.SectionName, $scope.SectionDesc, $scope.AssignedStore, $scope.selectedBeacon)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllSections();
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
            apiService.updateSection($scope.UserObjectID, $scope.AssignedStore, $scope.selectedBeacon, $scope.SectionName, $scope.SectionDesc)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert(data.message);
                        $scope.getAllSections();
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

    $scope.deleteSection = function() {
        var r = confirm("Are You Sure to Delete this Record?");
        if (!r) {
            return;
        }
        $scope.FormInitialized = false;
        apiService.deleteSection($scope.UserObjectID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Section has been Deleted Successfully');
                $scope.getAllSections();
            } else {
                alert(res.message);
            }
        });
    }

    /*$http({
        method: "post",
        url: "/getsectionInStore",
        data: {

            'AssignedStore': '57d26d3bcace8e0378b20404',

        }
    });*/


})
