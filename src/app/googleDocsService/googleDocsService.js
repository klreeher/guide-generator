angular.module('orderCloud')
    .factory('googleDocs', googleDocs)

function googleDocs($resource){
    var service = {
        getGuide:getGuide
    }
    function getGuide(url, token){
        var docID = url.replace('https://', '').split('/')[3];
        return $resource('http://localhost:3000/api/googledocs/' + docID + '/' + token).get().$promise;
    }
    return service;
}