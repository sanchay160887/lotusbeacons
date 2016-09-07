// Getting help from this url
//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//

dashboard.controller("BeaconsController",function ($rootScope, $scope, apiService, $http) { //
  $scope.Beacon_ID = '';
  $scope.Beacon_Key = '';
  $scope.Beacon_Descr = '';
  $scope.button_name = 'Add';

	var vm = this;

  
  $scope.getAllBeacon = function(){
    apiService.beaconData().then(function(res){
      $scope.resetControls();
      $scope.beaconData = res.data.data;
    });
  }
  
  $scope.getAllBeacon();

  $scope.resetControls = function(){
    $scope.Beacon_ID = '';
    $scope.Beacon_Key = '';
    $scope.Beacon_Descr = '';
    $scope.button_name = 'Add';
  }

  $scope.getBeacon = function(pbeacon_id){
    apiService.getBeacon(pbeacon_id).
        success(function(data, status, headers, config) {
            if (data.data){
              console.log(data.data);
              $scope.button_name = 'update';
              $scope.Beacon_ID = pbeacon_id;
              $scope.Beacon_Key = data.data[0].BeaconKey;
              $scope.Beacon_Descr = data.data[0].BeaconDescr;
            } else {
              $scope.Beacon_ID = '';
              alert('Device not found. Please refresh your page');
              $scope.button_name = 'add';
            }
        })
        .error(function(data, status, headers, config) {
            console.log("failed.");
            return '';
        });
  }


  $scope.processBeacon = function(){
    console.log($scope.button_name);
    if ($scope.button_name == 'Add'){
      apiService.addBeacon($scope.Beacon_ID, $scope.Beacon_Key, $scope.Beacon_Descr)
        .success(function(data, status, headers, config) {
              if (data.IsSuccess){
                $scope.getAllBeacon();
              } else {
                alert(data.message);
              }
          })
        .error(function(data, status, headers, config) {
            console.log("failed.");
            return '';
        });
    } else {
      apiService.updateBeacon($scope.Beacon_ID, $scope.Beacon_Key, $scope.Beacon_Descr)
        .success(function(data, status, headers, config) {
            if (data.IsSuccess){
                $scope.getAllBeacon();
              } else {
                alert(data.message);
              }
        })
        .error(function(data, status, headers, config) {
            console.log("failed.");
            return '';
        });
    }
  }

  $scope.deleteBeacon = function(){
    apiService.deleteBeacon($scope.Beacon_ID).success(function(res){
      console.log(res);
      if (res.IsSuccess){
        $scope.getAllBeacon();
      }
    });
  }

  $http({
      method: "post",
      url: "/beaconConnected",
      data: {
          'BeaconID' : '00:A0:50:0E:0E:0D',
          'BeaconID' : 'APA91bELNsBdV4nR1j7Wh17Xx0cMD6X-wSbHfchYxaL19BspoVh-l3zGLN2r6LkHFxMuYBiEEFShDy5iAgh1h5nkK7jO3aPUsbYVOjkPLgwZaOEwxES5TZ0',
          'BeaconID' : '2.5',
      }
  });
  
  //apiService.updateDevice('12:32:45:22:89','APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA','60');
  

	
})