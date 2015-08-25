'use strict';
//(function(){
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
        loadingDisabled:true,
        loadingFakeTime:1000,
        loadingAnimationTime:700,
        playbackStop:false,
        playbackMode:0,//0 - stoped, 1 - played
        batteryLevel:100,//0..100
        batteryUseInMin:0.05,
        screenBrightnessBeforeLaunch:-1,
        settings: {
            flashLightLevel:0.5,
            playSounds: false,
            playSoundsMorse: false,
            soundVolume: 0.5,
            displayFlash: false,
            displayFlashColor:'red',
            displayBrightness: 0.5,
            restoreScreenBrightness:true
        },
        settingsDefault: {
            flashLightLevel:0.5,
            playSounds: false,
            playSoundsMorse: false,
            soundVolume: 0.5,
            displayFlash: false,
            displayFlashColor:'red',
            displayBrightness: 0.5,
            restoreScreenBrightness:true
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
                dot:"data/sound/100.wav",
                dash:"data/sound/200.wav"
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

            app.loadingStart();
            app.settingsApply();

            app.dom7('#turnOn').on('click', function(){
                app.flashLightOn();
            });
            app.dom7('#turnOff').on('click', function(){
                app.flashLightOff();
            });

            app.compass();
            app.GPSInit();
            app.batteryInit();
            app.flashlightButtonInit();
            app.flashLightLevelSliderInit();

            app.f7.onPageInit('morse', function(page){
                app.pageMorseInit(page);
            });

            app.f7.onPageInit('morse-list', function(page){
                app.pageMorseListInit(page);
            });

            app.f7.onPageInit('settings', function(page){
                app.pageSettingsInit();
            });

            /*app.dom7('#test').on('change', function(){
                console.log("SLIDER");
            });
            document.getElementById('test').addEventListener('change', function(){
                console.log("test");
            })*/



        },
        destroy: function(){
            //restore screen brightness
            if(app.settings.restoreScreenBrightness){
                app.JSAPI.setScreenBrightness(app.screenBrightnessBeforeLaunch);
            }
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

        pageSettingsInit: function(){
            app.dom7('#settings-sounds').change(function(){
                app.settingsSet('playSounds', app.dom7('#settings-sounds').prop('checked'));
            });

            app.dom7('#settings-sounds').prop('checked', app.settings.playSounds);

            app.dom7('#settings-sounds-morse').change(function(){
                app.settingsSet('playSoundsMorse', app.dom7('#settings-sounds-morse').prop('checked'));
            });

            app.dom7('#settings-sounds-morse').prop('checked', app.settings.playSoundsMorse);

            app.dom7('#settings-display-flash').change(function(){
                app.settingsSet('displayFlash', app.dom7('#settings-display-flash').prop('checked'));
            });

            app.dom7('#settings-display-flash').prop('checked', app.settings.displayFlash);

            app.dom7('#settings-volume').prop('value', app.settings.soundVolume);
            app.dom7('#settings-display-brightness').prop('value', app.settings.displayBrightness);
            app.dom7('#settings-flashlight-brightness').prop('value', app.settings.flashLightLevel);

            app.settings_sliders_interval = setInterval(app.pageSettingsSlidersCheck, 500);
        },
        //framework7 range element not support good onchange method
        pageSettingsSlidersCheck: function(){
            if(app.dom7('#settings-volume').prop('value') != app.settings.soundVolume){
                app.settingsSet('soundVolume', app.dom7('#settings-volume').prop('value'));
            }

            if(app.dom7('#settings-display-brightness').prop('value') != app.settings.displayBrightness){
                app.settingsSet('displayBrightness', app.dom7('#settings-display-brightness').prop('value'));
            }

            if(app.dom7('#settings-flashlight-brightness').prop('value') != app.settings.flashLightLevel){
                app.settingsSet('flashLightLevel', app.dom7('#settings-flashlight-brightness').prop('value'));
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
        morseDot: function(){
            app.flashLightForTime(app.morse.duration.dot);
        },
        morseDash: function(){
            app.flashLightForTime(app.morse.duration.dash);
        },
        morseDotSound: function(){
            if(!app.soundEnable) return;
            var snd = new Sound(app.morse.sound.dot);
            snd.volume(app.soundVolume);
            snd.play();
        },
        morseDashSound: function(){
            if(!app.soundEnable) return;
            var snd = new Sound(app.morse.sound.dash);
            snd.volume(app.soundVolume);
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

        morseText: function(text, position){
            if(app.playbackStop){
                app.playbackStop = false;
                return;
            }
            app.dom7('.morse-symbol-active').removeClass('morse-symbol-active');
            if(position == 0){
                console.log("START TEXT: "+text+" MORSE: "+app.string2Morse(text));
            }
            if(position >= text.length) {
                app.dom7('.morse-code').css('left', '0px');
                console.log("END OF TEXT");
                if(app.dom7('#cb_loop').prop('checked')){
                    app.morseText(text, 0);
                } else {
                    app.stop();
                }
                return;
            }
            var morse_symbol = app.dom7('.morse-symbol-'+position);
            app.dom7('.morse-code').css('left', -document.getElementsByClassName('morse-symbol-'+position)[0].offsetLeft+'px');

            morse_symbol.addClass('morse-symbol-active');
            var morse = app.char2Morse(text[position]);
            console.log("PLAY: "+text[position]+" MORSE: "+morse);
            app.morsePlay(morse, 0, text, position);
        },

        play: function(){
            if(app.playbackMode == 0){
                app.dom7('#play').addClass('stop');
                app.playbackMode = 1;
                app.playbackStop = false;
                app.morseText(app.dom7('#text').val(), 0);
            } else {
                app.stop();
            }
        },
        stop: function(){
            app.dom7('#play').removeClass('stop');
            app.playbackStop = true;
            app.playbackMode = 0;
        },

        compass: function(){

            var rotate = function (deg) {
                app.dom7(".compass").css({ "transform": "rotate(0deg)"});
                app.dom7(".compass").css({ "transform": "rotate(" + deg + "deg)"});
            };

            if (app.JSAPI.listenMagneticField) {
                console.log("Use JSAPI magneticField");
                app.JSAPI.listenMagneticField(2000);
                JSAPI.log("LISTEN");

                window.addEventListener('magneticFieldChangedEvent', function () {
                    console.log('magnetic changed ' + getBufferEventVar().x + ' | ' + getBufferEventVar().y + ' | ' + getBufferEventVar().z);
                    rotate(360 - getBufferEventVar().x);
                });

            } else {
                JSAPI.log("LISTEN2");
                if (window.DeviceOrientationEvent) {//html5
                    console.log("Use html5 device orientation");
                    window.addEventListener("deviceorientation", function (e) {
                        rotate(360 - e.alpha);
                    }, false);
                } else {
                    console.log("No available methods for get magnetic field information! Your device realy support it?");
                }
            }


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

            var altitude = position.coords.altitude;
            if(altitude == null) {
                altitude = 0;
            }
            app.dom7('.altitude').text(altitude+'m');

        },

        //0, 1, 2
        flashlightButtonState:0,
        flashLightButtonScrollStart:false,

        flashLightButton : {
            _value:0,
             stopAllAnimations: false
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
            var item_text = '';
            if(!page.query.id) {
                app.morseItemId = -1;
            } else {
                app.morseItemId = page.query.id;
                item_text = app.morseGetItem(app.morseItemId);
            }

            app.dom7('#play').on('click', function(){
                app.play();
            });

            app.dom7('#stop').on('click', function(){
                app.stop();
            });

            var text = document.getElementById('text');
            text.value = item_text;
             text.addEventListener('input', function(){
                 app.renderMorse(text.value);
             });
            app.renderMorse(text.value);
            app.dom7('.save').on('click', function(){
                app.morseSaveItem();
            });
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
        flashLightLevelSliderInit: function(){

        },
        setFlashLightLevel: function(value){
            app.settingsSet('flashLightLevel', value);
            app.JSAPI.flashLightLevel(value);
        },
        settingsLoad: function(){
            var db = app.getLocalDB();
            var settings = db.settings || app.settingsDefault;
            app.settings = settings;
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
            if(app.JSAPI.flashLightLevel){
                app.JSAPI.flashLightLevel(app.settings.flashLightLevel);
            }

            if(app.JSAPI.setScreenBrightness){
                app.JSAPI.setScreenBrightness(app.settings.displayBrightness);
            }
        },
        screenBrightnessSliderInit: function(){

        },
        setScreenBrightness: function(value){
            app.settingsSet('displayBrightness', value);
            app.JSAPI.setScreenBrightness(value);
        }
    };
    document.addEventListener('DOMContentLoaded', app.init);