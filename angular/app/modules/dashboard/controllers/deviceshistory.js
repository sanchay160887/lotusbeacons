dashboard.controller("DeviceHistoryController", function($rootScope, $scope, apiService, socket, $http, $location) { //
    var vm = this;
    $scope.BeaconID = '';
    $scope.beaconData = [];
    $scope.selectedBeacon = '';
    $scope.storeData = [];
    $scope.selectedStore = '';
    $scope.deviceData = [];
    var currdate = new Date();
    $scope.selectedDateFrom = (pad0(currdate.getDate(), 2) + '/' + pad0((currdate.getMonth() + 1), 2) + '/' + currdate.getFullYear());
    $scope.selectedDateTo = (pad0(currdate.getDate(), 2) + '/' + pad0((currdate.getMonth() + 1), 2) + '/' + currdate.getFullYear());
    $scope.selectedTokens = {};
    $scope.TM_title = '';
    $scope.TM_descr = '';
    $scope.GM_title = '';
    $scope.GM_descr = '';
    $scope.GM_ImageFilePath = '';
    $scope.baseUrl = apiService.base_url;
    $scope.InvalidInputs = false;

    $scope.Initialized = false;
    $scope.BeaconInitialized = true;

    $scope.InitializingHistoryDetails = false;
    $scope.HistoryDetailsData = [];
    $scope.HistoryPersonName = '';
    $scope.HistoryOfPlace = '';

    $scope.$watchCollection('[InvalidInputs]', function() {
        if ($scope.InvalidInputs) {
            setTimeout(function() {
                $scope.InvalidInputs = false;
            }, 5000);
        }
    });

    function pad0(value, count) {
        var result = value.toString();
        for (; result.length < count; --count) {
            result = '0' + result;
        }
        return result;
    }

    function getIndiaTime(timestamp) {
        var d;
        if (timestamp) {
            d = new Date(timestamp);
        } else {
            d = new Date();
        }
        if (isNaN(d)) {
            return false;
        }

        //console.log('Time zone offset: ' + d.getTimezoneOffset());
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        //India Time +5:30
        utc = utc + 19800000;
        return utc;
    }

    function convertDateToTimestamp(datevalue) {
        if (!datevalue) return false;
        dateelemarray = datevalue.split('/');
        if (dateelemarray.length < 3) {
            return false;
        }
        dateymd = dateelemarray[2] + '/' + dateelemarray[1] + '/' + dateelemarray[0];

        timestamp = getIndiaTime(dateymd);
        return timestamp;
    }

    
    setTimeout(function() {
        jQuery(".datepicker").datepicker({ 'dateFormat': 'dd/mm/yy', 'maxDate': '0' });
        /*jQuery("#datepickerFrom").datepicker({
            //numberOfMonths: 2,
            'maxDate': '0',
            'dateFormat': 'dd/mm/yy',
            onSelect: function(selected) {
                var dt = new Date(selected);
                dt.setDate(dt.getDate() + 1);
                jQuery("#datepickerTo").datepicker("option", "minDate", dt);
            }
        });
        jQuery("#datepickerTo").datepicker({
            //numberOfMonths: 2,
            'maxDate': '0',
            'dateFormat': 'dd/mm/yy',
            onSelect: function(selected) {
                var dt = new Date(selected);
                dt.setDate(dt.getDate() - 1);
                jQuery("#datepickerFrom").datepicker("option", "maxDate", dt);
            }
        });*/


    }, 1000);

    var queriedUrl = $location.search();

    apiService.storeData().then(function(res) {
        $scope.Initialized = false;
        $scope.storeData = res.data.data;
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            $scope.selectedStore = queriedUrl.store;
        }
        $scope.getAllBeacon();
        $scope.Initialized = true;
    });

    $scope.ShowSelectedTokens = function() {
        //console.log($scope.deviceData);
    };

    $scope.selectRecords = function() {
        for (var dd in $scope.deviceData) {
            $scope.deviceData[dd].checked = true;
        }
    }

    $scope.unselectRecords = function() {
        for (var dd in $scope.deviceData) {
            $scope.deviceData[dd].checked = false;
        }
    }

    $scope.$watchCollection('[selectedStore]', function() {
        if ($scope.Initialized) {
            $location.search({ 'store': $scope.selectedStore });
            $scope.getAllBeacon();
        }
    });

    $scope.loadData = function() {
        console.log({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon, 'dateFrom': $scope.selectedDateFrom, 'dateTo': $scope.selectedDateTo });
        $location.search({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon, 'dateFrom': $scope.selectedDateFrom, 'dateTo': $scope.selectedDateTo });
        $scope.getAllDevicesHistory();
    }

    $scope.getAllDevicesHistory = function() {
        var queriedUrl = $location.search()

        var selectedStore = '';
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        } else {
            $scope.InvalidInputs = true;
        }

        var selectedBeacon = '';
        if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon) {
            selectedBeacon = queriedUrl.beacon;
        }

        var selectedDateFrom = '';
        if (typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom) {
            selectedDateFrom = queriedUrl.dateFrom;
        }

        var selectedDateTo = '';
        if (typeof(queriedUrl.dateTo) != 'undefined' && queriedUrl.dateTo) {
            selectedDateTo = queriedUrl.dateTo;
        }

        beaconlist = [];
        if ($scope.selectedBeacon) {
            beaconlist.push(selectedBeacon);
        }

        selectedDateFrom = convertDateToTimestamp(selectedDateFrom);

        if (!selectedDateFrom) {
            $scope.InvalidInputs = true;
            return;
        }

        selectedDateTo = convertDateToTimestamp(selectedDateTo);

        if (!selectedDateTo) {
            $scope.InvalidInputs = true;
            return;
        }

        if (!(selectedDateFrom <= selectedDateTo)) {
            $scope.InvalidInputs = true;
            return;
        }

        if ((beaconlist && beaconlist.length > 0) || selectedStore) {
            $scope.Initialized = false;
            apiService.deviceHistoryData(beaconlist, selectedStore, selectedDateFrom, selectedDateTo).then(function(res) {
                var checkedlist = [];
                for (var dd in $scope.deviceData) {
                    if ($scope.deviceData[dd].checked) {
                        checkedlist.push($scope.deviceData[dd].DeviceID);
                    }
                }

                for (var dd in res.data) {
                    if (in_array(res.data[dd].DeviceID, checkedlist)) {
                        res.data[dd].checked = true;
                    } else {
                        res.data[dd].checked = false;
                    }
                }

                $scope.deviceData = res.data;
                $scope.Initialized = true;
            });
        }

    }

    $scope.toProperCase = function (strval) {
        return strval.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    $scope.getDeviceHistoryDetails = function(PersonName, BeaconKey, MobileNo, BeaconID) {
        $scope.HistoryPersonName = PersonName;
        $scope.HistoryOfPlace = BeaconKey;

        $scope.InitializingHistoryDetails = true;
        if (MobileNo.length > 10){
            MobileNo = MobileNo.substring(2);
        }

        console.log(queriedUrl.dateFrom);
        console.log(queriedUrl.dateTo);

        var selectedDateFrom = '';
        if (typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom) {
            selectedDateFrom = queriedUrl.dateFrom;
        }

        var selectedDateTo = '';
        if (typeof(queriedUrl.dateTo) != 'undefined' && queriedUrl.dateTo) {
            selectedDateTo = queriedUrl.dateTo;
        }

        selectedDateFrom = convertDateToTimestamp(selectedDateFrom);

        if (!selectedDateFrom) {
            $scope.InvalidInputs = true;
            return;
        }

        selectedDateTo = convertDateToTimestamp(selectedDateTo);

        if (!selectedDateTo) {
            $scope.InvalidInputs = true;
            return;
        }

        if (!(selectedDateFrom <= selectedDateTo)) {
            $scope.InvalidInputs = true;
            return;
        }

        


        apiService.deviceHistoryDetailsData(MobileNo, BeaconID, selectedDateFrom, selectedDateTo)
            .then(function(res) {
                $scope.HistoryDetailsData = [];
                console.log(res);
                $scope.HistoryDetailsData = res.data;
                $scope.InitializingHistoryDetails = false;
            });

    }

    function in_array(needle, haystack) {
        for (var i in haystack) {
            if (haystack[i] == needle) return true;
        }
        return false;
    }


    $scope.getAllBeacon = function() {
        selectedStore = '';
        var queriedUrl = $location.search();
        if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        }
        console.log(selectedStore);
        if (selectedStore) {
            $scope.BeaconInitialized = false;
            apiService.beaconData(selectedStore).then(function(res) {
                $scope.beaconData = res.data.data;
                if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon) {
                    $scope.selectedBeacon = queriedUrl.beacon;
                }
                $scope.BeaconInitialized = true;
            });
        } else {
            $scope.beaconData = [];
        }
    }

    socket.on('updateDeviceHistory_response', function(response) {
        var queriedUrl = $location.search()
        console.log(response);
        console.log(queriedUrl.store);
        if (!(typeof(queriedUrl.store) != 'undefined' && queriedUrl.store)) {
            return;
        }

        /*if (!(typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon)) {
            return;
        }*/

        if (!(typeof(queriedUrl.date) != 'undefined' && queriedUrl.date)) {
            return;
        }

        //console.log(response.StoreID == queriedUrl.store);

        if (response.IsSuccess && response.StoreID && response.StoreID == queriedUrl.store) {
            $scope.getAllDevicesHistory();
            console.log($scope.selectedBeacon);
        }
    });

    $scope.sendNotification = function() {
        apiService.sendNotification().then(function(res) {
            console.log(res);
        });
    }

    $scope.sendTextMessage = function() {
        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].DeviceID);
            }
        }

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendNotification_plain(checkedlist, $scope.GM_title, $scope.GM_descr).then(function(res) {
                console.log(res);
            });
        }
    }

    $scope.sendImageMessage = function() {
        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].DeviceID);
            }
        }

        var ImageFilePath = $scope.baseUrl + $scope.GM_ImageFilePath;

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendNotification_image(checkedlist, $scope.GM_title, $scope.GM_descr, ImageFilePath).then(function(res) {
                console.log(res);
            });
        } else {
            alert('No device selected');
        }
    }

    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:10',
      'Aliasger8982044994', '00:02:60','8982044994');*/

    /*apiService.updateDeviceHistory('12:32:45:22:89',
      'APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA', 2)*/

    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
      'APA91bG-BDmozFR_A3cGkJ0WhNlURm38NxQclddjqt3HV1jiIWRPZdGO88nysUVaWNHlC-FTjtZAU7HMyiQZwJ5aOzZ85Pz7gjn7ND5FligAIUSgCm3ZfJg', '1.22')*/

})
