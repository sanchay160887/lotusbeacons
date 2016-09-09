// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//
dashboard.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

dashboard.controller("DeviceDataController",function ($rootScope, $scope, apiService, socket, $http, $location, $window) { //
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
      console.log($scope.deviceData);
  };
  

  $scope.$watchCollection('[selectedStore]', function() {
      if ($scope.Initialized){
        $location.search({'store' : $scope.selectedStore});
        console.log($scope.selectedStore);
        $scope.getAllBeacon();
      }
  });
  
  $scope.$watchCollection('[selectedBeacon]', function() {
      if ($scope.Initialized){
        $location.search({'store' : $scope.selectedStore, 'beacon' : $scope.selectedBeacon});
        $scope.getAllDevices();
        //$window.location.reload();
      }
  });

  $scope.getAllDevices = function(){
    var queriedUrl = $location.search()
    var selectedBeacon = '';
    if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon){
      selectedBeacon = queriedUrl.beacon;
    }

    if ($scope.selectedBeacon){
      $scope.Initialized = false;
      apiService.deviceData(selectedBeacon).then(function(res){
        $scope.deviceData = res.data;
        $scope.Initialized = true;
      });
    }
  }

  $scope.getAllDevices();

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
  $scope.getAllBeacon();

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
    

  }

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