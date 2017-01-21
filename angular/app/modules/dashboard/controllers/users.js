// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//

dashboard.controller("UserController", function($rootScope, $scope, apiService, $http) { //
    $scope.User_Id = '';
    $scope.First_Name = '';
    $scope.Last_Name = '';
    $scope.Email = '';
    $scope.Password = '';
    $scope.button_name = 'Add';
    $scope.ListInitialized = false;
    $scope.FormInitialized = true;

    var vm = this;


    $scope.getAllUser = function() {
        $scope.ListInitialized = false;
        apiService.userdata().then(function(res) {
            $scope.resetControls();
            $scope.userData = res.data.data;
            $scope.ListInitialized = true;
        });
    }

    $scope.getAllUser();

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
    });

    $scope.resetControls = function() {
        $scope.First_Name = '';
        $scope.Last_Name = '';
        $scope.Email = '';
        $scope.Password = '';
        $scope.button_name = 'Add';
    }

    $scope.getUser = function(pUserID) {
        $scope.FormInitialized = false;
        apiService.getUser(pUserID).
        success(function(data, status, headers, config) {
                if (data.data) {
                    console.log(data.data);
                    $scope.button_name = 'update';
                    $scope.Store_Id = pStoreID;
                    $scope.First_Name = data.data[0].FirstName;
                    $scope.Last_Name = data.data[0].LastName;


                    if (typeof(data.data[0].Email) != 'undefined') {
                        $scope.Email = data.data[0].Email;
                    } else {
                        $scope.Email = 0;
                    }
                    if (typeof(data.data[0].Password) != 'undefined') {
                        $scope.Password = data.data[0].Password;
                    } else {
                        $scope.Password = 0;

                    }
                } else {
                    $scope.User_Id = '';
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


    $scope.processUser = function() {
        console.log($scope.button_name);
        $scope.FormInitialized = false;
        if ($scope.button_name == 'Add') {
            apiService.addUsers($scope.First_Name, $scope.Last_Name, $scope.Email, $scope.Password)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
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
            apiService.updateUser($scope.User_Id, $scope.First_Name, $scope.Last_Name, $scope.Email, $scope.Password)
                .success(function(data, status, headers, config) {
                    if (data.IsSuccess) {
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
        $scope.FormInitialized = false;
        apiService.deleteStore($scope.User_Id).success(function(res) {
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
