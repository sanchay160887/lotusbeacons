/*==========================================================
    Author      : Ranjithprabhu K
    Date Created: 24 Dec 2015
    Description : Controller to handle main application
    
    Change Log
    s.no      date    author     description     
 ===========================================================*/

app.controller("appCtrl", ['$rootScope', '$scope', '$state', '$location', 'Flash', 'appSettings', 'apiService',
    function($rootScope, $scope, $state, $location, Flash, appSettings, apiService) {

        $rootScope.theme = appSettings.theme;
        $rootScope.layout = appSettings.layout;

        $scope.loggedInUser = $rootScope.loggedInUser;

        $scope.UCF = function(word) {
            if (!word) return '';
            return word.substring(0, 1).toUpperCase() + word.slice(1);
        }

        var vm = this;

        if (!$rootScope.loggedInUser) {
            apiService.checkloginUser().then(function(res) {
                if (typeof(res.data.user) != undefined && res.data.user) {
                    $rootScope.loggedInUser = res.data.user;
                    $scope.loggedInUser = $rootScope.loggedInUser;
                } else {
                    $location.path("/");
                }
            });
        }


        //avalilable themes
        vm.themes = [{
            theme: "black",
            color: "skin-black",
            title: "Dark - Black Skin",
            icon: ""
        }, {
            theme: "black",
            color: "skin-black-light",
            title: "Light - Black Skin",
            icon: "-o"
        }, {
            theme: "blue",
            color: "skin-blue",
            title: "Dark - Blue Skin",
            icon: ""
        }, {
            theme: "blue",
            color: "skin-blue-light",
            title: "Light - Blue Skin",
            icon: "-o"
        }, {
            theme: "green",
            color: "skin-green",
            title: "Dark - Green Skin",
            icon: ""
        }, {
            theme: "green",
            color: "skin-green-light",
            title: "Light - Green Skin",
            icon: "-o"
        }, {
            theme: "yellow",
            color: "skin-yellow",
            title: "Dark - Yellow Skin",
            icon: ""
        }, {
            theme: "yellow",
            color: "skin-yellow-light",
            title: "Light - Yellow Skin",
            icon: "-o"
        }, {
            theme: "red",
            color: "skin-red",
            title: "Dark - Red Skin",
            icon: ""
        }, {
            theme: "red",
            color: "skin-red-light",
            title: "Light - Red Skin",
            icon: "-o"
        }, {
            theme: "purple",
            color: "skin-purple",
            title: "Dark - Purple Skin",
            icon: ""
        }, {
            theme: "purple",
            color: "skin-purple-light",
            title: "Light - Purple Skin",
            icon: "-o"
        }, ];

        //available layouts
        vm.layouts = [{
            name: "Boxed",
            layout: "layout-boxed"
        }, {
            name: "Fixed",
            layout: "fixed"
        }, {
            name: "Sidebar Collapse",
            layout: "sidebar-collapse"
        }, ];


        //Main menu items of the dashboard

        vm.menuItems = [{
                title: "Dashboard",
                icon: "dashboard",
                state: "dashboard"
            },{
                title: "Online Empolyees",
                icon: "thumbs-up",
                state: "onlineuser"
            }, {
                title: "Customers in Store",
                icon: "users",
                state: "devices"
            }, {
                title: "Customers Visit History",
                icon: "list-ul",
                state: "deviceshistory"
            },

            {
                title: "Stores",
                icon: "empire ",
                state: "stores"
            },



             {
                title: "Beacons",
                icon: "bluetooth",
                state: "beacons"
            },
             {
                title: "Sections",
                icon: "arrows",
                state: "sections"
            },

              {
                title: "Managers",
                icon: "user",
                state: "users"
            },

             {
                title: "HOD",
                icon: "user",
                state: "departmentmanager"
            },

            {
                title: "Employees",
                icon: "user",
                state: "employees"
            }, 
                 {
                title: "Employee Notification",
                icon: "bell",
                state: "empnotification"
            },

            {
                title: "CRM Users",
                icon: "user",
                state: "crm"
            },
             {
                title: "Settings",
                icon: "cog",
                state: "settings"
            },

        ];

        //set the theme selected
        vm.setTheme = function(value) {
            $rootScope.theme = value;
        };


        //set the Layout in normal view
        vm.setLayout = function(value) {
            $rootScope.layout = value;
        };


        //controll sidebar open & close in mobile and normal view
        vm.sideBar = function(value) {
            if ($(window).width() <= 767) {
                if ($("body").hasClass('sidebar-open'))
                    $("body").removeClass('sidebar-open');
                else
                    $("body").addClass('sidebar-open');
            } else {
                if (value == 1) {
                    if ($("body").hasClass('sidebar-collapse'))
                        $("body").removeClass('sidebar-collapse');
                    else
                        $("body").addClass('sidebar-collapse');
                }
            }
        };

        //navigate to search page
        vm.search = function() {
            $state.go('app.search');
        };

        console.log('getting in to the app controller');

    }
]);
