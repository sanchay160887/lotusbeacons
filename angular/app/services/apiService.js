﻿/*==========================================================
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
	
	var deviceHistoryData = function(selectedBeacon){
        return $http({
            method: "post",
            url: '/getDeviceHistorydata',
            data: {
                'BeaconID' : selectedBeacon,
            }
        });
    }

    var sendNotification = function(){
        return $http({
            method: "post",
            url: "/sendpushnotification",
            data: {
                'BeaconID' : BeaconID,
                'DeviceID' : DeviceID,
                'Distance' : Distance
            }
        });
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
	
	var updateDeviceHistory = function(BeaconID, DeviceID, StayTime){
        $http({
            method: "post",
            url: "/updateDeviceHistory",
            data: {
                'BeaconID' : BeaconID,
                'DeviceID' : DeviceID,
                'StayTime' : StayTime
            }
        }).success(function(data, status, headers, config) {
            console.log("Success.");
        })
        .error(function(data, status, headers, config) {
            console.log("failed.");
        });
    }
	

    /*Beacon device start*/
    var beaconData = function(BeaconStore){
        return $http({
            method: "post",
            url: "/getbeacondata",
            data: {
                'BeaconStore' : BeaconStore
            }
        });
    }

    var addBeacon = function(BeaconID, BeaconKey, BeaconDescr, BeaconStore){
        return $http({
            method: "post",
            url: "/addbeacon",
            data: {
                'BeaconID' : BeaconID,
                'BeaconKey' : BeaconKey,
                'BeaconDescr' : BeaconDescr,
                'BeaconStore' : BeaconStore
            }
        });
    }

    var updateBeacon = function(BeaconID, BeaconKey, BeaconDescr, BeaconStore){
        return $http({
            method: "post",
            url: "/updatebeacon",
            data: {
                'BeaconID' : BeaconID,
                'BeaconKey' : BeaconKey,
                'BeaconDescr' : BeaconDescr,
                'BeaconStore' : BeaconStore
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

    apiService.beaconData = beaconData;
    apiService.addBeacon = addBeacon;
    apiService.updateBeacon = updateBeacon;
    apiService.deleteBeacon = deleteBeacon;
    apiService.getBeacon = getBeacon;
    /*Beacon device end*/

    /*Stores start*/
    var storeData = function(data){
        return $http.post('/getstoredata', {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}});
    }

    var addStores = function(storename, storedescr){
        return $http({
            method: "post",
            url: "/addstore",
            data: {
                'StoreName' : storename,
                'StoreDescr' : storedescr
            }
        });
    }

    var updateStore = function(StoreID, storename, storedescr){
        return $http({
            method: "post",
            url: "/updatestore",
            data: {
                'StoreID' : StoreID,
                'StoreName' : storename,
                'StoreDescr' : storedescr,
            }
        });
    }

    var getStore = function(StoreID){
        return $http({
            method: "post",
            url: "/getstore",
            data: {
                'StoreID' : StoreID,
            }
        });
    }

    var deleteStore = function(StoreID){
        return $http({
            method: "post",
            url: "/deletestore",
            data: {
                'StoreID' : StoreID,
            }
        });
    }

    var sendNotification_plain = function(gcmTokens, title, description){
        return $http({
            method: "post",
            url: "/sendpushnotification_plain",
            data: {
                'gcmTokens' : gcmTokens,
                'description' : description,
                'title' : title
            }
        });
    }

    apiService.storeData = storeData;
    apiService.addStores = addStores;
    apiService.updateStore = updateStore;
    apiService.deleteStore = deleteStore;
    apiService.getStore = getStore;
    /*Beacon device end*/

    apiService.get = get;

    apiService.create = create;
    apiService.update = update;
    apiService.delet = delet;
    apiService.deviceData = deviceData;
	apiService.deviceHistoryData = deviceHistoryData;
    apiService.sendNotification = sendNotification;
    apiService.sendNotification_plain = sendNotification_plain;
    apiService.updateDevice = updateDevice;
	apiService.updateDeviceHistory = updateDeviceHistory;


    return apiService;

}]);
