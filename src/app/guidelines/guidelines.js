angular.module('orderCloud')
    .config(GuidelinesConfig)

function GuidelinesConfig($stateProvider){
    $stateProvider
        .state('guidelines', {
            parent:'base',
            url:'/guidelines',
            templateUrl:'guidelines/guidelines.tpl.html'
        })
    ;
}