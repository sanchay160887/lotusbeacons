// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//

dashboard.controller("StoresController", function($rootScope, $scope, apiService, $http) { //
    $scope.Store_Id = '';
    $scope.Store_Name = '';
    $scope.Store_Descr = '';
    $scope.Store_Lat = '';
    $scope.Store_Long = '';
    $scope.button_name = 'Add';
    $scope.ListInitialized = false;
    $scope.FormInitialized = true;

    var vm = this;

    $scope.getAllStores = function() {
        $scope.ListInitialized = false;
        apiService.storeData().then(function(res) {
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
        $scope.button_name = 'Add';
    }

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
        console.log($scope.button_name);
        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            apiService.addStores($scope.Store_Name, $scope.Store_Descr, $scope.Store_Lat, $scope.Store_Long)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
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
