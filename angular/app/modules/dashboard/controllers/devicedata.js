dashboard.controller("DeviceDataController", function($rootScope, $scope, apiService, socket, $http, $location) { //
    var vm = this;
    $scope.BeaconID = '';
    $scope.beaconData = [];
    $scope.selectedBeacon = '';
    $scope.storeData = [];
    $scope.selectedStore = '';
    $scope.deviceData = [];
    $scope.selectedTokens = {};
    $scope.TM_title = '';
    $scope.TM_descr = '';
    $scope.GM_title = '';
    $scope.GM_descr = '';
    $scope.GM_ImageFilePath = '';
    $scope.baseUrl = apiService.base_url;
    $scope.orderbyfield = 'Distance';
    $scope.Initialized = false;
    $scope.BeaconInitialized = true;
    $scope.buttonHitted = false;

    var queriedUrl = $location.search();

    $scope.sortDevicedata = function(fieldname) {
        console.log('sortDevicedata');
        $scope.orderbyfield = fieldname;
    }

    apiService.storeData().then(function(res) {
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

    $scope.$watchCollection('[selectedStore]', function() {
        if ($scope.Initialized) {
            $location.search({ 'store': $scope.selectedStore });
            $scope.getAllBeacon();
        }
    });

    $scope.$watchCollection('[selectedBeacon]', function() {
        $location.search({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon });
    });

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

    $scope.loadData = function() {
        $scope.buttonHitted = true;
        $location.search({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon });
        $scope.getAllDevices();
    }

    $scope.getAllDevices = function() {
        var queriedUrl = $location.search()

        var selectedStore = '';
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        }

        var selectedBeacon = '';
        if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon) {
            selectedBeacon = queriedUrl.beacon;
        }
        beaconlist = [];
        if ($scope.selectedBeacon) {
            beaconlist.push(selectedBeacon);
            console.log(beaconlist);
        }

        if ((beaconlist && beaconlist.length > 0) || selectedStore) {
            $scope.Initialized = false;
            apiService.deviceData(beaconlist, selectedStore).then(function(res) {
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


    $scope.getAllBeacon = function() {
        selectedStore = '';
        var queriedUrl = $location.search();
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        }

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

    socket.on('updateDevice_response', function(response) {
        console.log('socket called ==> ' + JSON.stringify(response));
        $scope.loadData();
    });

    function in_array(needle, haystack) {
        for (var i in haystack) {
            if (haystack[i] == needle) return true;
        }
        return false;
    }

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
            apiService.sendNotification_plain(checkedlist, $scope.TM_title, $scope.TM_descr).then(function(res) {
                console.log(res);
            });
        } else {
            alert('No device selected');
        }

    }

    $scope.sendImageMessage = function() {
        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].DeviceID);
            }
        }

        var ImageFilePath = '';
        if ($scope.GM_ImageFilePath) {
            var ImageFilePath = $scope.baseUrl + $scope.GM_ImageFilePath;
        }

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendNotification_image(checkedlist, $scope.GM_title, $scope.GM_descr, ImageFilePath).then(function(res) {
                console.log(res);
            });
        } else {
            alert('No device selected');
        }
    }

    //apiService.updateDevice('00:A0:50:17:1F:35','APA91bGwYOTmTCYcS3F4L3n8HKrK0nJzNM-uJbIYFrdG6l7-49vJ2MHiXYNcpMMibY1ISU38-lLp8ONw3ZRPW2ioQdIAjMm5ycfMolCOSc6kM5S6NwMFu88','3.05');

    /*$http({
          method: "post",
          url: "/getdeviceidentity",
      }).success(function(data, status, headers, config) {
          console.log(data);
      }).error(function(data, status, headers, config) {
          console.log("failed.");
      });*/


    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
      'APA91bFyGniNrOq7BnA0jX2F29vizUm6HDRXcab-PACcczk_Xd_gXjCwxRsqh8Gp5yXDYrI2IxJIT2WUmFtstN7uzTYwBJfFoP4pBGRtf5ATUNEtOhDMbO4', '00:01:45');

    apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
      'APA91bG-BDmozFR_A3cGkJ0WhNlURm38NxQclddjqt3HV1jiIWRPZdGO88nysUVaWNHlC-FTjtZAU7HMyiQZwJ5aOzZ85Pz7gjn7ND5FligAIUSgCm3ZfJg', 3)

    //$http.post('http://localhost:3000/deleteDevice', {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}});
  
    //$scope.sendNotification();
  
    apiService.updateDevice('00:A0:50:0E:0F:23','APA91bFvaILdRXwqIopkKzByeFujzqHwsuNcsVZ8TSyO7GRGPzzMwISIpPjSO4xbzNffIiXX5TZL5ZQwLfjf46Hx7TDXcHi2hUXJzMb_4leR-IMvDPLP-9E','3.25');

    /*$http({
        method: "post",
        url: "/beaconDisconnected",
        data: {
            'DeviceID' : 'APA91bFz0w8XKMDg9vASZwLSJqBgIPuGCPJeXqX_VlhBXfePS8RBxdWIUnaWeP_IhPeLfLwhSQXpn-NtwJlW2Sww5M1YMzbYp6vyHnNpbptsePYodFACzKA',
        }
    })*/

    /*  $http({
          method: "post",
          url: "/beaconConnected",
          data: {
              DeviceID : 'APA91bFz0w8XKMDg9vASZwLSJqBgIPuGCPJeXqX_VlhBXfePS8RBxdWIUnaWeP_IhPeLfLwhSQXpn-NtwJlW2Sww5M1YMzbYp6vyHnNpbptsePYodFACzKA',
          BeaconID : '00:A0:50:0E:0F:23',
          Distance : '10'
          }
      })*/

    /*socket.on('showDevices', function(devicelist){
    $scope.deviceData = devicelist;
  });

  socket.emit('updateDevice', {
      BeaconID : '1001',
      DeviceID : 'D1001',
      Distance : '1200'
  });*/
})
