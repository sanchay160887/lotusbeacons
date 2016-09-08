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

dashboard.controller("DeviceDataController",function ($rootScope, $scope, apiService, socket, $http) { //
	var vm = this;
  $scope.BeaconID = '';
  $scope.beaconData = [];
  $scope.selectedBeacon = '';
  $scope.Initialized = false;

  $scope.$watchCollection('[selectedBeacon]', function() {
      if ($scope.Initialized){
        $scope.getAllDevices($scope.selectedBeacon);
      }
  });

  $scope.getAllDevices = function(selectedBeacon){
    $scope.Initialized = false;
    apiService.deviceData($scope.selectedBeacon).then(function(res){
      $scope.deviceData = res.data;
      $scope.Initialized = true;
    });
  }

  $scope.getAllDevices($scope.selectedBeacon);

  $scope.getAllBeacon = function(){
    $scope.Initialized = false;
    apiService.beaconData().then(function(res){
      $scope.beaconData = res.data.data;
      $scope.Initialized = true;
      console.log(res.data);
    });
  }
  $scope.getAllBeacon();

  socket.on('updateDevice_response', function(response){
      $scope.getAllDevices($scope.selectedBeacon);
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