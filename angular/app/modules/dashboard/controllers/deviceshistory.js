dashboard.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter, { 'event': event });
                });

                event.preventDefault();
            }
        });
    };
});

dashboard.filter('record', function() {
    return function(array, property, target) {
        if (target && property) {
            target[property] = array;
        }
        return array;
    }
});

dashboard.controller("DeviceHistoryController", function($rootScope, $scope, apiService, socket, $http, $location, $interval) { //
    var vm = this;
    $scope.BeaconID = '';
    $scope.beaconData = [];
    $scope.selectedBeacon = '';
    $scope.storeData = [];
    $scope.selectedStore = '';
    $scope.deviceData = [];
    $scope.deviceDataCount = 0;
    $scope.deviceDataPageCount = 0;
    var currdate = new Date();
    $scope.selectedDateFrom = (pad0(currdate.getDate(), 2) + '/' + pad0((currdate.getMonth() + 1), 2) + '/' + currdate.getFullYear());
    $scope.selectedDateTo = (pad0(currdate.getDate(), 2) + '/' + pad0((currdate.getMonth() + 1), 2) + '/' + currdate.getFullYear());
    $scope.selectedTokens = {};
    $scope.TM_title = '';
    $scope.TM_descr = '';
    $scope.GM_title = '';
    $scope.GM_descr = '';
    $scope.searchNameNumber = '';
    $scope.currPage = 1;
    $scope.pageLimit = 10;
    $scope.q = '';
    $scope.GM_ImageFilePath = '';
    $scope.baseUrl = apiService.base_url;
    $scope.InvalidInputs = false;
    $scope.InvalidDateInputs = false;

    $scope.Initialized = false;
    $scope.BeaconInitialized = true;

    $scope.InitializingHistoryDetails = false;
    $scope.HistoryDetailsData = [];
    $scope.HistoryPersonName = '';
    $scope.HistoryOfPlace = '';
    $scope.HitFromPagination = false;
    $scope.HistorySearchDetailsData = [];

    $scope.checkLoggedInUser = function() {
        apiService.checkloginUser().then(function(res) {
            if (typeof(res.data.user) != undefined && res.data.user) {
                $rootScope.loggedInUser = res.data.user;
            } else {
                $location.path("/");
            }
        });
    }
    
    if (!$rootScope.loggedInUser) {
        $scope.checkLoggedInUser();
        /*apiService.checkloginUser().then(function(res) {
            if (typeof(res.data.user) != undefined && res.data.user){
                $rootScope.loggedInUser = res.data.user;
            } else {
                $location.path("/");                
            }
        });*/
    }

    

    $scope.connection = true;
    $scope.connection_msg = false;
    $interval(function() {
        if (Offline.state == 'down') {
            $scope.connection = false;
        } else {
            if (!$scope.connection) {
                $scope.connection = true;
                $scope.connection_msg = true;
            }
        }
    }, 2000)

    $scope.$watchCollection('[connection_msg]', function() {
        if ($scope.connection_msg) {
            setTimeout(function() {
                $scope.connection_msg = false;
            }, 2000);
        }
    });

    $scope.$watchCollection('[InvalidInputs]', function() {
        if ($scope.InvalidInputs) {
            setTimeout(function() {
                $scope.InvalidInputs = false;
            }, 5000);
        }
    });

    $scope.$watchCollection('[InvalidDateInputs]', function() {
        if ($scope.InvalidDateInputs) {
            setTimeout(function() {
                $scope.InvalidDateInputs = false;
            }, 5000);
        }
    });

    $scope.checkPushNotificationValidition = function() {
        var PNtitle = document.getElementById('push-title').value;
        var PNdescr = document.getElementById('push-description').value;
        if (!PNtitle || !PNdescr) {
            document.getElementById('sendpushnotification').disabled = true;
        } else {
            document.getElementById('sendpushnotification').disabled = false;
        }
    }

    $scope.IsRecordSelected = false;

    $scope.checkClickedRecords = function() {
        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].DeviceID);
            }
        }
        if (checkedlist && checkedlist.length > 0) {
            $scope.IsRecordSelected = true;
        } else {
            $scope.IsRecordSelected = false;
        }
    }

    $scope.loadPage = function(page) {
        if ($scope.currPage == page) return;
        $scope.HitFromPagination = true;
        $scope.currPage = page;
        $scope.loadData();
    }

    $scope.prevPage = function() {
        $scope.loadPage($scope.currPage - 1);
    }

    $scope.nextPage = function() {
        $scope.loadPage($scope.currPage + 1);
    }

    $scope.firstPage = function() {
        $scope.loadPage(1);
    }

    $scope.lastPage = function() {
        $scope.loadPage($scope.deviceDataPageCount);
    }

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
    }, 1000);

    var queriedUrl = $location.search();

    apiService.storeData().then(function(res) {
        $scope.Initialized = false;
        $scope.storeData = res.data.data;
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
        $scope.selectAllRecord = false;
    }

    $scope.$watchCollection('[selectedStore]', function() {
        if ($scope.Initialized) {
            $scope.currPage = 1;
            $scope.getAllBeacon();
            $scope.selectedBeacon = '';
        }
    });

    $scope.$watchCollection('[selectedBeacon]', function() {
        if ($scope.Initialized && $scope.BeaconInitialized) {
            $scope.currPage = 1;
        }
    });

    $scope.$watchCollection('[pageLimit]', function() {
        if ($scope.Initialized) {
            $scope.currPage = 1;
            $scope.selectAllRecord = false;
            $scope.unselectRecords();
            $scope.loadDataWithSearch();
        }
    });

    $scope.selectAllRecord = false;
    $scope.selectAllCaption = 'Select Everything';

    $scope.processSelectAllRecords = function() {
        if (!$scope.selectAllRecord) {
            $scope.selectRecords();
            $scope.selectAllRecord = true;
        } else {
            $scope.unselectRecords();
            $scope.selectAllRecord = false;
        }
    }

    $scope.loadValueInURL = function() {
        //$scope.pageLimit = 10;
        $scope.searchNameNumber = '';
        $location.search({
            'store': $scope.selectedStore,
            'beacon': $scope.selectedBeacon,
            'dateFrom': $scope.selectedDateFrom,
            'dateTo': $scope.selectedDateTo,
            'page': $scope.currPage,
            'limit': $scope.pageLimit
        });
    }

    $scope.loadData = function() {
        $scope.loadValueInURL();
        $scope.getAllDevicesHistory();
    }

    $scope.loadDataWithSearch = function() {
        $scope.currPage = 1;
        var searchval = '';
        if ($scope.searchNameNumber.length > 1){
            searchval = $scope.searchNameNumber;
        } else {
            searchval = '';
        }
        $location.search({
            'store': $scope.selectedStore,
            'beacon': $scope.selectedBeacon,
            'dateFrom': $scope.selectedDateFrom,
            'dateTo': $scope.selectedDateTo,
            'page': $scope.currPage,
            'limit': $scope.pageLimit,
            'search': searchval
        });
        $scope.getAllDevicesHistory();
    }

    $scope.showData = function() {
        $scope.unselectRecords();
        $scope.selectAllRecord = false;
        $scope.pageLimit = 10;
        $scope.currPage = 1;
        $scope.loadData();
    }


    $scope.range = function(min, max, step) {
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i += step) {
            input.push(i);
        }
        return input;
    };

    $scope.getAllDevicesHistory = function() {

        $scope.checkLoggedInUser();

        var queriedUrl = $location.search();

        var selectedStore = '';
        if ($scope.selectedStore) {
            selectedStore = $scope.selectedStore;
        } else if (typeof(queriedUrl.store) != 'undefined' && queriedUrl.store) {
            selectedStore = queriedUrl.store;
        } else {
            $scope.InvalidInputs = true;
            return;
        }

        var selectedBeacon = '';
        if ($scope.selectedBeacon) {
            selectedBeacon = $scope.selectedBeacon;
        } else if (typeof(queriedUrl.beacon) != 'undefined' && queriedUrl.beacon) {
            selectedBeacon = queriedUrl.beacon;
        }

        var selectedDateFrom = '';
        if ($scope.selectedDateFrom) {
            selectedDateFrom = $scope.selectedDateFrom;
        } else if (typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom) {
            selectedDateFrom = queriedUrl.dateFrom;
        }

        var selectedDateTo = '';
        if ($scope.selectedDateTo) {
            selectedDateTo = $scope.selectedDateTo;
        } else if (typeof(queriedUrl.dateTo) != 'undefined' && queriedUrl.dateTo) {
            selectedDateTo = queriedUrl.dateTo;
        }

        var currentPage = 1;
        if ($scope.currPage) {
            currentPage = $scope.currPage;
        } else if (typeof(queriedUrl.page) != 'undefined' && queriedUrl.page) {
            currentPage = queriedUrl.page;
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
            $scope.InvalidDateInputs = true;
            return;
        }

        var pageLimit = 10;
        if ($scope.pageLimit) {
            pageLimit = $scope.pageLimit;
        } else if (typeof(queriedUrl.limit) != 'undefined' && queriedUrl.limit) {
            pageLimit = queriedUrl.limit;
        } else {
            pageLimit = $scope.pageLimit;
        }

        var searchNameNumber = 1;
        if ($scope.searchNameNumber) {
            searchNameNumber = $scope.searchNameNumber;
        } else if (typeof(queriedUrl.search) != 'undefined' && queriedUrl.search) {
            searchNameNumber = queriedUrl.search;
        } else {
            searchNameNumber = $scope.searchNameNumber;
        }
        if (searchNameNumber.length <= 1){
            searchNameNumber = '';
        }

        $scope.InvalidInputs = false;
        $scope.InvalidDateInputs = false;

        if ((beaconlist && beaconlist.length > 0) || selectedStore) {
            $scope.Initialized = false;
            apiService.deviceHistoryData(beaconlist, selectedStore, selectedDateFrom, selectedDateTo, currentPage, pageLimit, searchNameNumber).then(function(res) {
                var checkedlist = [];

                if (!res.data.IsSuccess && res.data.message == 'Login Expired. Please reload and login again.'){
                    alert('Login Expired.');
                    $location.path("/");
                    return;
                }

                for (var dd in $scope.deviceData) {
                    if ($scope.deviceData[dd].checked) {
                        checkedlist.push($scope.deviceData[dd].UniqueKey);
                    }
                }

                records = res.data.Records;
                recordcount = res.data.NoOfRecords;

                for (var dd in records) {
                    if (in_array(records[dd].UniqueKey, checkedlist)) {
                        records[dd].checked = true;
                    } else {
                        records[dd].checked = false;
                    }
                }

                $scope.deviceData = records;
                $scope.deviceDataCount = recordcount;
                $scope.deviceDataPageCount = Math.ceil(recordcount / $scope.pageLimit, 2)
                if (!$scope.HitFromPagination) {
                    $scope.currPage = 1;
                }
                $scope.HitFromPagination = false;
                $scope.Initialized = true;

                if ($scope.selectAllRecord) {
                    $scope.selectRecords()
                }
            });
        }
    }

    $scope.toProperCase = function(strval) {
        return strval.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    $scope.deviceHistoryDetailCurrentPage = 1;
    $scope.deviceHistoryDetailPageSize = 10;
    $scope.HistoryDetailsDataCount = 0;

    $scope.$watchCollection('[deviceHistoryDetailPageSize]', function() {
        $scope.deviceHistoryDetailCurrentPage = 1;
        console.log($scope.historypagination)
        $scope.pageNumber = 1;
    });

    $scope.pageChangeHandler2 = function(num) {
        console.log('going to page ' + num);
    };


    $scope.getDeviceHistoryDetails = function(PersonName, BeaconKey, MobileNo, BeaconID) {
        $scope.HistoryPersonName = PersonName;
        $scope.HistoryOfPlace = BeaconKey;

        var queriedUrl = $location.search();
        if (!(typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom) &&
            (typeof(queriedUrl.dateTo) != 'undefined' && queriedUrl.dateTo)) {
            /*$location.search({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon, 
                'dateFrom': $scope.selectedDateFrom, 'dateTo': $scope.selectedDateTo, 'page': $scope.currPage });*/
            $scope.loadDataWithSearch();
            queriedUrl = $location.search();
        }

        $scope.InitializingHistoryDetails = true;
        if (MobileNo.length > 10) {
            MobileNo = MobileNo.substring(2);
        }

        console.log(queriedUrl.dateFrom);
        console.log(queriedUrl.dateTo);

        var selectedDateFrom = '';
        if ($scope.selectedDateFrom) {
            selectedDateFrom = $scope.selectedDateFrom;
        } else if (typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom) {
            selectedDateFrom = queriedUrl.dateFrom;
        }

        var selectedDateTo = '';
        if ($scope.selectedDateTo) {
            selectedDateTo = $scope.selectedDateTo;
        } else if (typeof(queriedUrl.dateTo) != 'undefined' && queriedUrl.dateTo) {
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
                console.log(res);
                $scope.HistoryDetailsData = [];
                $scope.HistorySearchDetailsData = [];
                $scope.deviceHistoryDetailCurrentPage = 1
                $scope.deviceHistoryDetailPageSize = 10;
                $scope.HistoryDetailsData = res.data;
                $scope.HistoryDetailsDataCount = res.data.length;
                $scope.O = '-Date';
                $scope.InitializingHistoryDetails = false;
            });

    }

    $scope.searchHistoryCurrentPage = 1;
    $scope.searchHistoryPageSize = 10;
    $scope.searchpagination = {};

    $scope.pageChangeHandler = function(num) {
        console.log('going to page ' + num);
    };

    $scope.$watchCollection('[searchHistoryPageSize]', function() {
        $scope.searchHistoryCurrentPage = 1;
    });

    $scope.getDeviceSearchHistoryDetails = function(PersonName, MobileNo) {
        $scope.HistoryPersonName = PersonName;

        var queriedUrl = $location.search();
        if (!(typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom)) {
            /*$location.search({ 'store': $scope.selectedStore, 'beacon': $scope.selectedBeacon, 
                'dateFrom': $scope.selectedDateFrom, 'dateTo': $scope.selectedDateTo, 'page': $scope.currPage });*/
            $scope.loadDataWithSearch();
            queriedUrl = $location.search();
        }

        $scope.InitializingHistoryDetails = true;
        /*if (MobileNo.length > 10) {
            MobileNo = MobileNo.substring(2);
        }*/

        console.log(queriedUrl.dateFrom);
        console.log(queriedUrl.dateTo);

        var selectedDateFrom = '';
        if ($scope.selectedDateFrom) {
            selectedDateFrom = $scope.selectedDateFrom;
        } else if (typeof(queriedUrl.dateFrom) != 'undefined' && queriedUrl.dateFrom) {
            selectedDateFrom = queriedUrl.dateFrom;
        }

        var selectedDateTo = '';
        if ($scope.selectedDateTo) {
            selectedDateTo = $scope.selectedDateTo;
        } else if (typeof(queriedUrl.dateTo) != 'undefined' && queriedUrl.dateTo) {
            selectedDateTo = queriedUrl.dateTo;
        }

        selectedDateFrom = convertDateToTimestamp(selectedDateFrom);

        console.log(selectedDateFrom);

        if (!selectedDateFrom) {
            $scope.InvalidInputs = true;
            return;
        }

        selectedDateTo = convertDateToTimestamp(selectedDateTo);

        console.log(selectedDateTo);

        if (!selectedDateTo) {
            $scope.InvalidInputs = true;
            return;
        }

        if (!(selectedDateFrom <= selectedDateTo)) {
            $scope.InvalidInputs = true;
            return;
        }

        apiService.deviceSearchHistoryDetailsData(MobileNo, selectedDateFrom, selectedDateTo, $scope.detailPageLimit)
            .then(function(res) {
                console.log(res);
                $scope.HistoryDetailsData = [];
                $scope.HistorySearchDetailsData = [];
                $scope.searchHistoryCurrentPage = 1;
                $scope.searchHistoryPageSize = 10;
                $scope.HistorySearchDetailsData = res.data;                
                $scope.O = '-datetimestamp';
                $scope.q = '';
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
        var selectedStore = $scope.selectedStore;
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

        if (!(typeof(queriedUrl.date) != 'undefined' && queriedUrl.date)) {
            return;
        }

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

    $scope.resetNotificationDialogue = function() {
        document.getElementById('imagepreview').src = "";
        document.getElementById('imagepreview').style.display = 'none'
        document.getElementById('push-title').value = "";
        document.getElementById('push-description').value = "";
        document.getElementById('uploadfileinput').value = "";
    }

    $scope.sendImageMessage = function() {
        if ($scope.selectAllRecord) {
            $scope.sendImageMessageToEveryone();
            return;
        }

        var checkedlist = [];
        for (var dd in $scope.deviceData) {
            if ($scope.deviceData[dd].checked) {
                checkedlist.push($scope.deviceData[dd].UniqueKey);
            }
        }

        var ImageFilePath = document.getElementById('imagepreview').src;
        var title = document.getElementById('push-title').value;
        var description = document.getElementById('push-description').value;

        if (checkedlist && checkedlist.length > 0) {
            apiService.sendNotification_image(checkedlist, title, description, ImageFilePath).then(function(res) {
                console.log(res);
                $scope.resetNotificationDialogue();
                alert('Notification sent successfully');
            });
        } else {
            alert('No device selected');
        }
    }

    $scope.sendImageMessageToEveryone = function() {
        if (!$scope.selectedStore || !$scope.selectedDateFrom || !$scope.selectedDateTo) {
            $scope.InvalidInputs = true;
            return;
        }

        selectedDateFrom = convertDateToTimestamp($scope.selectedDateFrom);

        if (!selectedDateFrom) {
            $scope.InvalidInputs = true;
            return;
        }

        selectedDateTo = convertDateToTimestamp($scope.selectedDateTo);

        if (!selectedDateTo) {
            $scope.InvalidInputs = true;
            return;
        }

        if (!(selectedDateFrom <= selectedDateTo)) {
            $scope.InvalidInputs = true;
            $scope.InvalidDateInputs = true;
            return;
        }

        $scope.InvalidInputs = false;
        $scope.InvalidDateInputs = false;

        var ImageFilePath = document.getElementById('imagepreview').src;
        var title = document.getElementById('push-title').value;
        var description = document.getElementById('push-description').value;

        apiService.sendNotification_image_everyone($scope.selectedBeacon, $scope.selectedStore, selectedDateFrom, selectedDateTo, title, description, ImageFilePath).then(function(res) {
            console.log(res);
            $scope.resetNotificationDialogue();
            alert('Notification sent successfully');
        });
    }

    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:10',
      'Aliasger8982044994', '00:02:60','8982044994');*/

    /*apiService.updateDeviceHistory('12:32:45:22:89',
      'APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA', 2)*/

    /*apiService.updateDeviceHistory('00:A0:50:0E:0E:0D',
      'APA91bG-BDmozFR_A3cGkJ0WhNlURm38NxQclddjqt3HV1jiIWRPZdGO88nysUVaWNHlC-FTjtZAU7HMyiQZwJ5aOzZ85Pz7gjn7ND5FligAIUSgCm3ZfJg', '1.22')*/

})
