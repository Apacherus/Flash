'use strict';
(function(){
    var app = {
        config:{
            f7_enable:true,
            f7_config:{},
            dom7_enable:true,
            JSAPI_enable:true
        },
        platform:'iOS',
        free: true,
        f7: null,
        view:null,
        dom7:null,
        adTime:null,
        JSAPI:null,
        meta:{
            title:"App",
            hashtag:"#app",
            language:["EN"],
            languageDefault:0
        },
        init : function(){
            if(app.config.f7_enable) {
                app.f7 = new Framework7(app.f7_config);
                app.view = app.f7.addView('.view-main', {
                    dynamicNavbar:true
                });
            }
            if(app.config.dom7_enable){
                app.dom7 = Dom7;
            }
            if(app.config.JSAPI_enable){
                app.JSAPI = JSAPI;
            }

            app.free = app.dom7('body').hasClass('app-free');

            JSAPI.keepScreenOn();

        },
        /**
         * функция показа банера (в фри версии)
         * вызывается при инициализации каждой страницы
         */
        ad: function(){
            if(app.free && app.platform != 'android') {
                if (app.adTime) {
                    var now = new Date();
                    if (now.getTime() > app.adTime.getTime() + 2 * 60 * 1000) {
                        app.JSAPI.showAd();
                        app.adTime = new Date();
                    }
                } else {
                    app.adTime = new Date();
                }
            }
        }
    };

    document.addEventListener('DOMContentLoaded', app.init);
})();