angular.module('orderCloud')
    .config(PreviewConfig)
    .controller('PreviewCtrl', PreviewController)
;

function PreviewConfig($stateProvider){
    $stateProvider
        .state('preview', {
            parent:'base',
            url:'/preview',
            templateUrl:'preview/templates/preview.tpl.html',
            controller:'PreviewCtrl',
            controllerAs:'preview'
        })
    ;
}

function PreviewController(){
    var vm = this;
}