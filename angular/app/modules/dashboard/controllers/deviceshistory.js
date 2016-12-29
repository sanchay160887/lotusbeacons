dashboard.controller("DeviceHistoryController", function($rootScope, $scope, apiService, socket, $http, $location) { //
    var vm = this;
    $scope.BeaconID = '';
    $scope.beaconData = [];
    $scope.selectedBeacon = '';
    $scope.storeData = [];
    $scope.selectedStore = '';
    $scope.deviceData = [];
    var currdate = new Date();
    $scope.selectedDate = (currdate.getDate() + '/' + (currdate.getMonth() + 1) + '/' + currdate.getFullYear());
    $scope.selectedTokens = {};
    $scope.TM_title = '';
    $scope.TM_descr = '';
    $scope.GM_title = '';
    $scope.GM_descr = '';
    $scope.GM_ImageFilePath = '';
    $scope.baseUrl = apiService.base_url;
    $scope.InvalidInputs = false;

    $scope.maxDate = new Date(
        currdate.getFullYear(),
        currdate.getMonth() + 1,
        currdate.getDate())

    $scope.Initialized = false;
    $scope.BeaconInitialized = true;

    $scope.$watchCollection('[InvalidInputs]', function() {
        if ($scope.InvalidInputs) {
            setTimeout(function() {
                $scope.InvalidInputs = false;
            }, 5000);
        }
    });



    setTimeout(function() {
        jQuery(".datepicker").datepicker({ 'dateFormat': 'dd/mm/yy', 'maxDate': '0' });
    }, 1000);

    var queriedUrl = $location.search();

    apiService.storeData().then(function(res) {
        $scope.Initialized = false;
        $scope.storeData = res.data.data;
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            $scope.selectedStore = queriedUrl.store;
        }
        $scope.getAllBeacon();
        $scope.Initialized = true;
    });

    $scope.ShowSelectedTokens = function() {
        //console.log($scope.deviceData);
    };

    $scope.selectRecords = function() {
        for (var dd in $scope.deviceData) {
            $scope.deviceData[dd].checked = true;
        }
    }

    $scope.unselectRecords = function() {
        for (var dd in $scope.deviceData) {
            $scope.deviceData[dd].checked = false;
        }
    }

    $scope.$watchCollection('[selectedStore]', function() {
        if ($scope.Initialized) {
            $location.search({ 'store': $scope.selectedStore });
            $scope.getAllBeacon();
        }
    });

    $scope.loadData = function() {
        $location.search({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon, 'date': $scope.selectedDate });
        $scope.getAllDevicesHistory();
    }

    $scope.getAllDevicesHistory = function() {
        var queriedUrl = $location.search()

        var selectedStore = '';
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        } else {
            $scope.InvalidInputs = true;
        }

        var selectedBeacon = '';
        if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon) {
            selectedBeacon = queriedUrl.beacon;
        }

        var selectedDate = '';
        if (typeof(queriedUrl.date) != 'undefined' && queriedUrl.date) {
            selectedDate = queriedUrl.date;
        }

        beaconlist = [];
        if ($scope.selectedBeacon) {
            beaconlist.push(selectedBeacon);
        }

        dateelemarray = selectedDate.split('/');
        if (dateelemarray.length < 3) {
            $scope.InvalidInputs = true;
            return;
        }
        selectedDate = dateelemarray[2] + '/' + dateelemarray[1] + '/' + dateelemarray[0];

        selectedDate = Date.parse(selectedDate);
        if (isNaN(selectedDate)) {
            $scope.InvalidInputs = true;
            return;
        }

        if ((beaconlist && beaconlist.length > 0) || selectedStore) {
            $scope.Initialized = false;
            apiService.deviceHistoryData(beaconlist, selectedStore, selectedDate).then(function(res) {
                var checkedlist = [];
                for (var dd in $scope.deviceData) {
                    if ($scope.deviceData[dd].checked) {
                        checkedlist.push($scope.deviceData[dd].DeviceID);
                    }
                }

                for (var dd in res.data) {
                    if (in_array(res.data[dd].DeviceID, checkedlist)) {
                        res.data[dd].checked = true;
                    } else {
                        res.data[dd].checked = false;
                    }
                }

                $scope.deviceData = res.data;
                $scope.Initialized = true;
            });
        }

    }

    function in_array(needle, haystack) {
        for (var i in haystack) {
            if (haystack[i] == needle) return true;
        }
        return false;
    }


    $scope.getAllBeacon = function() {
        selectedStore = '';
        var queriedUrl = $location.search();
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        }
        console.log(selectedStore);
        if (selectedStore) {
            $scope.BeaconInitialized = false;
            apiService.beaconData(selectedStore).then(function(res) {
                $scope.beaconData = res.data.data;
                if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon) {
                    $scope.selectedBeacon = queriedUrl.beacon;
                }
                $scope.BeaconInitialized = true;
            });
        } else {
            $scope.beaconData = [];
        }

    }


    socket.on('updateDeviceHistory_response', function(response) {
        var queriedUrl = $location.search()
        if (!(typeof(queriedUrl.store) != 'undefined' && queriedUrl.store)) {
            return;
        }

        if (!(typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon)) {
            return;
        }

        if (!(typeof(queriedUrl.date) != 'undefined' && queriedUrl.date)) {
            return;
        }
        $scope.getAllDevicesHistory();
        console.log($scope.selectedBeacon);

    });

    $scope.sendNotification = function() {
        apiService.sendNotification().then(function(res) {
            console.log(res);
        });
    }

    $scope.sendTextMessage = function() {
        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].DeviceID);
            }
        }

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendNotification_plain(checkedlist, $scope.GM_title, $scope.GM_descr).then(function(res) {
                console.log(res);
            });
        }
    }

    $scope.sendImageMessage = function() {
        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].DeviceID);
            }
        }

        var ImageFilePath = $scope.baseUrl + $scope.GM_ImageFilePath;

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendNotification_image(checkedlist, $scope.GM_title, $scope.GM_descr, ImageFilePath).then(function(res) {
                console.log(res);
            });
        } else {
            alert('No device selected');
        }
    }

    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
      'APA91bFyGniNrOq7BnA0jX2F29vizUm6HDRXcab-PACcczk_Xd_gXjCwxRsqh8Gp5yXDYrI2IxJIT2WUmFtstN7uzTYwBJfFoP4pBGRtf5ATUNEtOhDMbO4', '00:02:45');*/

    /*apiService.updateDeviceHistory('12:32:45:22:89',
      'APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA', 2)*/

    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
      'APA91bG-BDmozFR_A3cGkJ0WhNlURm38NxQclddjqt3HV1jiIWRPZdGO88nysUVaWNHlC-FTjtZAU7HMyiQZwJ5aOzZ85Pz7gjn7ND5FligAIUSgCm3ZfJg', '1.22')*/

})
