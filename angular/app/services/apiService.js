/*==========================================================
    Author      : Ranjithprabhu K
    Date Created: 27 Dec 2015
    Description : This service is to communicate with server for CRUD Operaions
    
    Change Log
    s.no      date    author     description     
 ===========================================================*/

app.service('apiService', ['$http', '$q', 'appSettings', function($http, $q, appSettings) {

    var apiService = {};
    var apiBase = appSettings.apiBase;

    //===========================GET RESOURCE==============================
    var get = function(module, parameter) {
        var deferred = $q.defer();
        $http.get(apiBase + module, { params: parameter }, { headers: { 'Content-Type': 'application/json' } }).success(function(response) {
            deferred.resolve(response);
        }).catch(function(data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };

    //===========================CREATE RESOURCE==============================
    var create = function(module, parameter) {
        console.log("hitting Service=============");

        var deferred = $q.defer();

        $http.post(apiBase + module, parameter, { headers: { 'Content-Type': 'application/json' } }).success(function(response) {

            deferred.resolve(response);

        }).catch(function(data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };



    //===========================UPDATE RESOURCE==============================
    var update = function(module, parameter) {
        console.log("hitting Service=============");

        var deferred = $q.defer();

        $http.post(apiBase + module + '/' + parameter.id, parameter, { headers: { 'Content-Type': 'application/json' } }).success(function(response) {

            deferred.resolve(response);

        }).catch(function(data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };


    //===========================DELETE RESOURCE==============================
    var delet = function(module, parameter) {
        console.log("hitting Service=============");

        var deferred = $q.defer();

        $http.post(apiBase + module + '/' + parameter.id, parameter, { headers: { 'Content-Type': 'application/json' } }).success(function(response) {

            deferred.resolve(response);

        }).catch(function(data, status, headers, config) { // <--- catch instead error
            deferred.reject(data.statusText);
        });

        return deferred.promise;
    };


    // Services for Devices start

var deviceData = function(selectedBeacon, selectedStore) {
        return $http({
            method: "post",
            url: '/getdata',
            data: {
                'BeaconID': selectedBeacon,
                'StoreID': selectedStore
            }
        });
    }


    var deviceHistoryData = function(selectedBeacon, selectedStore, selectedDateFrom, selectedDateTo, currpage, limit, search = '') {
        return $http({
            method: "post",
            url: '/getDeviceHistorydata',
            data: {
                'BeaconID': selectedBeacon,
                'StoreID': selectedStore,
                'DateFrom': selectedDateFrom,
                'DateTo': selectedDateTo,
                'PageNo': currpage,
                'RecordsPerPage': limit,
                'Search': search
            }
        });
    }

    var deviceHistoryDetailsData = function(selectedMobileNo, selectedBeacon, selectedDateFrom, selectedDateTo) {
        return $http({
            method: "post",
            url: '/getDeviceHistoryDetailsdata',
            data: {
                'MobileNo': selectedMobileNo,
                'BeaconID': selectedBeacon,
                'DateFrom': selectedDateFrom,
                'DateTo': selectedDateTo
            }
        });
    }

    var deviceSearchHistoryDetailsData = function(selectedMobileNo, selectedDateFrom, selectedDateTo) {
        return $http({
            method: "post",
            url: '/getDeviceSearchHistoryDetailsdata',
            data: {
                'MobileNo': selectedMobileNo,
                'DateFrom': selectedDateFrom,
                'DateTo': selectedDateTo
            }
        });
    }

    var sendNotification = function() {
        return $http({
            method: "post",
            url: "/sendpushnotification",
            data: {
                'BeaconID': BeaconID,
                'DeviceID': DeviceID,
                'Distance': Distance
            }
        });
    }

    var updateDevice = function(BeaconID, DeviceID, Distance) {
            $http({
                    method: "post",
                    url: "/updateDevice",
                    data: {
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'Distance': Distance
                    }
                }).success(function(data, status, headers, config) {
                    console.log("Success.");
                })
                .error(function(data, status, headers, config) {
                    console.log("failed.");
                });
        }
        //End

    var updateDeviceHistory = function(BeaconID, DeviceID, StayTime, MobileNo) {
        $http({
                method: "post",
                url: "/updateDeviceHistory",
                data: {
                    'BeaconID': BeaconID,
                    'DeviceID': DeviceID,
                    'stayTime': StayTime,
                    'MobileNo': MobileNo
                }
            }).success(function(data, status, headers, config) {
                console.log("Success.");
            })
            .error(function(data, status, headers, config) {
                console.log("failed.");
            });
    }


    /*Beacon device start*/
    var beaconData = function(BeaconStore) {
        return $http({
            method: "post",
            url: "/getbeacondata",
            data: {
                'BeaconStore': BeaconStore
            }
        });
    }

    var addBeacon = function(BeaconID, BeaconKey, BeaconWelcome, BeaconDescr, BeaconStore) {
        return $http({
            method: "post",
            url: "/addbeacon",
            data: {
                'BeaconID': BeaconID,
                'BeaconKey': BeaconKey,
                'BeaconWelcome': BeaconWelcome,
                'BeaconDescr': BeaconDescr,
                'BeaconStore': BeaconStore
            }
        });
    }

    var updateBeacon = function(BeaconID, BeaconKey, BeaconWelcome, BeaconDescr, BeaconStore) {
        return $http({
            method: "post",
            url: "/updatebeacon",
            data: {
                'BeaconID': BeaconID,
                'BeaconKey': BeaconKey,
                'BeaconWelcome': BeaconWelcome,
                'BeaconDescr': BeaconDescr,
                'BeaconStore': BeaconStore
            }
        });
    }

    var getBeacon = function(BeaconID) {
        return $http({
            method: "post",
            url: "/getbeacon",
            data: {
                'BeaconID': BeaconID,
            }
        });
    }

    var deleteBeacon = function(BeaconID) {
        return $http({
            method: "post",
            url: "/deletebeacon",
            data: {
                'BeaconID': BeaconID,
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
    var storeData = function(data) {
        return $http.post('/getstoredata', { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;' } });
    }

    var addStores = function(storename, storedescr, storelat, storelong) {
        return $http({
            method: "post",
            url: "/addstore",
            data: {
                'StoreName': storename,
                'StoreDescr': storedescr,
                'StoreLat': storelat,
                'StoreLong': storelong,
            }
        });
    }

    var updateStore = function(StoreID, storename, storedescr, storelat, storelong) {
        return $http({
            method: "post",
            url: "/updatestore",
            data: {
                'StoreID': StoreID,
                'StoreName': storename,
                'StoreDescr': storedescr,
                'StoreLat': storelat,
                'StoreLong': storelong,
            }
        });
    }

    var getStore = function(StoreID) {
        return $http({
            method: "post",
            url: "/getstore",
            data: {
                'StoreID': StoreID,
            }
        });
    }

    var deleteStore = function(StoreID) {
        return $http({
            method: "post",
            url: "/deletestore",
            data: {
                'StoreID': StoreID,
            }
        });
    }

    apiService.storeData = storeData;
    apiService.addStores = addStores;
    apiService.updateStore = updateStore;
    apiService.deleteStore = deleteStore;
    apiService.getStore = getStore;
    apiService.test_Timeout = test_Timeout;
    /*Store end*/

    /*User start*/
    var userData = function() {
        return $http({
            method: "post",
            url: "/getUserdata"
        });
    }

    var addUser = function(UserID, Password, Email, Name, Designation, MobileNo, AssignedStore) {
        return $http({
            method: "post",
            url: "/addUser",
            data: {
                'UserID': UserID,
                'Password': Password,
                'Email': Email,
                'Name': Name,
                'Designation': Designation,
                'MobileNo': MobileNo,
                'AssignedStore': AssignedStore
            }
        });
    }

    var updateUser = function(UserObjectID, UserID, ResetPassword, Password, Email, Name, Designation, MobileNo, AssignedStore) {
        return $http({
            method: "post",
            url: "/updateUser",
            data: {
                'UserObjectID': UserObjectID,
                'UserID': UserID,
                'Password': Password,
                'ResetPassword': ResetPassword,
                'Email': Email,
                'Name': Name,
                'Designation': Designation,
                'MobileNo': MobileNo,
                'AssignedStore': AssignedStore
            }
        });
    }

    var getUser = function(UserObjectID) {
        return $http({
            method: "post",
            url: "/getUser",
            data: {
                'UserObjectID': UserObjectID,
            }
        });
    }

    var deleteUser = function(UserObjectID) {
        return $http({
            method: "post",
            url: "/deleteUser",
            data: {
                'UserObjectID': UserObjectID,
            }
        });
    }

    var loginUser = function(username, password) {
        return $http({
            method: "post",
            url: "/userLogin",
            data: {
                'username': username,
                'password': password
            }
        });
    }

    var logOutUser = function(username, password) {
        return $http({
            method: "post",
            url: "/userLogout",
            data: {}
        });
    }

    var checkloginUser = function(username, password) {
        return $http({
            method: "post",
            url: "/getLoggedinUser",
            data: {}
        });
    }

    apiService.userData = userData;
    apiService.addUser = addUser;
    apiService.updateUser = updateUser;
    apiService.deleteUser = deleteUser;
    apiService.getUser = getUser;
    apiService.loginUser = loginUser;
    apiService.logOutUser = logOutUser;
    apiService.checkloginUser = checkloginUser;
    /*User end*/

    /*Home start*/

    var getStore_Users = function() {
        return $http({
            method: "post",
            url: "/getstoreuserscount"
        });
    }
    apiService.getStore_Users = getStore_Users;


    var getLastNotification = function() {
        return $http({
            method: "post",
            url: "/getBeaconsLastNotifications",
            data: {
                'recordlimit': 10
            }
        });
    }
    apiService.getLastNotification = getLastNotification;

    var getAllNotifications = function(selectedDateFrom, selectedDateTo, currpage, limit, search) {
        return $http({
            method: "post",
            url: "/getAllNotifications",
            data: {
                'DateFrom': selectedDateFrom,
                'DateTo': selectedDateTo,
                'PageNo': currpage,
                'RecordsPerPage': limit,
                'Search': search
            }
        });
    }
    apiService.getAllNotifications = getAllNotifications;

    /*Home end*/

    var sendNotification_plain = function(gcmTokens, title, description) {
        return $http({
            method: "post",
            url: "/sendpushnotification_plain",
            data: {
                'gcmTokens': gcmTokens,
                'description': description,
                'title': title
            }
        });
    }

    var sendNotification_image = function(gcmTokens, title, description, image_url) {
        return $http({
            method: "post",
            url: "/sendpushnotification_image",
            data: {
                'gcmTokens': gcmTokens,
                'description': description,
                'title': title,
                'image_url': image_url
            }
        });
    }

    var sendNotification_image_everyone = function(selectedBeacon, selectedStore, selectedDateFrom, selectedDateTo, title, description, image_url) {
        return $http({
            method: "post",
            url: "/sendpushnotification_image_everyone",
            data: {
                'BeaconID': selectedBeacon,
                'StoreID': selectedStore,
                'DateFrom': selectedDateFrom,
                'DateTo': selectedDateTo,
                'description': description,
                'title': title,
                'image_url': image_url
            }
        });
    }

    var test_Timeout = function(gcmTokens, title, description) {
        return $http({
            method: "post",
            url: "/beaconIntervalTesting",
        });
    }


    apiService.get = get;

    apiService.create = create;
    apiService.update = update;
    apiService.delet = delet;
    apiService.deviceData = deviceData;
    apiService.deviceHistoryData = deviceHistoryData;
    apiService.deviceHistoryDetailsData = deviceHistoryDetailsData;
    apiService.deviceSearchHistoryDetailsData = deviceSearchHistoryDetailsData;
    apiService.sendNotification = sendNotification;
    apiService.sendNotification_plain = sendNotification_plain;
    apiService.sendNotification_image = sendNotification_image;
    apiService.sendNotification_image_everyone = sendNotification_image_everyone;
    apiService.updateDevice = updateDevice;
    apiService.updateDeviceHistory = updateDeviceHistory;

    //apiService.base_url = 'http://localhost:3000';
    apiService.base_url = 'http://lotusbeacon.herokuapp.com';
    //apiService.base_url = 'http://lotuslive.herokuapp.com';
    //apiService.base_url = 'http://52.205.143.53:3000';

    var employeeData = function() {
            return $http({
                method: "post",
                url: "/getEmployeedata"
            });


        }
          var sectionData = function(data) {

            return $http.post('/getsectiondata', { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;' } });
        }
       

    var addEmployee = function(UserID, Password, Name,Designation ,AssignedStore, AssignedSection) {
       


        return $http({
            method: "post",
            url: "/addEmployee",
            data: {
                'UserID': UserID,
                'Password': Password,
                'Name': Name,
                'Designation':Designation,

                'AssignedStore': AssignedStore,
                'AssignedSection': AssignedSection,
            }
        });
    }



    var updateEmployee = function(UserObjectID, UserID, Password, Name, AssignedStore, AssignedSection,Designation  ) {
        alert(UserObjectID);
        alert(UserID);
         alert(Password);
        alert(Name);
        alert(AssignedStore);
        alert(AssignedSection);
        alert(Designation);
        return $http({
            method: "post",
            url: "/updateEmployee",
            data: {
                'UserObjectID': UserObjectID,
                'UserID': UserID,
                'Password': Password,
                //'ResetPassword': ResetPassword,
               
                'Name': Name,
                
                'AssignedStore': AssignedStore,
                 'AssignedSection': AssignedSection,
                 'Designation': Designation
            }
        });
    }



    var deleteEmployee = function(UserObjectID) {

        return $http({
            method: "post",
            url: "/deleteEmployee",
            data: {
                'UserObjectID': UserObjectID,
            }
        });
    }



    apiService.sectionData = sectionData;
    apiService.addEmployee = addEmployee;
    apiService.employeeData = employeeData;
    apiService.updateEmployee = updateEmployee;
    apiService.deleteEmployee = deleteEmployee;
    
/*    var sectionData = function(data) {
        return $http.post('/getsectiondata', { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;' } });
    }
*/

         var secData = function(pUserObjectID) {
           
            return $http({
                method: "post",
                url: "/getallsections",
                data:{

                  'pUserObjectID': pUserObjectID ,     

                }
            });


        }


    var getSection = function(pUserObjectID) {
         alert(pUserObjectID);
        return $http({
            method: "post",
            url: "/getSection",
            data: {
                'pUserObjectID': pUserObjectID,
            }
        });
    }





    var addSection = function(SectionName, SectionDesc,AssignedStore,selectedBeacon) {
        return $http({
            method: "post",
            url: "/addSection",
            data: {
                'SectionName': SectionName,
                'SectionDesc': SectionDesc,
                'AssignedStore': AssignedStore,
                'selectedBeacon':selectedBeacon,

            }
        });
    }


        var deleteSection= function(UserObjectID) {

        return $http({
            method: "post",
            url: "/deleteSection",
            data: {
                'UserObjectID': UserObjectID,
            }
        });
    }

    apiService.addSection = addSection;
    apiService.secData = secData;
     apiService.deleteSection = deleteSection;
     apiService.getSection = getSection;

   //Add CRM start from here

     var crmData = function() {
            return $http({
                method: "post",
                url: "/getCrmData"
            });


        }

    var addCustomer = function(UserID, Password, Name,Designation ,AssignedStore) {
       


        return $http({
            method: "post",
            url: "/addCustomer",
            data: {
                'UserID': UserID,
                'Password': Password,
                'Name': Name,
                'Designation':Designation,

                'AssignedStore': AssignedStore,
                
            }
        });
    }




    var updateCustomeExecutive = function(UserObjectID, UserID, Password, Name, AssignedStore,Designation  ) {//ResetPassword
        alert(UserObjectID);
        alert(UserID)
         alert(Password);
        //alert(ResetPassword);
        alert(AssignedStore);
       
        alert(Designation);
        return $http({
            method: "post",
            url: "/updateCustomeExecutive",
            data: {
                'UserObjectID': UserObjectID,
                'UserID': UserID,
                'Password': Password,
                //'ResetPassword': ResetPassword,
               
                'Name': Name,
                
                'AssignedStore': AssignedStore,
                
                 'Designation': Designation
            }
        });
    }



        var deleteCrm= function(UserObjectID) {

        return $http({
            method: "post",
            url: "/deleteCrm",
            data: {
                'UserObjectID': UserObjectID,
            }
        });
    }


   // apiService.sectionData = sectionData;
    apiService.addCustomer = addCustomer;
    apiService.crmData = crmData;
     apiService.deleteCrm = deleteCrm;
     apiService.updateCustomeExecutive = updateCustomeExecutive;


    return apiService;

}]);
