angular.module('orderCloud')
    .factory('googleDocs', googleDocs)

function googleDocs($resource){
    var apiKey = null;
    var service = {
        getToken: _getToken,
        setToken: _setToken,
        getGuide: _getGuide,
        listGuideIDs: _listGuideIDs
    };

    function _getToken(){
        return apiKey;
    }

    function _setToken(key){
        apiKey = key;
    }

    function _getGuide(docID, token, guideChapter){
        return $resource('http://localhost:3000/api/googledocs/' + docID + '/' + token + '/' + guideChapter).get().$promise;
    }
    function _listGuideIDs(folderID, token){
        //retrieves list of guides from a folder
        return $resource('http://localhost:3000/api/googledocs-folder/' + folderID + '/' + token).get().$promise;
    }

    return service;
}