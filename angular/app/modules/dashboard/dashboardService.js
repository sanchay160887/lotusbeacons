/*==========================================================
   Author      : Ranjithprabhu K
   Date Created: 05 Jan 2016
   Description : To handle the service for Dashboard module
   
   Change Log
   s.no      date    author     description     
===========================================================*/


dashboard.service('dashboardService', ['$http', '$q', 'Flash', 'apiService', function ($http, $q, Flash, apiService) {

    var dashboardService = {};


    //service to communicate with users model to verify login credentials
    var accessLogin = function (parameters) {
        var deferred = $q.defer();
        apiService.get("users", parameters).then(function (response) {
            if (response)
                deferred.resolve(response);
            else
                deferred.reject("Something went wrong while processing your request. Please Contact Administrator.");
        },
            function (response) {
                deferred.reject(response);
            });
        return deferred.promise;
    };

    //service to communicate with users to include a new user
    var registerUser = function (parameters) {
        var deferred = $q.defer();
        apiService.create("users", parameters).then(function (response) {
            if (response)
                deferred.resolve(response);
            else
                deferred.reject("Something went wrong while processing your request. Please Contact Administrator.");
        },
            function (response) {
                deferred.reject(response);
            });
        return deferred.promise;
    };

    dashboardService.accessLogin = accessLogin;
    dashboardService.registerUser = registerUser;

    return dashboardService;

}]);

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


dashboard.filter('numberEx', ['numberFilter', '$locale',
  function(number, $locale) {

    var formats = $locale.NUMBER_FORMATS;
    return function(input, fractionSize) {
		
      //Get formatted value
      var formattedValue = number(input, fractionSize);
	  
	  if (typeof(formattedValue) == 'undefined'){
		  return input;
	  }

      //get the decimalSepPosition
      var decimalIdx = formattedValue.indexOf(formats.DECIMAL_SEP);

      //If no decimal just return
      if (decimalIdx == -1) return formattedValue;


      var whole = formattedValue.substring(0, decimalIdx);
      var decimal = (Number(formattedValue.substring(decimalIdx)) || "").toString();

      return whole +  decimal.substring(1);
    };
  }
]);
