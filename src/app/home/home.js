angular.module('orderCloud')
	.config(HomeConfig)
	.controller('HomeCtrl', HomeController)
;

function HomeConfig($stateProvider) {
	$stateProvider
		.state('home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			controller: 'HomeCtrl',
			controllerAs: 'home'
		})
	;
}

function HomeController($window, googleDocs) {
    var vm = this;
    // Your Client ID can be retrieved from your project in the google
    // Developer Console, https://console.developers.google.com
    var CLIENT_ID = '357254235618-0rk836rghajrgnqvi5pjo8nko2og3l3c.apps.googleusercontent.com';
    var SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
    
    vm.generateGuide = function() {
        $window.gapi.auth.authorize(
          {client_id: CLIENT_ID, scope: SCOPES, immediate: false})
            .then(function(auth){
				console.log('access token: ' + auth.access_token)
                console.log('guide url: ' + vm.docsURL)
                googleDocs.getGuide(vm.docsURL, auth.access_token)
                    .then(function(data){
                        console.log('all done')
                    })
            })
      }
}
