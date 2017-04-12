/*==========================================================
    Author      : Ranjithprabhu K
    Date Created: 24 Dec 2015
    Description : Base for Login module
    
    Change Log
    s.no      date    author     description     
    

 ===========================================================*/

var login = angular.module('login', ['ui.router', 'ngResource', 'ngAnimate', 'ngCookies']);


login.config(["$stateProvider", '$cookiesProvider', function($stateProvider, $cookiesProvider) {

    //login page state
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'app/modules/login/index.html',
        controller: 'loginCtrl',
        controllerAs: 'vm',
        data: {
            pageTitle: 'Login'
        }
    });

    var now = new Date();
    now.setMinutes(now.getMinutes() + 60);

    $cookiesProvider.defaults.path = '/';
    $cookiesProvider.defaults.secure = false;
    $cookiesProvider.defaults.expires = now;
    $cookiesProvider.defaults.domain = 'lampdemos.com';
}]);
