angular.module('orderCloud')
    .config(BaseConfig)
;

function BaseConfig($stateProvider) {
    $stateProvider
        .state('base', {
            url: '',
            abstract: true,
            views: {
                '': {
                    templateUrl: 'base/templates/base.tpl.html',
                    controller: 'BaseCtrl',
                    controllerAs: 'base'
                },
                'top@base': {
                    templateUrl: 'base/templates/base.top.tpl.html'
                }
            },
            resolve: {
                CurrentUser: function($q, $state, OrderCloud, buyerid, anonymous) {
                    var dfd = $q.defer();
                    OrderCloud.Me.Get()
                        .then(function(data) {
                            dfd.resolve(data);
                        })
                        .catch(function(){
                            if (anonymous) {
                                if (!OrderCloud.Auth.ReadToken()) {
                                    OrderCloud.Auth.GetToken('')
                                        .then(function(data) {
                                            OrderCloud.Auth.SetToken(data['access_token']);
                                        })
                                        .finally(function() {
                                            OrderCloud.BuyerID.Set(buyerid);
                                            dfd.resolve({});
                                        });
                                }
                            } else {
                                OrderCloud.Auth.RemoveToken();
                                OrderCloud.Auth.RemoveImpersonationToken();
                                OrderCloud.BuyerID.Set(null);
                                $state.go('login');
                                dfd.resolve();
                            }
                        });
                    return dfd.promise;
                }
            }
        });
}