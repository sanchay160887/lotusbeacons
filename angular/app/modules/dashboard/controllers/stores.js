// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//

dashboard.controller("StoresController", function($rootScope, $scope, apiService, $http, $interval) { //
    $scope.storeForm = {};
    $scope.Store_Id = '';
    $scope.Store_Name = '';
    $scope.Store_Descr = '';
    $scope.Store_Lat = '';
    $scope.Store_Long = '';
    $scope.button_name = 'Add';
    $scope.ListInitialized = false;
    $scope.FormInitialized = true;
    $scope.loggedInUser = $rootScope.loggedInUser;

    if (!$rootScope.loggedInUser) {
        apiService.checkloginUser().then(function(res) {
            if (typeof(res.data.user) != undefined && res.data.user) {
                $rootScope.loggedInUser = res.data.user;
                $scope.loggedInUser = $rootScope.loggedInUser;
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

    $scope.getAllStores = function() {
        $scope.ListInitialized = false;
        apiService.storeData().then(function(res) {
            if (!res.data.IsSuccess) {
                alert(res.data.message);
                return;
            }
            $scope.resetControls();
            $scope.storeData = res.data.data;
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllStores();

    $scope.resetControls = function() {
        $scope.Store_Name = '';
        $scope.Store_Descr = '';
        $scope.Store_Lat = '';
        $scope.Store_Long = '';

        $scope.storeForm.$setUntouched();
        $scope.storeForm.$setDirty();
        $scope.storeForm.$setPristine();


        $scope.button_name = 'Add';

    }

    console.log($scope.storeForm);


    $scope.getStore = function(pStoreID) {
        $scope.FormInitialized = false;
        apiService.getStore(pStoreID).
        success(function(data, status, headers, config) {
                if (data.data) {
                    console.log(data.data);
                    $scope.button_name = 'Update';
                    $scope.Store_Id = pStoreID;
                    $scope.Store_Name = data.data[0].StoreName;
                    $scope.Store_Descr = data.data[0].StoreDescr;


                    if (typeof(data.data[0].StoreLat) != 'undefined') {
                        $scope.Store_Lat = data.data[0].StoreLat;
                    } else {
                        $scope.Store_Lat = 0;
                    }
                    if (typeof(data.data[0].StoreLong) != 'undefined') {
                        $scope.Store_Long = data.data[0].StoreLong;
                    } else {
                        $scope.Store_Long = 0;

                    }
                } else {
                    $scope.Store_Id = '';
                    alert('Store not found. Please refresh your page');
                    $scope.button_name = 'add';
                }
                $scope.FormInitialized = true;
            })
            .error(function(data, status, headers, config) {
                console.log("failed.");
                return '';
            });
    }


    $scope.processStore = function() {
        if ($scope.storeForm.$invalid) {
            angular.forEach($scope.storeForm.$error, function(field) {
                angular.forEach(field, function(errorField) {
                    errorField.$setTouched();
                })
            });
            //alert("Please check all values on Form.");
            return;
        }

        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            apiService.addStores($scope.Store_Name, $scope.Store_Descr, $scope.Store_Lat, $scope.Store_Long)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert('Store Added Successfully');
                        $scope.getAllStores();
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
            apiService.updateStore($scope.Store_Id, $scope.Store_Name, $scope.Store_Descr, $scope.Store_Lat, $scope.Store_Long)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert('Store Updated Successfully');
                        $scope.getAllStores();
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

    $scope.deleteStore = function() {
        var r = confirm("Are you sure to delete this record ?");
        if (!r) {
            return;
        }

        $scope.FormInitialized = false;
        apiService.deleteStore($scope.Store_Id).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Store Deleted Successfully');
                $scope.getAllStores();
            }
        });
    }

    /*$http({
        method: "post",
        url: "/beaconConnected",
        data: {
            'BeaconID' : '00:A0:50:0E:0E:0D',
            'BeaconID' : 'APA91bELNsBdV4nR1j7Wh17Xx0cMD6X-wSbHfchYxaL19BspoVh-l3zGLN2r6LkHFxMuYBiEEFShDy5iAgh1h5nkK7jO3aPUsbYVOjkPLgwZaOEwxES5TZ0',
            'BeaconID' : '2.5',
        }
    });*/

    //apiService.updateDevice('12:32:45:22:89','APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA','60');



})
