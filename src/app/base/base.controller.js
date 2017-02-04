angular.module('orderCloud')
    .controller('BaseCtrl', BaseController)
;

function BaseController($rootScope, $exceptionHandler, $sce, $q, Underscore, CurrentUser, base, $window, googleDocs, toastr, $state, $timeout) {
    var vm = this;
    vm.currentUser = CurrentUser;
    vm.generatedGuides = [];

    vm.availableChapters = [
        {id:'product-catalog-management', name: 'Product Catalog Management'}, 
        {id:'buyer-and-seller-organization-management', name: 'Buyer and Seller Organization Management'},
        {id: 'order-management', name: 'Order Management'}];
    vm.guideChapter = vm.availableChapters[0].id;
    vm.previewGuide;
    vm.folderURL = 'https://drive.google.com/drive/folders/0B9eFq4Wl332GbV9wRTdjTTFWOU0';
    
    vm.generateGuide = function() {
        var accessToken = googleDocs.getToken();
        if(accessToken){
            callApi(accessToken);
        } else {
            googleDocs.authenticate()
                .then(function(auth){
                    googleDocs.setToken(auth.access_token);
                    callApi(auth.access_token);
                });
            }

        function callApi(token){
            var docID = vm.docsURL.replace('https://', '').split('/')[3];
            return googleDocs.getGuide(docID, token, vm.guideChapter)
                .then(function(data) {
                    data.guideContent.html = $sce.trustAsHtml(data.guideContent.html);
                    googleDocs.setCache(data.guideContent);
                    vm.generatedGuides.push(data.guideContent);
                    $state.go('preview', {docsID: data.guideContent.id});
                });
            }
    };

    vm.generateGuidesInFolder = function(){
        var accessToken = googleDocs.getToken();
        if(accessToken) {
            callApi(accessToken);
        } else {
            googleDocs.authenticate()
                .then(function(auth){
                    googleDocs.setToken(auth.access_token);
                    callApi(auth.access_token);
                });
        }

        function callApi(token){
            var folderID = vm.folderURL.replace('https://', '').split('/')[3];
            googleDocs.listGuideIDs(folderID, token)
                .then(function(data) {
                    vm.totalGuides = angular.copy(data.files.length);
                    vm.generatedGuides = [];
                    var queue = data.files;
                    
                    getGuides();
                    function getGuides(){
                        return googleDocs.getGuide(queue[0].id, token, vm.guideChapter)
                            .then(function(){
                                vm.generatedGuides.push(queue[0]);
                                queue.shift();
                                if(queue.length){
                                    $timeout(getGuides, 500);
                                } else {
                                    var guideCount = vm.generatedGuides.length;
                                    toastr.success('All ' + guideCount +  ' guides have been generated!', 'Success');
                                }
                            });
                    }
                })
                .catch(function(err){
                    $exceptionHandler(err);
                });
        }
    };
}