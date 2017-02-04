angular.module('orderCloud')
    .factory('googleDocs', googleDocs)

function googleDocs($resource, $window){
    //manage api key - https://console.developers.google.com
    //google drive api - https://developers.google.com/drive/v3/reference/
    var apiKey = null;
    var cachedGuides = {};
    var service = {
        authenticate: _authenticate,
        getToken: _getToken,
        setToken: _setToken,
        getGuide: _getGuide,
        listGuideIDs: _listGuideIDs,
        getFromCache: _getFromCache,
        setCache: _setCache
    };

    function _authenticate(){
        var CLIENT_ID = '357254235618-0rk836rghajrgnqvi5pjo8nko2og3l3c.apps.googleusercontent.com';
        var SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

        return $window.gapi.auth.authorize({
            client_id: CLIENT_ID,
            scope: SCOPES,
            immediate: false
        });
    }

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
        //retrieves list of guides ids from a folder
        return $resource('http://localhost:3000/api/googledocs-folder/' + folderID + '/' + token).get().$promise;
    }

    function _getFromCache(docsid){
        return cachedGuides[docsid];
    }

    function _setCache(guide){
        cachedGuides[guide.id] = guide;
    }

    return service;
}