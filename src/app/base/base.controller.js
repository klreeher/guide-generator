angular.module('orderCloud')
    .controller('BaseCtrl', BaseController)
;

function BaseController($rootScope, $exceptionHandler, $sce, $q, Underscore, CurrentUser, base, $window, googleDocs, toastr, $state, $timeout) {
    var vm = this;
    vm.currentUser = CurrentUser;

    vm.fileList;
    vm.availableChapters = [
        {id:'product-catalog-management', name: 'Product Catalog management'}, 
        {id:'buyer-and-seller-organization-management', name: 'Buyer and Seller Organization Management'},
        {id: 'order-management', name: 'Order Management'}];
    vm.guideChapter = vm.availableChapters[0].id;
    vm.previewGuide;
    vm.folderURL = 'https://drive.google.com/drive/folders/0B9eFq4Wl332GbV9wRTdjTTFWOU0';

    // Your Client ID can be retrieved from your project in the google
    // Developer Console, https://console.developers.google.com
    var CLIENT_ID = '357254235618-0rk836rghajrgnqvi5pjo8nko2og3l3c.apps.googleusercontent.com';
    var SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
    vm.generateGuide = function() {
        var accessToken = googleDocs.getToken();
        if(accessToken){
            callApi(accessToken)
        } else {
            $window.gapi.auth.authorize({
                client_id: CLIENT_ID,
                scope: SCOPES,
                immediate: false
            })
            .then(function(auth){
                googleDocs.setToken(auth.access_token);
                callApi(auth.access_token);
            });
        }

        function callApi(token){
            console.log('access token: ' + token);
            var docID = vm.docsURL.replace('https://', '').split('/')[3];
            return googleDocs.getGuide(docID, token, vm.guideChapter)
                .then(function(data) {
                    var snapshot = angular.copy(data);
                    console.log(snapshot);
                    data.guideContent.parsedHtml = $sce.trustAsHtml(data.guideContent.parsedHtml);
                    vm.previewGuide = data;
                    $state.go('preview');
                });
        }
    };

    vm.getAllGuides = function(){
        var accessToken = googleDocs.getToken();
        if(accessToken) {
            callApi(accessToken);
        } else {
            $window.gapi.auth.authorize({
                client_id: CLIENT_ID,
                scope: SCOPES,
                immediate: false
            })
            .then(function(auth){
                googleDocs.setToken(auth.access_token);
                callApi(auth.access_token);
            });
        }

        function callApi(token){
            console.log('access token: ' + token);
            var folderID = vm.folderURL.replace('https://', '').split('/')[3];
            googleDocs.listGuideIDs(folderID, token)
                .then(function(data) {
                    vm.totalFiles = angular.copy(data.files.length);
                    vm.fileList = [];
                    var queue = data.files;
                    
                    //Need to limit rate that guides are retrieved to avoid ratee limit
                    function getGuides(){
                        return googleDocs.getGuide(queue[0].id, token, vm.guideChapter)
                            .then(function(){
                                vm.fileList.push(queue[0]);
                                queue.shift();
                                if(queue.length){
                                    $timeout(getGuides, 500);
                                } else {
                                    var guideCount = vm.fileList.length;
                                    toastr.success('All ' + guideCount +  ' guides have been generated!', 'Success');
                                }
                            });
                    }
                    getGuides();
                })
                .catch(function(err){
                    $exceptionHandler(err);
                });
        }
    };

    vm.snapOptions = {
        disable: (!base.left && base.right) ? 'left' : ((base.left && !base.right) ? 'right' : 'none')
    };
}