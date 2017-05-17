dashboard.controller("EmployeeNotification", function($rootScope, $scope, apiService, socket, $http, $location, $interval) { //
    var vm = this;
    $scope.storeData = [];
    $scope.selectedStore = '';
    $scope.sectionInStore = [];
    $scope.selectedSection = '';
    $scope.employeeData = [];
    $scope.selectedTokens = {};
    $scope.TM_title = '';
    $scope.TM_descr = '';
    $scope.GM_title = '';
    $scope.GM_descr = '';
    $scope.GM_ImageFilePath = '';
    $scope.baseUrl = apiService.base_url;
    $scope.orderbyfield = 'Name';
    $scope.searchNameNumber = '';
    $scope.Initialized = false;
    $scope.SectionInitialized = true;
    $scope.InvalidInputs = false;
    $scope.deviceAnalysis = {};
    $scope.pageLimit = 10;
    $scope.empcurrpage = 1;
    $rootScope.loggedInUser = {};

    $scope.$watchCollection('[InvalidInputs]', function() {
        if ($scope.InvalidInputs) {
            setTimeout(function() {
                $scope.InvalidInputs = false;
            }, 5000);
        }
    });

    $scope.checkLoggedInUser = function() {
        apiService.checkloginUser().then(function(res) {
            if (typeof(res.data.user) != undefined && res.data.user) {
                $rootScope.loggedInUser = res.data.user;
            } else {
                $location.path("/");
            }

            $scope.fetchDeviceAnalysis();

        });
    }

    $scope.fetchDeviceAnalysis = function() {
        if ($rootScope.loggedInUser.UserType == 1) {
            apiService.deviceAnalysis().then(function(res) {
                $scope.deviceAnalysis = res.data.records;
            })
        }
    }


    if (!$rootScope.loggedInUser) {
        $scope.checkLoggedInUser();
    }

    var queriedUrl = $location.search();

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

    $scope.sortemployeeData = function(fieldname) {
        console.log('sortemployeeData');
        $scope.orderbyfield = fieldname;
    }

    apiService.storeData().then(function(res) {
        $scope.storeData = res.data.data;
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            $scope.selectedStore = queriedUrl.store;
            $scope.getAllSection();
        }
        $scope.Initialized = true;
    });

    $scope.IsRecordSelected = false;

    $scope.checkClickedRecords = function() {
        var checkedlist = [];
        for (var dd in $scope.employeeData) {
            if ($scope.employeeData[dd].checked) {
                checkedlist.push($scope.employeeData[dd].DeviceID);
            }
        }

        if (checkedlist && checkedlist.length > 0) {
            $scope.IsRecordSelected = true;
        } else {
            $scope.IsRecordSelected = false;
        }
    }

    $scope.ShowSelectedTokens = function() {
        //console.log($scope.employeeData);
    };

    $scope.$watchCollection('[selectedStore]', function() {
        if ($scope.Initialized) {
            $scope.currPage = 1;
            //$location.search({ 'store': $scope.selectedStore });
            $scope.getAllSection();
            $scope.selectedSection = '';
        }
    });


    $scope.checkPushNotificationValidition = function() {
        var PNtitle = document.getElementById('push-title').value;
        var PNdescr = document.getElementById('push-description').value;
        if (!PNtitle || !PNdescr) {
            document.getElementById('sendpushnotification').disabled = true;
        } else {
            document.getElementById('sendpushnotification').disabled = false;
        }
    }

    $scope.selectRecords = function() {
        for (var dd in $scope.employeeData) {
            $scope.employeeData[dd].checked = true;
        }
    }

    $scope.unselectRecords = function() {
        for (var dd in $scope.employeeData) {
            $scope.employeeData[dd].checked = false;
        }
    }

    $scope.searchHistoryCurrentPage = 1;
    $scope.searchHistoryPageSize = 10;
    $scope.searchpagination = {};

    $scope.getAllEmployees = function() {
        if (!$scope.selectedStore || !$scope.selectedSection){
            $scope.InvalidInputs = true;
        }

        $scope.Initialized = false;
        apiService.employeeData($scope.selectedStore, $scope.selectedSection).then(function(res) {
            if (!res.data.IsSuccess) {
                $scope.Initialized = true;
                $scope.employeeData = [];
                return;
            }

            $scope.employeeData = res.data.data;
            $scope.orderbyfield = 'Name';
            $scope.searchHistoryCurrentPage = 1;
            $scope.searchHistoryPageSize = 10;
            $scope.Initialized = true;
        });
    }

    //$scope.getAllEmployees();


    $scope.getAllSection = function() {
        var selectedStore = $scope.selectedStore;
        if (selectedStore) {
            $scope.SectionInitialized = false;
            apiService.sectionInStore(selectedStore).then(function(res) {
                $scope.sectionInStore = res.data.data;
                $scope.selectedSection = -1;
                $scope.SectionInitialized = true;
            });
        } else {
            $scope.sectionInStore = [];
        }
    }

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

    $scope.resetNotificationDialogue = function() {
        document.getElementById('imagepreview').src = "";
        document.getElementById('imagepreview').style.display = 'none'
        document.getElementById('push-title').value = "";
        document.getElementById('push-description').value = "";
        document.getElementById('uploadfileinput').value = "";
    }

    $scope.sendTextMessage = function() {
        var checkedlist = [];
        for (var dd in $scope.employeeData) {
            if ($scope.employeeData[dd].checked) {
                checkedlist.push($scope.employeeData[dd].devicetoken);
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

    $scope.sortDevicedata = function(fieldname) {
        console.log('sortDevicedata');
        $scope.orderbyfield = fieldname;
    }

    $scope.sendImageMessage = function() {
        var checkedlist = [];
        var user_id = [];
        for (var dd in $scope.employeeData) {
            if ($scope.employeeData[dd].checked) {
                checkedlist.push($scope.employeeData[dd].devicetoken);
                user_id.push($scope.employeeData[dd]._id);
            }
        }

        var ImageFilePath = document.getElementById('imagepreview').src;
        var title = document.getElementById('push-title').value;
        var description = document.getElementById('push-description').value;

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendEmpNotification_image(checkedlist, user_id, title, description, ImageFilePath).then(function(res) {
                alert('Notification sent successfully');
                $scope.resetNotificationDialogue();
            });
        } else {
            alert('No device selected');
        }
    }

    //apiService.update_beacon_active('00:A0:50:17:1F:35','45ddxcdd55a5ds5fd5fdf5dfd','3.05');

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
  
    apiService.updateDevice('00:A0:50:17:20:1D','APA91bFvaILdRXwqIopkKzByeFujzqHwsuNcsVZ8TSyO7GRGPzzMwISIpPjSO4xbzNffIiXX5TZL5ZQwLfjf46Hx7TDXcHi2hUXJzMb_4leR-IMvDPLP-9E','3.25', '8982044994');

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
    $scope.employeeData = devicelist;
  });

  socket.emit('updateDevice', {
      BeaconID : '1001',
      DeviceID : 'D1001',
      Distance : '1200'
  });*/
    /*apiService.updateDevice('00:A0:50:17:20:1D', 'APA91bFvaILdRXwqIopkKzByeFujzqHwsuNcsVZ8TSyO7GRGPzzMwISIpPjSO4xbzNffIiXX5TZL5ZQwLfjf46Hx7TDXcHi2hUXJzMb_4leR-IMvDPLP-9E', '3.25', '8982044994');
    apiService.updateDevice('00:A0:50:17:20:1D', 'APA91bFvaILdRXwqIopkKzByeFujzqHwsuNcsVZ8TSyO7GRGPzzMwISIpPjSO4xbzNffIiXX5TZL5ZQwLfjf46Hx7TDXcHi2hUXJzMb_4leR-IMvDPLP-9E', '3.25', '9584010456');    
    apiService.updateDevice('00:A0:50:B3:77:11', 'APA91bFvaILdRXwqIopkKzByeFujzqHwsuNcsVZ8TSyO7GRGPzzMwISIpPjSO4xbzNffIiXX5TZL5ZQwLfjf46Hx7TDXcHi2hUXJzMb_4leR-IMvDPLP-9E', '4.25', '9926037416');*/
})
