// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//

dashboard.controller("BeaconsController", function($rootScope, $scope, apiService, $http, $interval) { //
    $scope.Beacon_ID = '';
    $scope.Beacon_Key = '';
    $scope.Beacon_Welcome = '';
    $scope.Beacon_Descr = '';
    $scope.button_name = 'Add';
    $scope.storeData = [];
    $scope.Beacon_Store = '';
    $scope.ListInitialized = false;
    $scope.FormInitialized = true;
    $scope.loggedInUser = $rootScope.loggedInUser;

    if (!$rootScope.loggedInUser) {
        apiService.checkloginUser().then(function(res) {
            if (typeof(res.data.user) != undefined && res.data.user) {
                $rootScope.loggedInUser = res.data.user;
                $scope.loggedInUser = $rootScope.loggedInUser;
                /*if ($rootScope.loggedInUser.UserType == 2){
                    $location.path("/");    
                }*/
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


    $scope.getAllBeacon = function() {
        $scope.resetControls();
        $scope.ListInitialized = false;
        apiService.beaconData().then(function(res) {
            $scope.beaconData = res.data.data;
            for(var d in $scope.beaconData){
                $scope.beaconData[d]._id = '';
                $scope.beaconData[d].BeaconDescr = '';
                $scope.beaconData[d].BeaconStore = '';
            }
            console.log($scope.beaconData);
            $scope.ListInitialized = true;
        });
    }

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });

    $scope.resetControls = function() {
        $scope.Beacon_ID = '';
        $scope.Beacon_Key = '';
        $scope.Beacon_Welcome = '';
        $scope.Beacon_Descr = '';
        $scope.Beacon_Store = '';
        $scope.button_name = 'Add';
    }

    $scope.beaconCurrentPage = 1;
    $scope.beaconPageSize = 10;
    $scope.pageChangeHandler2 = function(num) {
        console.log('going to page ' + num);
    };

    $scope.getAllBeacon();

    $scope.getBeacon = function(pbeacon_id) {
        $scope.FormInitialized = false;
        apiService.getBeacon(pbeacon_id).
        success(function(data, status, headers, config) {
                if (data.data) {
                    console.log(data.data);
                    console.log('update');
                    $scope.button_name = 'Update';
                    $scope.Beacon_ID = pbeacon_id;
                    $scope.Beacon_Key = data.data[0].BeaconKey;
                    $scope.Beacon_Welcome = data.data[0].BeaconWelcome;
                    $scope.Beacon_Descr = data.data[0].BeaconDescr;
                    $scope.Beacon_Store = data.data[0].BeaconStore;
                    $scope.O = 'StoreName';
                    $scope.beaconCurrentPage = 1;
                    $scope.beaconPageSize = 10;
                } else {
                    $scope.Beacon_ID = '';
                    alert('Device not found. Please refresh your page');
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


    $scope.processBeacon = function() {
        $scope.FormInitialized = false;
        console.log($scope.button_name);
        if ($scope.button_name == 'Add') {
            apiService.addBeacon($scope.Beacon_ID, $scope.Beacon_Key, $scope.Beacon_Welcome, $scope.Beacon_Descr, $scope.Beacon_Store)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert('Beacon Added Successfully');
                        $scope.getAllBeacon();
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
            apiService.updateBeacon($scope.Beacon_ID, $scope.Beacon_Key, $scope.Beacon_Welcome, $scope.Beacon_Descr, $scope.Beacon_Store)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
                        alert('Beacon Updated Successfully');
                        $scope.getAllBeacon();
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

    $scope.deleteBeacon = function() {
        var r = confirm("Are you sure to delete this record ?");
        if (!r) {
            return;
        }
        $scope.FormInitialized = false;
        apiService.deleteBeacon($scope.Beacon_ID).success(function(res) {
            console.log(res);
            $scope.FormInitialized = true;
            if (res.IsSuccess) {
                alert('Beacon Deleted Successfully');
                $scope.getAllBeacon();
            }
        });
    }

    //apiService.test_Timeout();

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
