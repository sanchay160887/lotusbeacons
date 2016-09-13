dashboard.controller("DeviceDataController",function ($rootScope, $scope, apiService, socket, $http, $location) { //
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

  $scope.Initialized = false;

  var queriedUrl = $location.search();
  
  
  apiService.storeData().then(function(res){
      $scope.Initialized = false;
      $scope.storeData = res.data.data;
      if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store){
          $scope.selectedStore = queriedUrl.store;
      }
      $scope.getAllBeacon();
      $scope.Initialized = true;
  });

  $scope.ShowSelectedTokens = function() {
      //console.log($scope.deviceData);
  };
  

  $scope.$watchCollection('[selectedStore]', function() {
      if ($scope.Initialized){
        $location.search({'store' : $scope.selectedStore});
        $scope.getAllBeacon();
      }
  });

  
  $scope.loadData = function(){
	$location.search({'store' : $scope.selectedStore, 'beacon' : $scope.selectedBeacon});
    $scope.getAllDevices();
  }

  $scope.getAllDevices = function(){
    var queriedUrl = $location.search()
    var selectedBeacon = '';
    if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon){
      selectedBeacon = queriedUrl.beacon;
    }
  	beaconlist = [];
  	if (!selectedBeacon && $scope.beaconData){
  		for(var b in $scope.beaconData){
  			beaconlist.push( $scope.beaconData[b].BeaconID );
  		}
  	} else {
  		if (selectedBeacon){
  			beaconlist.push(selectedBeacon);
  		}
  	}

  	$scope.Initialized = false;
  	apiService.deviceData(beaconlist).then(function(res){
		$scope.deviceData = res.data;
		$scope.Initialized = true;
  	});

  }

  //$scope.getAllDevices();

  $scope.getAllBeacon = function(){
    selectedStore = '';
    var queriedUrl = $location.search();
    if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store){
      selectedStore = queriedUrl.store;
    }
    console.log(selectedStore);
    if (selectedStore){
      $scope.Initialized = false;
      apiService.beaconData(selectedStore).then(function(res){
        $scope.beaconData = res.data.data;
        if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon){
          $scope.selectedBeacon = queriedUrl.beacon;
        }
        $scope.Initialized = true;
        console.log(res.data);
      });
    } else {
      $scope.beaconData = [];
    }
    
  }
  //$scope.getAllBeacon();

  socket.on('updateDevice_response', function(response){
      $scope.getAllDevices();
      console.log($scope.selectedBeacon);
      /*apiService.deviceData($scope.selectedBeacon).then(function(res){
        $scope.deviceData = res.data;
      });*/
  });

  $scope.sendNotification = function(){
    apiService.sendNotification().then(function(res){
      console.log(res);
    });
  }

  $scope.sendTextMessage = function(){
    var checkedlist = [];
    for(var dd in $scope.deviceData){
      if ($scope.deviceData[dd].checked){
        checkedlist.push($scope.deviceData[dd].DeviceID);
      }
    }
    
    if (checkedlist && checkedlist.length > 0){
      apiService.sendNotification_plain(checkedlist, $scope.TM_title, $scope.TM_descr).then(function(res){
        console.log(res);
      });
    } else {
      alert('No device selected');
    }
    
  }

  $scope.sendImageMessage = function(){
    var checkedlist = [];
    for(var dd in $scope.deviceData){
      if ($scope.deviceData[dd].checked){
        checkedlist.push($scope.deviceData[dd].DeviceID);
      }
    }
    
    var ImageFilePath = $scope.baseUrl + $scope.GM_ImageFilePath;

    if (checkedlist && checkedlist.length > 0){
      apiService.sendNotification_image(checkedlist, $scope.GM_title, $scope.GM_descr, ImageFilePath).then(function(res){
        console.log(res);
      });
    } else {
      alert('No device selected');
    }
  }

  /*$http({
        method: "post",
        url: "/getdevicetoken",
    }).success(function(data, status, headers, config) {
        console.log(data);
    }).error(function(data, status, headers, config) {
        console.log("failed.");
    });*/

  
  /*apiService.updateDeviceHistory('12:32:45:22:89',
  	'APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA', 2)

  apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
  	'APA91bG-BDmozFR_A3cGkJ0WhNlURm38NxQclddjqt3HV1jiIWRPZdGO88nysUVaWNHlC-FTjtZAU7HMyiQZwJ5aOzZ85Pz7gjn7ND5FligAIUSgCm3ZfJg', 3)*/

  //$http.post('http://localhost:3000/deleteDevice', {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}});
  
  //$scope.sendNotification();
  
  //apiService.updateDevice('12:32:45:22:89','APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA','70');
  

	/*socket.on('showDevices', function(devicelist){
		$scope.deviceData = devicelist;
  });

  socket.emit('updateDevice', {
      BeaconID : '1001',
      DeviceID : 'D1001',
      Distance : '1200'
  });*/
})