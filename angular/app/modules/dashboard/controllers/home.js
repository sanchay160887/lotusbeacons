﻿/*==========================================================
    Author      : Ranjithprabhu K
    Date Created: 13 Jan 2016
    Description : Controller to handle Home page
    Change Log
    s.no      date    author     description     


 ===========================================================*/

dashboard.controller("HomeController", ['$rootScope', '$scope', '$state', '$location', 'dashboardService', 'Flash', 'apiService',
    function($rootScope, $scope, $state, $location, dashboardService, Flash, apiService) {
        var vm = this;

        $scope.baseUrl = apiService.base_url;
        console.log($scope.baseUrl);


        if (!$rootScope.loggedInUser) {
            apiService.checkloginUser().then(function(res) {
                if (typeof(res.data.user) != undefined && res.data.user) {
                    $rootScope.loggedInUser = res.data.user;
                    $scope.loggedInUser = $rootScope.loggedInUser;
                    /*if ($rootScope.loggedInUser.UserType == 2) {
                        $location.path("/");
                    }*/
                } else {
                    $location.path("/");
                }
            });
        }

        $scope.StoreInitialized = false;
        $scope.NotifInitialized = false;

        $scope.storelist = {};

        $scope.getStoresUsers = function() {
            $scope.StoreInitialized = false;
            apiService.getStore_Users().then(function(res) {
                $scope.storelist = res.data;

                $scope.labels = [];
                $scope.data = [];
                for (var sl in $scope.storelist) {
                    $scope.labels.push($scope.storelist[sl].StoreName);
                    $scope.data.push($scope.storelist[sl].NoOfMobiles);
                }
                $scope.StoreInitialized = true;
            });

        }

        $scope.getStoresUsers()

        $scope.notiflist = {}

        $scope.getLastNotifications = function() {
            $scope.NotifInitialized = false;
            apiService.getLastNotification().then(function(res) {
                $scope.notiflist = res.data;
                $scope.notifCurrentPage = 1;
                $scope.notifPageSize = 10;
                $scope.NotifInitialized = true;
            });
        }

        $scope.getLastNotifications();

        $scope.refreshDashboard = function(){
            $scope.getStoresUsers()
            $scope.getLastNotifications();
        }

        vm.showDetails = true;
        vm.home = {};

        vm.home.mainData = [];
        /*{
            title: "Projects",
            value: "30+",
            theme: "aqua",
            icon: "puzzle-piece"
        },
        {
            title: "Designs",
            value: "250+",
            theme: "red",
            icon: "paint-brush"
        },
        {
            title: "Awards",
            value: "50+",
            theme: "green",
            icon: "trophy"
        },
        {
            title: "Cups of Beer",
            value: "0",
            theme: "yellow",
            icon: "glass"
        },
    ];*/

        //skills progress bar
        vm.home.skills = [{
            title: "Design & Development",
            theme: "aqua",
            percentage: 80
        }, {
            title: "Communication",
            theme: "red",
            percentage: 83
        }, {
            title: "Planning & Progressing",
            theme: "green",
            percentage: 75
        }, {
            title: "Problem Solving & Decision Making",
            theme: "yellow",
            percentage: 85
        }, {
            title: "Loyal & Dedication",
            theme: "aqua",
            percentage: 100
        }, {
            title: "Fun & Friendly",
            theme: "green",
            percentage: 95
        }, {
            title: "Lazy & Sleepy",
            theme: "red",
            percentage: 40
        }];

        vm.home.tools = [{
            Software: "Mongo DB",
            Percentage: "80",
            theme: "yellow",
            image: "mongodb"
        }, {
            Software: "Express JS",
            Percentage: "75",
            theme: "aqua",
            image: "express",
            progressbar: "blue"
        }, {
            Software: "Angular JS",
            Percentage: "85",
            theme: "green",
            image: "angular",
            progressbar: "blue"
        }, {
            Software: "Node JS",
            Percentage: "83",
            theme: "lime",
            image: "node",
            progressbar: "blue"
        }, {
            Software: "Javascript",
            Percentage: "80",
            theme: "maroon",
            image: "javascript",
            progressbar: "blue"
        }, {
            Software: "Type Script",
            Percentage: "70",
            theme: "Gray",
            image: "typescript",
            progressbar: "blue"
        }, {
            Software: "jQuery & AJAX",
            Percentage: "80",
            theme: "yellow",
            image: "jquery",
            progressbar: "blue"
        }, {
            Software: "Joomla",
            Percentage: "85",
            theme: "red",
            image: "joomla",
            progressbar: "blue"
        }, {
            Software: "HTML 5",
            Percentage: "90",
            theme: "yellow",
            image: "html5"
        }, {
            Software: "CSS 3",
            Percentage: "83",
            theme: "aqua",
            image: "css3",
            progressbar: "blue"
        }, {
            Software: "SAAS",
            Percentage: "72",
            theme: "green",
            image: "saas-css",
            progressbar: "blue"
        }, {
            Software: "Bootstrap",
            Percentage: "85",
            theme: "lime",
            image: "bootstrap",
            progressbar: "blue"
        }, {
            Software: "Photo Shop",
            Percentage: "90",
            theme: "maroon",
            image: "photoshop",
            progressbar: "blue"
        }, {
            Software: "Corel Draw",
            Percentage: "95",
            theme: "Gray",
            image: "coreldraw",
            progressbar: "blue"
        }, {
            Software: "Flash",
            Percentage: "65",
            theme: "yellow",
            image: "flash",
            progressbar: "blue"
        }];

        //Tools I use Carousel
        $("#owl-demo").owlCarousel({


            items: 8, //10 items above 1000px browser width
            itemsDesktop: [1000, 5], //5 items between 1000px and 901px
            itemsDesktopSmall: [900, 3], // betweem 900px and 601px
            itemsTablet: [600, 2], //2 items between 600 and 0
            itemsMobile: false, // itemsMobile disabled - inherit from itemsTablet option
        });
        $("#owl-demo").trigger('owl.play', 2000);

        // Custom Navigation Events
        $(".next").click(function() {
            $("#owl-demo").trigger('owl.next');
        })
        $(".prev").click(function() {
            $("#owl-demo").trigger('owl.prev');
        })
        $(".play").click(function() {
            $("#owl-demo").trigger('owl.play', 1000); //owl.play event accept autoPlay speed as second parameter
        })
        $(".stop").click(function() {
            $("#owl-demo").trigger('owl.stop');
        })

        //cartoon photo slider carosusel
        $("#owl-single").owlCarousel({
            navigation: true, // Show next and prev buttons
            slideSpeed: 300,
            paginationSpeed: 400,
            singleItem: true,
            autoPlay: 5000, //Set AutoPlay to 3 seconds
        });
    }
]);
