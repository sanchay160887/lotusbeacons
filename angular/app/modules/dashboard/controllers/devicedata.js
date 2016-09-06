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
	apiService.deviceData().then(function(res){
		$scope.deviceData = res.data;
	});

  socket.on('updateDevice_response', function(response){
      //$scope.deviceData = devicelist;
      console.log(response);
      apiService.deviceData().then(function(res){
        $scope.deviceData = res.data;
      });
  });

  $scope.sendNotification = function(){
    apiService.sendNotification().then(function(res){
      console.log(res);
    });
  }

  //$http.post('http://localhost:3000/deleteDevice', {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}});
  
  //$scope.sendNotification();
  
  apiService.updateDevice('12:32:45:22:89','APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA','60');
  

	/*socket.on('showDevices', function(devicelist){
		$scope.deviceData = devicelist;
  });

  socket.emit('updateDevice', {
      BeaconID : '1001',
      DeviceID : 'D1001',
      Distance : '1200'
  });*/
})