'use strict';
//(function(){
    var app = {
        config:{
            f7_enable:true,
            f7_config:{},
            dom7_enable:true,
            JSAPI_enable:true,
            debug:false
        },
        platform:'iOS',
        free: true,
        f7: null,
        view:null,
        dom7:null,
        adTime:null,
        JSAPI:null,
        loadingDisabled:true,
        loadingFakeTime:2000,
        loadingAnimationTime:700,
        playbackStop:false,
        playbackMode:0,//0 - stoped, 1 - played
        batteryLevel:100,//0..100
        batteryUseInMin:0.05,
        screenBrightnessBeforeLaunch:-1,
        html5sounds:false,//если true - звуки будут воспроизводиться через html5
        flashLight:false,//фонарик доступен(есть в устройстве и т.п.)
        flashLightButtonSound:null,
        settings: {
            flashLightLevel:0.5,
            playSounds: false,
            playSoundsMorse: false,
            soundVolume: 0.5,
            displayFlash: false,
            displayFlashColor:'red',
            displayBrightness: 0.5,
            restoreScreenBrightness:true,
            turnFlashOnLaunch: false,
            notFirstLaunch:false
        },
        settingsDefault: {
            flashLightLevel:0.5,
            playSounds: false,
            playSoundsMorse: false,
            soundVolume: 0.5,
            displayFlash: false,
            displayFlashColor:'red',
            displayBrightness: 0.5,
            restoreScreenBrightness:true,
            turnFlashOnLaunch: false,
            notFirstLaunch:false
        },
        meta: {
            title:"App",
            hashtag:"#app",
            language:["EN"],
            languageDefault:0
        },
        morse:{
            playSound:true,
            sound: {
                dot:"data/sound/morze-100.mp3",
                dotH:null,
                dash:"data/sound/morze-300.mp3",
                dashH:null
            },
            duration:{
                dot:50,
                dash:50*3,
                spaceBetweenMorseElement:50,
                spaceBetweenSymbols:50*2,
                spaceBetweenWords:50*5
            },
            convert:{
                //ru:{
                "а":".-",
                "б":"-...",
                "в":".--",
                "г":"--.",
                "д":"-..",
                "е":".",
                "ж":"...-",
                "з":"--..",
                "и":"..",
                "й":".---",
                "к":"-.-",
                "л":".-..",
                "м":"--",
                "н":"-.",
                "о":"---",
                "п":".--.",
                "р":".-.",
                "с":"...",
                "т":"-",
                "у":"..-",
                "ф":"..-.",
                "х":"....",
                "ц":"-.-.",
                "ч":"---.",
                "ш":"----",
                "щ":"--.-",
                "ъ":"--.--",
                "ы":"-.--",
                "ь":"-..-",
                "э":"..-..",
                "ю":"..--",
                "я":".-.-",
                " ":" ",
                ".":".-.-.-",
                ",":"--..--",
                "!":"-.-.--",
                "@":".--.-.",
                "#":"",
                "?":"..--..",
                "(":"",
                ")":"",
                "-":"",
                "+":"",
                "=":"",
                "0":"-----",
                "1":".----",
                "2":"..---",
                "3":"...--",
                "4":"....-",
                "5":".....",
                "6":"-....",
                "7":"--...", "8":"---..", "9":"----.",
                "a":".-",
                "b":"-..",
                "c":"-.-.",
                "d":"-..",
                "e":".",
                "f":"..-.",
                "g":"--.",
                "h":"....",
                "i":"..",
                "j":".---",
                "k":"-.-",
                "l":".-..",
                "m":"--",
                "n":"-.",
                "o":"---",
                "p":".--.",
                "q":"--.-",
                "r":".-.",
                "s":"...",
                "t":"-",
                "u":"..-",
                "v":"...-",
                "w":".--",
                "x":"-..-",
                "y":"-.--",
                "z":"--.."
                //}
            }
        },
        /**
         * Инициализация приложения
         */
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
            /**
             * Библиотека для работы с нативными функциями iOS и Android
             */
            if(app.config.JSAPI_enable){
                app.JSAPI = JSAPI;
                app.log = app.JSAPI.log || console.log;
            }



            app.free = app.dom7('body').hasClass('app-free');

            JSAPI.keepScreenOn();

            /**
             * проверяем наличие фонарика
             */
            app.flashLight = app.checkFlashLight();

            app.loadingStart();
            app.settingsApply();

            window.addEventListener('appCloseEvent', app.onhide);
            window.addEventListener('appMaximizeEvent', app.onrestore);


            //app.flashLightLevelSliderInit();

            app.f7.onPageInit('*', function(page){
                if(page.page != 'index'){
                    clearInterval(app.pageIndexFlashLightLevelInterval);
                }
            });

            app.f7.onPageInit('morse', function(page){
                app.pageMorseInit(page);
            });

            app.f7.onPageInit('morse-list', function(page){
                app.pageMorseListInit(page);
            });

            app.f7.onPageInit('settings', function(page){
                app.pageSettingsInit();
            });

            /**
             *  инициализация главной страницы
             */
            app.pageIndexInit();



        },

        /**
         * метод вызывается при закрытии приложения
         */
        //TODO no JSAPI method
        ondestroy: function(){
            app.log("ON DESTROY!");
            //restore screen brightness
            if(app.settings.restoreScreenBrightness){
                app.JSAPI.setScreenBrightness(app.screenBrightnessBeforeLaunch);
            }
        },

        /**
         * вызывается при сворачивании приложения
         * (при переходе в фоновый режим)
         */
        onhide: function(){
            app.log("ON HIDE!");
            if(app.settings.restoreScreenBrightness){
                app.JSAPI.setScreenBrightness(app.screenBrightnessBeforeLaunch);
            }
        },
        /**
         * - вызывается при восстановлении приложения
         * (если было скрыто)
         * - вызывается при запуске приложения
         */
        onrestore: function(){
            app.log("ON RESTORE!");
            if(app.settings.restoreScreenBrightness){
                app.settingsApply();
            }
        },
        log: console.log,
        /**
         * функция показа банера (в фри версии)
         * вызывается при инициализации каждой страницы
         * только для iOS
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
        },
        //settings
        //morseItems
        getLocalDB: function(){
            var db = localStorage.getItem("db");
            if(db == null){
                db = "{}";
            }
            return JSON.parse(db);
        },
        setLocalDB: function(db){
          localStorage.setItem("db", JSON.stringify(db));
        },

        openSettings: function(){
            app.f7.popup('.popup-settings');
            app.pageSettingsInit();
            app.dom7('.left').html('<a href="#" class="settings-open"><i class="icon icon-close"></i></a>');
            app.dom7('.settings-open').click(function(){
               app.closeSettings();
            });

            app.dom7('.navbar .center').text('Settings');
            app.f7.sizeNavbars('.view-main');
        },

        closeSettings: function(){
            clearInterval(app.settings_sliders_interval);
            app.f7.closeModal('.popup-settings');
            app.dom7('.left').html('<a href="#" class="settings-open"><i class="icon icon-settings"></i></a>');
            app.dom7('.settings-open').click(function(){
                app.openSettings();
            });
            app.dom7('.navbar .center').text(app.meta.title);
            app.f7.sizeNavbars('.view-main');
        },

        pageSettingsInit: function(){
            app.dom7('#settings-sounds').change(function(){
                app.settingsSet('playSounds', app.dom7('#settings-sounds').prop('checked'));
            });

            app.dom7('#settings-sounds').prop('checked', app.settings.playSounds);

            app.dom7('#settings-sounds-morse').change(function(){
                app.settingsSet('playSoundsMorse', app.dom7('#settings-sounds-morse').prop('checked'));
            });

            app.dom7('#settings-sounds-morse').prop('checked', app.settings.playSoundsMorse);

            app.dom7('#settings-brightness-control').change(function(){
                app.settingsSet('restoreScreenBrightness', app.dom7('#settings-brightness-control').prop('checked'));
            });
            app.dom7('#settings-brightness-control').prop('checked', app.settings.restoreScreenBrightness);

            app.dom7('#settings-flash-on-launch').change(function(){
                app.settingsSet('turnFlashOnLaunch', app.dom7('#settings-flash-on-launch').prop('checked'));
            });
            app.dom7('#settings-flash-on-launch').prop('checked', app.settings.turnFlashOnLaunch);


            app.dom7('#settings-volume').prop('value', app.settings.soundVolume);
            app.dom7('#settings-display-brightness').prop('value', app.settings.displayBrightness);
            app.dom7('#settings-flashlight-brightness').prop('value', app.settings.flashLightLevel);

            app.settings_sliders_interval = setInterval(app.pageSettingsSlidersCheck, 500);
        },

        pageIndexFlashLightLevelInterval:0,

        pageIndexInit: function(){

            if(app.settings.turnFlashOnLaunch){
                app.flashLightOn();
                app.flashLightButtonOn();
                app.flashLightEnabled = true;
            }

            app.GPSInit();
            app.compass();
            app.batteryInit();

            app.pageIndexFlashLightLevelInterval = setInterval(app.pageIndexSlidersCheck, 500);
            var flashLightbtn = app.dom7('#flashLightButton');
            flashLightbtn.click(function(){
                if(app.stroboscopeEnabled) {
                    app.stroboscopeToggle();
                }
                if(app.flashLightEnabled){
                    app.flashLightOff();
                    app.flashLightEnabled = false;
                    flashLightbtn.css('color', 'rgba(255, 255, 255, 0)');
                    setTimeout(function(){
                        flashLightbtn.text('On');
                        flashLightbtn.css('color', 'rgba(255, 255, 255, 1)');
                    }, 350);

                    flashLightbtn.removeClass('on');

                } else {
                    app.flashLightEnabled = true;
                    app.flashLightOn();
                    flashLightbtn.css('color', 'rgba(255, 255, 255, 0)');
                    setTimeout(function(){
                        flashLightbtn.text('Off');
                        flashLightbtn.css('color', 'rgba(255, 255, 255, 1)');
                    }, 350);
                    flashLightbtn.addClass('on');
                }
                if(app.settings.playSounds){
                    app.flashLightButtonSound.volume(app.settings.soundVolume);
                    app.flashLightButtonSound.play();
                }


            });

            /*app.dom7('.button-item').click(function(e){
                var btn = app.dom7(e.target);
                if(btn.hasClass('on')){
                    app.dom7('.button-item').removeClass('on');
                    app.dom7('.button-text').removeClass('on');
                } else {
                    app.dom7('.button-item').removeClass('on');
                    app.dom7('.button-text').removeClass('on');
                    btn.addClass('on');
                    var p = btn.dataset().btn;
                    app.dom7('.button-item-wrapper.'+p+' .button-text').addClass('on');
                }
            });*/


            app.dom7('.settings-open').click(function(){
               app.openSettings();
            });

            app.dom7('#bottomButtonMorse').click(function(){
                app.switchButtonAllOff();
                app.switchButtonOn('morse');
                app.stroboscopeStop();
                app.openPopup();

            });

            app.dom7('.button-screen').click(function(){
                app.switchButtonAllOff();
                app.switchButtonOn('screen');
                app.stroboscopeStop();
                app.screenFlashlightOpen();
            });

            app.dom7('.button-sos').click(function(){
                app.switchButtonAllOff();
                app.switchButtonOn('sos');
                app.stroboscopeStop();
                app.morseSOS();
                app.openPopup();
            });

            app.dom7('.button-stroboscope').click(function(){
                app.switchButtonAllOff();
                app.switchButtonOn('stroboscope');
                app.stroboscopeToggle();
            });


            /**
             * часть звуков не проигрывается если их не инициализировать
             * TODO: fix sound
             */
           app.initSounds();
        },

        switchButtonOn: function(p){
            var btn = app.dom7('.button-item.button-'+p);
            var text  = app.dom7('.button-item-wrapper.'+p+' .button-text');

            btn.addClass('on');
            text.addClass('on');
        },

        switchButtonOff: function(p){
            var btn = app.dom7('.button-item.button-'+p);
            var text  = app.dom7('.button-item-wrapper.'+p+' .button-text');

            btn.removeClass('on');
            text.removeClass('on');
        },

        switchButtonAllOff: function(){
            app.dom7('.button-item').removeClass('on');
            app.dom7('.button-text').removeClass('on');
        },

        initSounds: function(){
            app.flashLightButtonSound = new Sound("data/sound/switcher.mp3");
            app.flashLightButtonSound.volume(0);
            app.flashLightButtonSound.play();

            app.morse.sound.dotH = new Sound(app.morse.sound.dot);
            app.morse.sound.dotH.volume(0);
            app.morse.sound.dotH.play();

            app.morse.sound.dashH = new Sound(app.morse.sound.dash);
            app.morse.sound.dashH.volume(0);
            app.morse.sound.dashH.play();
        },
        pageIndexSlidersCheck: function(){
            return;//todo
            var flashLightLevel = app.dom7('#sliderFlashLightLevel').prop('value');
            if(flashLightLevel != app.settings.flashLightLevel){
                app.setFlashLightLevel(flashLightLevel);
            }

            var displayBrightness = app.dom7('#sliderDisplayBrightness').prop('value');
            if(displayBrightness != app.settings.displayBrightness){
                app.setDisplayBrightness(displayBrightness);
            }
        },
        //TODO: framework7 range element not support good onchange method
        pageSettingsSlidersCheck: function(){
            if(app.dom7('#settings-volume').prop('value') != app.settings.soundVolume){
                app.settingsSet('soundVolume', app.dom7('#settings-volume').prop('value'));
            }

            if(app.dom7('#settings-display-brightness').prop('value') != app.settings.displayBrightness){
                app.setDisplayBrightness(app.dom7('#settings-display-brightness').prop('value'));
            }

            if(app.dom7('#settings-flashlight-brightness').prop('value') != app.settings.flashLightLevel){
                app.setFlashLightLevel(app.dom7('#settings-flashlight-brightness').prop('value'));
            }
        },
        morseItemSave: function(text, id){
            if(id == undefined){
                id = -1;
            }
            var db = app.getLocalDB();
            if(!db.morseItems){
                db.morseItems = [];
            }
            if(id < 0){
                db.morseItems.push(text);
                id = db.morseItems.length - 1;
            } else {
                db.morseItems[id] = text;
            }
            app.setLocalDB(db);
            return id;
        },
        morseGetItems: function(){
            var db = app.getLocalDB();
            return db.morseItems || [];
        },
        morseGetItem: function(id){
            var items = app.morseGetItems();
            return items[id];
        },
        morseItemDelete: function(id){
            var db = app.getLocalDB();
            var items = db.morseItems || [];
            items.splice(id, 1);
            db.morseItems = items;
            app.setLocalDB(db);
        },
        loadingStart: function(){

            app.settingsLoad();
            if(app.JSAPI.getScreenBrightness) {
                app.screenBrightnessBeforeLaunch = app.JSAPI.getScreenBrightness();
            }

            if(!app.loadingDisabled) {
                setTimeout(app.loadingFinish, app.loadingFakeTime);//fake loading
            } else {
                app.dom7(".loading-overlay").remove();
            }
        },
        loadingFinish: function(){
            var overlay = app.dom7('.loading-overlay');
            overlay.css('transition-duration', app.loadingAnimationTime/1000+'s');
            overlay.css('opacity', 0);
            overlay.css('top', '-1000px');
            setTimeout(function(){
                app.dom7(".loading-overlay").remove();
            }, app.loadingAnimationTime);
        },
        flashLightOn: function(){
            console.log("LIGHT: ON");
            app.dom7('.flashlight').removeClass('off');
            app.JSAPI.flashLightOn();
        },
        flashLightOff: function(){
            console.log("LIGHT: OFF");
            app.dom7('.flashlight').addClass('off');
            app.JSAPI.flashLightOff();
        },
        /**
         * включает фонарик на какое-то время (в мс),
         * а затем выключает
         */
        flashLightForTime: function(time, callback){
            app.flashLightOn();
            setTimeout(function(){
                app.flashLightOff();
                if(callback != 'undefined'){
                    callback;
                }
            }, time);
        },
        screenFlashForTime: function(time){
            app.screenFlashLightOn();
            setTimeout(app.screenFlashLightOff, time);
        },
        morseDot: function(){
            app.flashLightForTime(app.morse.duration.dot);
            if(app.settings.displayFlash){
                app.screenFlashForTime(app.morse.duration.dot);
            }
        },
        morseDash: function(){
            app.flashLightForTime(app.morse.duration.dash);
            if(app.settings.displayFlash){
                app.screenFlashForTime(app.morse.duration.dash);
            }
        },
        morseDotSound: function(){
            if(!app.settings.playSoundsMorse || !app.settings.playSounds) return;
            app.morse.sound.dotH.volume(app.settings.soundVolume);
            app.morse.sound.dotH.play();
        },
        morseDashSound: function(){
            if(!app.settings.playSoundsMorse || !app.settings.playSounds) return;
            app.morse.sound.dashH.volume(app.settings.soundVolume);
            app.morse.sound.dashH.play();
        },

        playSound: function(path){
            if(!app.settings.playSounds) return;

            if(app.html5sounds){
                var audio = document.createElement('audio');
                audio.src = path;
                audio.play();
                return;
            }
            var snd = new Sound(path);
            snd.volume(app.settings.soundVolume);
            snd.play();
        },

        char2Morse: function(char){
            return app.morse.convert[char.toLowerCase()];
        },
        string2Morse: function(str){
            var morse = "";
            for(var i = 0; i<str.length; i++){
                morse += app.char2Morse(str[i]);
            }
            return morse;
        },
        /**
         * воспроизводит 1 символ преобразованный в код Морзе (т.е. 1 группу)
         * @param morse - код Морзе
         * @param position_morse - позиция с которой начнется воспроизведение
         * @param text
         * @param position
         */
        morsePlay: function(morse, position_morse, text, position){
            if(app.settings.flashLightLevel == 0 || app.settings.flashLightLevel == undefined){
                //фонарик не работает если уровень яркости подсветки = 0
                //TODO #laterDefinition
                app.setFlashLightLevel(0.1);
            }
            if(app.playbackStop){
                app.playbackStop = false;
                return;
            }

            /**
             * символ (группа) проигран
             * переходим к следующему
             */
            if(position_morse >= morse.length){
                setTimeout(function(){
                    app.morseText(text, position+1);
                }, app.morse.duration.spaceBetweenSymbols);
                return;
            }

            if(app.settings.displayFlash && app.dom7('.screen-flashlight').css('display') == 'none'){
                app.screenFlashlightOpen();
            }

            console.log("MORSE: "+morse[position_morse]);
            var duration = 0;
           // var sound_src = "";
            if(morse[position_morse] == '.'){
                duration = app.morse.duration.dot;
                app.morseDotSound();
            } else if(morse[position_morse] == "-") {
                duration = app.morse.duration.dash;
                app.morseDashSound();
            } else if(morse[position_morse] == " ") {
                duration = app.morse.duration.spaceBetweenWords;
                //sound_src = "";
            }

            app.flashLightForTime(duration);
            if(app.settings.displayFlash){
                app.screenFlashForTime(duration);
            }

            duration = duration + app.morse.duration.spaceBetweenSymbols;
           /* if(app.morse.playSound) {
                var audio = document.createElement('audio');
                audio.src = sound_src;
                audio.play();
            }*/
            setTimeout(function(){
                //audio = null;
                app.morsePlay(morse, position_morse+1, text, position);
            }, duration);
        },

        /**
         * Воспроизводит текст в виде кода Морзе
         * @param text
         * @param position - символ с которого начинается воспроизведение
         */
        morseText: function(text, position){
            if(position == undefined){
                position = 0;
            }
            if(app.playbackStop){
                app.playbackStop = false;
                return;
            }
            app.dom7('.morse-symbol-active').removeClass('morse-symbol-active');
            if(position == 0){
                console.log("START TEXT: "+text+" MORSE: "+app.string2Morse(text));
                if(app.settings.displayFlash){
                    app.screenFlashlightOpen();
                }
            }
            if(position >= text.length) {
                var code = app.dom7('.morse-code');
                code.css('transform', 'translateX(0px)');
                code.css('-webkit-transform', 'translateX(0px)');//iOS Webkit don't support transform
                console.log("END OF TEXT");

                if(true){//loop
                    app.morseText(text, 0);
                } else {
                    app.stop();
                    if(app.settings.displayFlash){
                        app.screenFlashlightClose();
                    }
                }
                return;
            }
            var morse_symbol = app.dom7('.morse-symbol-'+position);
            var code = app.dom7('.morse-code');
            code.css('transform', 'translateX('+(-document.getElementsByClassName('morse-symbol-'+position)[0].offsetLeft)+'px)');
            code.css('-webkit-transform', 'translateX('+(-document.getElementsByClassName('morse-symbol-'+position)[0].offsetLeft)+'px)');//iOS Webkit don't support transform

            morse_symbol.addClass('morse-symbol-active');
            var morse = app.char2Morse(text[position]);
            console.log("PLAY: "+text[position]+" MORSE: "+morse);
            app.morsePlay(morse, 0, text, position);
        },

        morseBottomButtonToggle: function(e){
            var btn = app.dom7(e.target);
            if(btn.hasClass('on')){
                btn.removeClass('on');
            } else {
                btn.addClass('on');
            }
        },

        play: function(){
            if(!app.dom7('#text').prop('value').length) return;
            app.dom7('#text').prop('disabled', 'true');
            if(app.playbackMode == 0){
                app.dom7('#play').addClass('stop');
                app.playbackMode = 1;
                app.playbackStop = false;
                app.morseText(app.dom7('#text').val(), 0);
            } else {
                app.stop();
            }

            if(app.settings.playSounds){
                app.flashLightButtonSound.volume(app.settings.soundVolume);
                app.flashLightButtonSound.play();
            }
        },
        stop: function(){
            app.dom7('#text').removeAttr('disabled');
            app.dom7('#play').removeClass('stop');
            app.playbackStop = true;
            app.playbackMode = 0;
            if(app.settings.playSounds){
                app.flashLightButtonSound.volume(app.settings.soundVolume);
                app.flashLightButtonSound.play();
            }
        },
        morseModeSOS:false,
        morseSOS: function(){
            app.morseModeSOS = true;
        },

        compass: function(){

            app.JSAPI.log("COMPAS INIT");

            app.compassRotate(0);

            window.addEventListener('magneticHeadingEvent', function(){
                app.compassRotate(getBufferEventVar().magneticHeading);
            });


        },

        compassOldRotate:0,
        compassRotate: function(deg){

           /* if(app.compassOldRotate != deg){
                var x = deg - app.compassOldRotate;
                app.compassOldRotate += x;
            } else {
                return;
            }*/
            var deg_new = deg;
            if(deg >= 355 && deg <= 360){
                app.dom7('.compass-bg').css('transition-duration', '0s');
                deg_new = deg - 360;
            } else {
                app.dom7('.compass-bg').css('transition-duration', '0.5s');
            }
            if((deg > 180 && deg < 355) && app.compassOldRotate >= 355) {
                app.dom7('.compass-bg').css('transition-duration', '0s');
            }
            var screenWidth = app.dom7(window).width();

            /**
             * расчет позиции фона с рисками
             * width/2 - учитываем что отметки должны быть в центре экрана, и сдвигаем фон
             * ppd - pixels per degree, 1 риска это 3 градуса, на фоне 3 градуса (расстояние между рисками)
             * составляет 5px, учитывая ширину самих рисок (2px) получаем 7px/3deg = 2.33
             */
            var ppd = 7/3;
            //iPhone 5 - 521
            //iPhone 6 - 466
            //iPhone 6s - 427
            //iPad - 913
            var magic = 521-Math.abs(screenWidth-320);
            var position = magic + screenWidth/2+(deg_new*ppd);
            /*
            if(deg >= 350 && deg <= 360){
                app.dom7('.compass-bg').css('transition-duration', '0s');
            } else if(deg >= 0 && deg <= 10) {
                app.dom7('.compass-bg').css('transition-duration', '0s');
            } else {
                app.dom7('.compass-bg').css('transition-duration', '0.5s');
            }*/

            if(app.config.debug)app.dom7('.compass-debug').text(deg);
            var markPosition = screenWidth/2 - 1;//2 - width of mark, 2/2 = 1
            app.dom7('.compass-mark').css('left', markPosition + 'px');
            app.dom7(".compass-bg").css({ "background-position-x":  '-'+position + "px"});
            app.compassOldRotate = deg;
        },

        GPSInit: function(){
            //if(navigator.geolocation){//html5
           //     navigator.geolocation.watchPosition(app.GPSWatch);
           // } else {//fallback to webactivity JSAPI
                //app.JSAPI.log("START GPS WATCH");
                app.JSAPI.listenLocation(500, 0, 'gps');
                window.addEventListener('locationChangedEvent', function(){
                    //app.JSAPI.log("GPS LISTENER"+getBufferEventVar().latitude);
                    app.GPSWatch({coords:getBufferEventVar()});
                });
            //}
        },

        GPSWatch: function(position){
            app.dom7('.gps-position').text('Lat: '+position.coords.latitude+' Long: '+position.coords.longitude);

            app.dom7('.info-latitude .text').text(position.coords.latitude.toFixed(2));
            app.dom7('.info-longitude .text').text(position.coords.longitude.toFixed(2));
            app.dom7('.info-altimeter .text').text(position.coords.altitude.toFixed(1)+'m');

        },

        //0, 1, 2
        flashlightButtonState:0,
        flashLightButtonScrollStart:false,

        flashLightButton : {
            _value:0,
             stopAllAnimations: false
        },

        flashLightButtonOn: function(){
            var flashLightbtn = app.dom7('#flashLightButton');
            flashLightbtn.css('color', 'rgba(255, 255, 255, 0)');
            setTimeout(function(){
                flashLightbtn.text('Off');
                flashLightbtn.css('color', 'rgba(255, 255, 255, 1)');
            }, 350);
            flashLightbtn.addClass('on');
        },

        flashLightButtonOff: function(){
            var flashLightbtn = app.dom7('#flashLightButton');
            flashLightbtn.css('color', 'rgba(255, 255, 255, 0)');
            setTimeout(function(){
                flashLightbtn.text('On');
                flashLightbtn.css('color', 'rgba(255, 255, 255, 1)');
            }, 350);
            flashLightbtn.removeClass('on');
        },

        flashlightButtonInit: function(){
            /*var wrapper = app.dom7('.flashlight-button-wrapper');
            var button = app.dom7('.flashlight-button');
            wrapper.on('click', function(){
                return false;
            });

            wrapper.scroll(function(){
               //console.log('SCROLL'+wrapper.scrollTop());
                app.flashLightButtonScrollStart = true;
                if(wrapper.scrollTop()>75){
                    wrapper.scrollTop(75);
                }
            });
            wrapper.touchstart(function(){
                if(app.flashlightButtonState != 2){
                    app.buttonStatePress();
                }
            });
            wrapper.touchend(function(){
                if(app.flashLightButtonScrollStart){
                    if(wrapper.scrollTop()>40){
                        app.flashLightButtonAnimate(75, app.buttonStateOn);
                    } else {
                        app.flashLightButtonAnimate(0, app.buttonStateOff);
                    }
                    app.flashLightButtonScrollStart = false;
                } else if(app.flashlightButtonState != 2) {
                    app.buttonStateOff();
                }
            });*/

            var slider = app.dom7('.range-slider');
            slider.touchstart(function(){
                console.log("START");
                app.flashLightButton.stopAllAnimations = true;

            });

            slider.touchend(function(){
                console.log("END");
                app.flashLightButton.stopAllAnimations = false;
                app.flashLightButtonSliderAnimate();
            });

            var checkSliderValue = function(){
                return false;//TODO delete this function
                var slider_value = document.getElementById('flashLightButton').value;
                if(app.flashLightButton._value != slider_value) {
                    app.flashLightButtonChange(slider_value);
                    app.flashLightButton._value = slider_value;
                }
                setTimeout(checkSliderValue, 50);
            };
            checkSliderValue();

        },
        flashLightButtonChange: function(value){
            //if(app.flashLightButton.stop) return;
            //app.flashLightButton.stop = true;
            console.log("CHANGED: "+value);
            //app.flashLightButtonSliderAnimate()
        },
        flashLightButtonSliderAnimate: function(){
            var slider = document.getElementById('flashLightButton');
            if(slider.value < 5){
                console.log("ANIMATE VALUE: "+slider.value+" MOVE: "+0);
                app.flashLightButtonSliderMoveTo(0);
            } else {
                console.log("ANIMATE VALUE: "+slider.value+" MOVE: "+10);
                app.flashLightButtonSliderMoveTo(10);
            }
        },
        flashLightButtonSliderMoveTo: function(value){
            if(app.flashLightButton.stopAllAnimations) return;
            var slider = document.getElementById('flashLightButton');
            console.log("VALUE "+slider.value+" MOVE TO "+value);
            if(slider.value != value){
                if(slider.value > value){
                    console.log("DECREASE VALUE");
                    slider.value -= 0.2;
                    setTimeout(function(){app.flashLightButtonSliderMoveTo(value )}, 10);
                }
                if(slider.value < value){
                    console.log("INCREASE VALUE: OLD: "+slider.value+" ADD: "+0.2+" RESULT: "+(slider.value + 0.2));

                    slider.value += 0.2;

                    console.log("INCREASED VALUE:"+slider.value);
                    setTimeout(function(){app.flashLightButtonSliderMoveTo(value )}, 1000);
                }

            }
        },
        flashLightButtonAnimate: function(scrollTo, callback){
            var wrapper = app.dom7('.flashlight-button-wrapper');
            if(wrapper.scrollTop() == scrollTo){
                if(callback != 'undefined')
                    callback();
                return;
            }
            setTimeout(function(){
                if(wrapper.scrollTop() > scrollTo){
                    wrapper.scrollTop(wrapper.scrollTop()-1);
                    app.flashLightButtonAnimate(scrollTo, callback);
                }
                if(wrapper.scrollTop() < scrollTo){
                    wrapper.scrollTop(wrapper.scrollTop()+1);
                    app.flashLightButtonAnimate(scrollTo, callback);
                }

            }, 10);
        },
        buttonStatePress:function(){
            app.flashlightButtonState = 1;
            app.flashLightOn();
        },
        buttonStateOn: function(){
            app.flashlightButtonState = 2;
            app.flashLightOn();
        },
        buttonStateOff: function(){
            app.flashlightButtonState = 0;
            app.flashLightOff();
        },

        renderMorse: function(text){

            //document.getElementById('morse').value = app.string2Morse(text.value);
            var morse = document.getElementById('morse');
            morse.innerHTML = '';
            for(var i = 0; i < text.length; i++){
                var morse_code = app.char2Morse(text[i]);
                var node = document.createElement('div');
                node.classList.add('morse-symbol');
                node.classList.add('morse-symbol-'+i);
                node.innerText = morse_code;
                morse.appendChild(node);
            }

        },

        morseItemId:-1,

        pageMorseInit: function(page){
            var text = document.getElementById('text');
            var item_text = text.value || '';
            if(page == undefined || !page.query.id) {
                app.morseItemId = -1;
            } else {
                app.morseItemId = page.query.id;
                item_text = app.morseGetItem(app.morseItemId);
            }

            app.dom7('#play').on('click', function(){
                app.play();
            });


            text.value = item_text;
             text.addEventListener('input', function(){
                 app.renderMorse(text.value);
             });
            if(app.morseModeSOS){
                text.value = "SOS";
                app.morseModeSOS = false;
                app.renderMorse(text.value);
                app.play();
            } else if(page == undefined) {
                text.value = "";
                app.renderMorse(text.value);
            } else {
                app.renderMorse(text.value);
            }

            app.dom7('.save').on('click', function(){
                if(app.morseIconSaveBlock) return;
                app.morseSaveItem();
                app.morseIconSaveAnimation();
            });

            var btn_sound = app.dom7('.morse-button-sound');
            btn_sound.click(function(){
                if(app.settings.playSoundsMorse){
                    app.settingsSet('playSoundsMorse', false);
                    btn_sound.removeClass('on');
                    btn_sound.removeClass('icon-sound-on');
                    btn_sound.addClass('icon-sound-off');
                } else {
                    app.settingsSet('playSoundsMorse', true);
                    btn_sound.addClass('on');
                    btn_sound.removeClass('icon-sound-off');
                    btn_sound.addClass('icon-sound-on');
                }
            });

            if(app.settings.playSoundsMorse){
                app.settingsSet('playSoundsMorse', true);
                btn_sound.addClass('on');
                btn_sound.removeClass('icon-sound-off');
                btn_sound.addClass('icon-sound-on');
            } else {
                app.settingsSet('playSoundsMorse', false);
                btn_sound.removeClass('on');
                btn_sound.removeClass('icon-sound-on');
                btn_sound.addClass('icon-sound-off');
            }

            var btn_screen = app.dom7('.morse-button-screen');
            btn_screen.click(function(){
                if(app.settings.displayFlash){
                    app.settingsSet('displayFlash', false);
                    btn_screen.removeClass('on');
                    btn_screen.removeClass('icon-screen-on');
                    btn_screen.addClass('icon-screen-off');
                } else {
                    app.settingsSet('displayFlash', true);
                    btn_screen.addClass('on');
                    btn_screen.removeClass('icon-screen-off');
                    btn_screen.addClass('icon-screen-on');
                }
            });

            if(app.settings.displayFlash){
                btn_screen.addClass('on');
                btn_screen.removeClass('icon-screen-off');
                btn_screen.addClass('icon-screen-on');
            } else {
                btn_screen.removeClass('on');
                btn_screen.removeClass('icon-screen-on');
                btn_screen.addClass('icon-screen-off');
            }



        },
        morseIconSaveBlock:false,
        morseIconSaveAnimation: function(){
            app.morseIconSaveBlock = true;
            var save = app.dom7('.save');
            save.css('opacity', '0');
            setTimeout(function(){
                save.removeClass('icon-save');
                save.addClass('icon-check');
                save.css('opacity', '1');
                setTimeout(function(){
                    save.css('opacity', '0');
                    setTimeout(function(){
                        save.removeClass('icon-check');
                        save.addClass('icon-save');
                        save.css('opacity', '1');
                        app.morseIconSaveBlock = false;
                    }, 500);
                }, 500);
            }, 500);
        },

        morseItemsBuild: function(){
            var items = app.morseGetItems();
            var list = app.dom7('ul');
            var dots = '';

            list.html(" ");
            for(var i = 0; i<items.length; i++) {
                if(items[i].length > 20){
                    dots = '...';
                } else {
                    dots = '';
                }
                list.append('<li class="swipeout morse-item" data-id="'+i+'">'+
                    '<a href="morse.html?id='+i+'" class="swipeout-content item-content item-link">'+
                    '<div class="item-inner">'+items[i].substring(0,20)+dots+'</div>'+
                    '</a>'+
                    '<div class="swipeout-actions-right">'+
                    '<a class="morse-item-delete swipeout-delete" href="#" data-id="'+i+'">Delete</a>'+
                    '</div>'+
                    '</li>');
            }

            app.dom7('.morse-item-delete').click(function(p){
                app.morseItemDelete(p.target.attributes["data-id"]["value"]);
                app.morseItemsBuild();
            });
        },

        pageMorseListInit: function(page){
            app.morseItemsBuild();
        },
        morseSaveItem: function(){
            if(app.morseItemId > -1){
                app.morseItemSave(document.getElementById('text').value, app.morseItemId);
            } else {
                app.morseItemSave(document.getElementById('text').value);
            }
        },

        batteryInit: function(){
            if(app.JSAPI.getBatteryLevel){
                //app.batteryLevel = app.JSAPI.getBatteryLevel() || 0;
            }
            app.batteryCalculate();
            if(app.JSAPI.startBatteryLevelChangedListen) {
                app.JSAPI.startBatteryLevelChangedListen();
            }
            window.addEventListener('batteryLevelChangedEvent', function(){
                app.batteryLevel = getBufferEventVar().batteryLevel;
                app.batteryCalculate();
            });
        },
        batteryCalculate: function(){
            var minutes = app.batteryLevel / app.batteryUseInMin;
            app.dom7('.battery').text(minutes+'min');
        },
        checkFlashLight: function(){
            app.JSAPI.isFlashLight();
            return getBufferEventVar().flashLightWork == "true";
        },
        setFlashLightLevel: function(value){
            if(value < 0.1 || value == undefined || !value) return app.log("Error! setFlashLightLevel: value incorrect ("+value+")");
            if(!app.flashLight) return app.log("Flashlight unavailable!");
            app.settingsSet('flashLightLevel', value);
            app.JSAPI.flashLightLevel(value);
        },
        getFlashLightLevel: function(){
            return app.log("Warning! getFlashLightLevel not supported current JSAPI");
            if(!app.flashLight) return app.log("Flashlight unavailable!");
            app.JSAPI.flashLightLevel();
        },
        setDisplayBrightness: function(value){
            app.settingsSet('displayBrightness', value);
            app.JSAPI.setScreenBrightness(value);
        },
        getDisplayBrightness: function(){
            if(app.JSAPI && app.JSAPI.getScreenBrightness){
                app.JSAPI.getScreenBrightness();
                return parseFloat(getBufferEventVar().brightnessLevel);
            }
        },
        /**
         * функция вызывается при первом запуске приложения на устройстве
         */
        firstLaunch: function(){

        },
        settingsLoad: function(){
            var db = app.getLocalDB();
            var settings = db.settings || app.settingsDefault;
            if(!settings.notFirstLaunch || settings.notFirstLaunch == undefined){
                app.firstLaunch();
                settings.notFirstLaunch = true;
                settings.displayBrightness = app.getDisplayBrightness();
                settings.flashLightLevel = app.getFlashLightLevel();
            }
            app.settings = settings;
            app.settingsSave();
        },
        settingsSave: function(){
            var db = app.getLocalDB();
            db.settings = app.settings;
            app.setLocalDB(db);
        },
        settingsSet: function(param, value){
            app.settings[param] = value;
            app.settingsSave();
        },
        settingsApply: function(){

            app.screenBrightnessBeforeLaunch = app.getDisplayBrightness();

            if(app.JSAPI.flashLightLevel){
                app.setFlashLightLevel(app.settings.flashLightLevel);
            }

            if(app.JSAPI.setScreenBrightness){
                app.setDisplayBrightness(app.settings.displayBrightness);
            }
        },
        openPopup: function(){
            var modal = app.dom7('.modal-custom');
            app.dom7('.page-content').addClass('blur');
            app.dom7('.navbar').addClass('blur');
            app.f7.get("morse2.html", {}, {}, function(data){
                app.dom7('.modal-content').html(data);
                //modal.css('margin-top', '-'+modal.height()/2+'px');
                app.pageMorseInit();

                app.dom7('.modal-custom-close').click(function(){
                    app.closePopup();
                });
            });
            modal.css('display', 'block');
            app.dom7('.modal-overlay').addClass('modal-overlay-visible');


        },
        closePopup: function(){
            app.dom7('.modal-custom').css('display', 'none');
            app.dom7('.modal-overlay').removeClass('modal-overlay-visible');
            app.dom7('.page-content').removeClass('blur');
            app.dom7('.navbar').removeClass('blur');
            app.stop();
            app.switchButtonAllOff();
        },

        screenFlashlightInterval: null,

        screenFlashlightOpen: function(){
            app.dom7('.screen-flashlight').addClass(app.settings.displayFlashColor);
            app.dom7('.screen-flashlight .color').removeClass('selected');
            app.dom7('.screen-flashlight .color.'+app.settings.displayFlashColor).addClass('selected');
            app.dom7('.screen-flashlight').css('display', 'block');
            app.dom7('#screen-flashlight-brightness').prop('value', app.settings.displayBrightness);
            //app.dom7('.screen-flashlight .close').off();
            app.dom7('.screen-flashlight .close').click(function(){
                app.screenFlashlightClose();
            });
            app.screenFlashlightInterval = setInterval(app.screenFlashlightRange, 50);
            //app.dom7('.color').off();
            app.dom7('.color').click(app.screenFlashlightSetColor);
            app.screenFlashLightOn();
        },

        screenFlashlightClose: function(){
            app.dom7('.screen-flashlight').css('display', 'none');
            clearInterval(app.screenFlashlightInterval);
            app.switchButtonAllOff();

            if(app.playbackMode == 1){//morse play
                var btn_screen = app.dom7('.morse-button-screen');
                app.settingsSet('displayFlash', false);
                btn_screen.removeClass('on');
                btn_screen.removeClass('icon-screen-on');
                btn_screen.addClass('icon-screen-off');
            }
        },

        screenFlashlightRange: function(){
            var range = app.dom7('#screen-flashlight-brightness');
            if(range.prop('value') != app.settings.displayBrightness){
                app.setDisplayBrightness(range.prop('value'));
            }
        },

        screenFlashLightOn: function(){
            app.dom7('.screen-flashlight').removeClass('screen-off');
        },

        screenFlashLightOff: function(){
            app.dom7('.screen-flashlight').addClass('screen-off');
        },

        screenFlashlightSetColor: function(e){
            var color = app.dom7(e.target).dataset().color;
            var screen = app.dom7('.screen-flashlight');
            screen.removeClass('red');
            screen.removeClass('blue');
            screen.removeClass('green');
            screen.removeClass('white');
            screen.addClass(color);
            app.dom7('.color.red').removeClass('selected');
            app.dom7('.color.blue').removeClass('selected');
            app.dom7('.color.green').removeClass('selected');
            app.dom7('.color.white').removeClass('selected');
            app.dom7('.color.'+color).addClass('selected');
            app.settingsSet('displayFlashColor', color);
        },
        stroboscopeEnabled:false,
        stroboscope: function(){
            if(app.stroboscopeEnabled){
                app.stroboscopeOn();
            }
        },
        stroboscopeOn: function(){
            if(!app.stroboscopeEnabled) return;
            app.flashLightOn();
            setTimeout(app.stroboscopeOff, 10);
        },
        stroboscopeOff: function(){
            if(!app.stroboscopeEnabled) return;
            app.flashLightOff();
            setTimeout(app.stroboscope, 10);
        },
        stroboscopeToggle: function(){
            if(app.stroboscopeEnabled){
                app.stroboscopeStop();
            } else {
                app.stroboscopeOn();
                app.stroboscopeEnabled = true;
            }
        },
        stroboscopeStop: function(){
            app.stroboscopeEnabled = false;
            app.stroboscopeOff();
            app.switchButtonOff('stroboscope');
        }
    };
    document.addEventListener('DOMContentLoaded', app.init);