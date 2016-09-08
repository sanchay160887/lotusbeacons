/*==========================================================
    Author      : Ranjithprabhu K
    Date Created: 27 Dec 2015
    Description : This service is to communicate with server for CRUD Operaions
    
    Change Log
    s.no      date    author     description     
 ===========================================================*/

app.service('apiService', ['$http', '$q', 'appSettings', function ($http, $q, appSettings) {

    var apiService = {};
    var apiBase = appSettings.apiBase;

    //===========================GET RESOURCE==============================
    var get = function (module, parameter) {
        var deferred = $q.defer();
        $http.get(apiBase + module, { params: parameter }, { headers: { 'Content-Type': 'application/json' } }).success(function (response) {
            deferred.resolve(response);
        }).catch(function (data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };

    //===========================CREATE RESOURCE==============================
    var create = function (module, parameter) {
        console.log("hitting Service=============");

        var deferred = $q.defer();

        $http.post(apiBase + module, parameter, { headers: { 'Content-Type': 'application/json' } }).success(function (response) {

            deferred.resolve(response);

        }).catch(function (data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };



    //===========================UPDATE RESOURCE==============================
    var update = function (module, parameter) {
        console.log("hitting Service=============");

        var deferred = $q.defer();

        $http.post(apiBase + module + '/' + parameter.id, parameter, { headers: { 'Content-Type': 'application/json' } }).success(function (response) {

            deferred.resolve(response);

        }).catch(function (data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };


    //===========================DELETE RESOURCE==============================
    var delet = function (module, parameter) {
        console.log("hitting Service=============");

        var deferred = $q.defer();

        $http.post(apiBase + module + '/' + parameter.id, parameter, { headers: { 'Content-Type': 'application/json' } }).success(function (response) {

            deferred.resolve(response);

        }).catch(function (data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };


    // Services for Devices start
    var deviceData = function(selectedBeacon){
        return $http({
            method: "post",
            url: '/getdata',
            data: {
                'BeaconID' : selectedBeacon,
            }
        });
    }

    var sendNotification = function(){
        return $http.post('/sendpushnotification', {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}});
    }

    var updateDevice = function(BeaconID, DeviceID, Distance){
        $http({
            method: "post",
            url: "/updateDevice",
            data: {
                'BeaconID' : BeaconID,
                'DeviceID' : DeviceID,
                'Distance' : Distance
            }
        }).success(function(data, status, headers, config) {
            console.log("Success.");
        })
        .error(function(data, status, headers, config) {
            console.log("failed.");
        });
    }
    //End

    var beaconData = function(data){
        return $http.post('/getbeacondata', {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}});
    }

    var addBeacon = function(BeaconID, BeaconKey, BeaconDescr){
        return $http({
            method: "post",
            url: "/addbeacon",
            data: {
                'BeaconID' : BeaconID,
                'BeaconKey' : BeaconKey,
                'BeaconDescr' : BeaconDescr
            }
        });
    }

    var updateBeacon = function(BeaconID, BeaconKey, BeaconDescr){
        return $http({
            method: "post",
            url: "/updatebeacon",
            data: {
                'BeaconID' : BeaconID,
                'BeaconKey' : BeaconKey,
                'BeaconDescr' : BeaconDescr
            }
        });
    }

    var getBeacon = function(BeaconID){
        return $http({
            method: "post",
            url: "/getbeacon",
            data: {
                'BeaconID' : BeaconID,
            }
        });
    }

    var deleteBeacon = function(BeaconID){
        return $http({
            method: "post",
            url: "/deletebeacon",
            data: {
                'BeaconID' : BeaconID,
            }
        });
    }

    apiService.get = get;

    apiService.create = create;
    apiService.update = update;
    apiService.delet = delet;
    apiService.deviceData = deviceData;
    apiService.sendNotification = sendNotification;
    apiService.updateDevice = updateDevice;
    apiService.beaconData = beaconData;
    apiService.addBeacon = addBeacon;
    apiService.updateBeacon = updateBeacon;
    apiService.deleteBeacon = deleteBeacon;
    apiService.getBeacon = getBeacon;

    return apiService;

}]);
