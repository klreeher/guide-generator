angular.module('orderCloud')
    .config(PreviewConfig)
    .controller('PreviewCtrl', PreviewController)
;

function PreviewConfig($stateProvider){
    $stateProvider
        .state('preview', {
            parent:'base',
            url:'/preview/:docsID',
            templateUrl:'preview/templates/preview.tpl.html',
            controller:'PreviewCtrl',
            controllerAs:'preview',
            resolve: {
                SelectedGuide: function(googleDocs, $stateParams){
                    return googleDocs.getFromCache($stateParams.docsID);
                }
            }
        })
    ;
}

function PreviewController(SelectedGuide){
    var vm = this;
    vm.selectedGuide = SelectedGuide;
    console.log(SelectedGuide)
}