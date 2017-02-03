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


 dashboard.controller("NotificationController", function($rootScope, $scope, apiService, socket, $http, $location, $interval) { //
     var vm = this;
     $scope.notifData = [];
     $scope.notifDataCount = 0;
     $scope.notifDataPageCount = 0;
     var currdate = new Date();
     $scope.selectedDateFrom = (pad0(currdate.getDate(), 2) + '/' + pad0((currdate.getMonth() + 1), 2) + '/' + currdate.getFullYear());
     $scope.selectedDateTo = (pad0(currdate.getDate(), 2) + '/' + pad0((currdate.getMonth() + 1), 2) + '/' + currdate.getFullYear());
     $scope.searchNameNumber = '';
     $scope.currPage = 1;
     $scope.pageLimit = 10;
     $scope.InvalidInputs = false;
     $scope.InvalidDateInputs = false;

     $scope.Initialized = false;

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
         $scope.loadPage($scope.notifDataPageCount);
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
         jQuery(".datepicker").datepicker({ 'dateFormat': 'dd/mm/yy', 'maxDate': '0', 'minDate': '-365' });
         //$scope.Initialized = true;
     }, 1000);

     $scope.$watchCollection('[pageLimit]', function() {
         if ($scope.Initialized) {
             $scope.currPage = 1;
             $scope.loadDataWithSearch();
         }
     });

     $scope.loadData = function() {
         $scope.getAllNotifications();
     }

     $scope.loadDataWithSearch = function() {
         $scope.currPage = 1;
         $scope.getAllNotifications();
     }

     $scope.showData = function() {
         $scope.pageLimit = 10;
         $scope.currPage = 1;
         $scope.searchNameNumber = '';
         document.getElementById('searchNameNumber').value = '';
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

     $scope.getAllNotifications = function() {
         var selectedDateFrom = $scope.selectedDateFrom;

         var selectedDateTo = $scope.selectedDateTo;

         console.log($scope.currPage);

         var currentPage = $scope.currPage || 1;

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

         var pageLimit = $scope.pageLimit || 10;


         var searchNameNumber = $scope.searchNameNumber;


         $scope.InvalidInputs = false;
         $scope.InvalidDateInputs = false;

         $scope.Initialized = false;
         apiService.getAllNotifications(selectedDateFrom, selectedDateTo, currentPage, pageLimit, searchNameNumber).then(function(res) {
             var checkedlist = [];

             if (!res.data.IsSuccess && res.data.message == 'Login Expired. Please reload and login again.') {
                 alert('Login Expired.');
                 $location.path("/");
                 return;
             }

             records = res.data.Records;
             recordcount = res.data.NoOfRecords;

             $scope.notifData = records;
             $scope.notifDataCount = recordcount;
             $scope.notifDataPageCount = Math.ceil(recordcount / $scope.pageLimit, 2)
             if (!$scope.HitFromPagination) {
                 $scope.currPage = 1;
             }
             $scope.HitFromPagination = false;
             $scope.Initialized = true;

         });

     }

     $scope.showData();

 })
