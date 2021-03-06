// anonymous function space,
// prevent variable confliction
//
// Basic js apis including ajax request, log, encode/decode,
//
(function () {
    "use strict";
    var itrue = window.itrue;
    if (!itrue) {
    // define itrue object
        itrue = window.itrue = {
            // cache ajax response data if needed
            ajaxResultCache: {},
            // queue multiple ajax operation
            ajaxActionQueue: [],
            // div used to decode
            decodeDiv: document.createElement('div'),
            // JavaScript Classes for OOP
            jsClasses: {},
            // functions that will be executed in init
            initFuncs: [],
            // functions that will be executed in onResponse()
            respFuncs: [],
            // event registry for class instances
            instEvtReg: {},
            // functions for itrue.register/itrue.exec
            funcRegistry: {},
            // called on document ready
            init: function () {
                itrue.ready = true;
                var initFuncs = this.initFuncs,
                    idx = 0,
                    len = initFuncs.length;
                // run all funcs that pushed by
                // itrue.afterLoad
                for ( ; idx < len; idx++) {
                    initFuncs[idx]();
                }
                // trigger onInit event of
                // all JS class instances
                itrue.triggerInstsEvent('onInit');
                // output all tmp log message
                if (itrue.tmpLogMsg)
                    itrue.log(itrue.tmpLogMsg);
            },
            // triggered by ajax call response
            onResponse: function () {
                var respFuncs = this.respFuncs,
                    idx = 0,
                    len = respFuncs.length;
                // call all funcs registered by
                // itrue.afterResponse
                for ( ; idx < len; idx++) {
                    respFuncs[idx]();
                }
            },
            // push functions that should be executed
            // after page loaded (document.ready)
            afterLoad: function (foo) {
                this.initFuncs.push(foo);
            },
            // push funcs that should be executed
            // after ajax success
            afterResponse: function (foo) {
                this.respFuncs.push(foo);
            },
            register: function (key, func) {
                var reg = this.funcRegistry,
                    arr = reg[key];
                if (!arr) {
                    reg[key] = [];
                    arr = reg[key];
                }
                if (arr.indexOf(func) < 0)
                    arr.push(func);
            },
            exec: function (key) {
                var reg = this.funcRegistry,
                    arr = reg[key];

                if (!arr) return;
                var len = arr.length,
                    idx = 0;
                for ( ; idx < len; idx++) {
                    arr[idx]();
                }
            },
            // util for reset timeout function of an instance
            replaceTimeout: function (wgt, func, delay, keyword) {
                // clear it first
                this.clearTimeout(wgt, keyword);
                // set it again
                wgt[keyword] = setTimeout(func, delay);
            },
            // util for clear timeout function of an instance
            clearTimeout: function (wgt, keyword) {
                if (wgt[keyword]) // clear if exists
                    clearTimeout(wgt[keyword]);
            },
            // find tag element by attribute value
            findTagByAttr: function (tagName, attrName, attrValue) {
                var tagArr = $(tagName), // all elements of that tagName
                    idx = 0,
                    len = tagArr.length,
                    tag;
                for ( ; idx < len; idx++) {
                    tag = tagArr[idx]; // ith element
                    // has exactly the specified value for specified attribute
                    if ($(tag).attr(attrName) == attrValue)
                        break;
                }
                return tag;
            },
            // decode &#xx;
            decodeLatin: function (text, idx, semiIdx) {
                // hex: &#x****;
                // decimal: &#**;
                var isHex = (text.charAt(idx + 2).toLowerCase() == 'x');
                return String.fromCharCode(
                    isHex?
                    parseInt(text.substring(idx + 3, semiIdx), 16) : // convert hex
                    parseInt(text.substring(idx + 2, semiIdx), 10) // convert decimal
                );
            },
            // decode HTML Entity (e.g. &amp;
            decodeHTMLEntity: function (text, idx, semiIdx) {
                var e = itrue.decodeDiv;
                e.innerHTML = text.substring(idx, semiIdx);
                return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
            },
            //
            // text: some encoded string
            // ignorePattern: an array, the patterns that should not be decoded
            //
            // return: decoded unsafe string
            //
            decodeTextToUnsafe: function (text, ignorePattern) {
                if (!text) return '';

                var unsafe = '', // decode result
                    commIdx = 0, // start index of common text that haven't added to unsafe
                    idx = 0, // current index in text
                    len = text.length, // length of text
                    ch, // char of current index in text
                    semiIdx, // index of next ';'
                    dec, // decoded text
                    part; // substring &...;
                for ( ; idx < len; idx++) {
                    ch = text.charAt(idx);
                    if (ch == '&'
                        && (semiIdx = text.indexOf(';', idx + 1)) >= 0) {
                        part = text.substring(idx, semiIdx+1);

                        dec = (ignorePattern && ignorePattern.indexOf(part) >= 0)?
                            null // do nothing if in ignore pattern
                            : text.charAt(idx + 1) == '#' ? // is Latin?
                                this.decodeLatin(text, idx, semiIdx) // decode Latin
                                : this.decodeHTMLEntity(text, idx, semiIdx); // decode HTML Entity
                        if (dec) {
                            unsafe += text.substring(commIdx, idx) + dec;
                            commIdx = (idx = semiIdx) + 1;
                        }
                    }
                }
                // !commIdx means nothing decoded
                //
                // commIdx < len means something after len didn't decoded
                // so need to add them into unsafe
                return !commIdx ? text:
                    commIdx < len ? unsafe + text.substring(commIdx): unsafe;
            },
            // build encoding list from given chars
            // assum range: unicode 00A0 ~ 9999
            buildEncodeChars: function (opts) {
                var chars = opts.toReplace,
                    encodeChars = {},
                    cencodeChars = opts.encodeChars, // custom encoding
                    idx = 0, // current index of chars
                    len = chars.length, // length of chars
                    ch;
                for ( ; idx < len; idx++) {
                    ch = chars.charAt(idx);
                    if (!encodeChars[ch]) {
                        if (cencodeChars && cencodeChars[ch])
                            encodeChars[ch] = cencodeChars[ch];
                        else
                            encodeChars[ch] = '&#'+ch.charCodeAt(0)+';';
                    }
                }

                if (opts && opts.storeAsDefault)
                    window.defaultEncodeChars = encodeChars;
                return encodeChars;
            },
            //
            // unsafe: unsafe string that may contains unsafe chars
            // opts: toReplace, unsafe chars to encode, will try to get from default if missing
            //        storeAsDefault, whether store the built encodeChars as default
            //        multiline, whether encode '\n' to '<br/>\n'
            //        encodeSpace, whether encode ' ' to '&nbsp;' or '\t' to '&nbsp;&nbsp;&nbsp;&nbsp;'
            //
            // return: encoded safe string
            //
            encodeUnsafeToText: function (unsafe, opts) {
                if (!unsafe) return '';
                var arr = [], // tmp array
                    idx = 0, // current index of unsafe
                    len = unsafe.length, // length of unsafe
                    safeIdx = 0, // start index of safe string that haven't added
                    ch, // char to process
                    skipLen, // length to skip
                    encodeChars; // list to encoding
                if (!opts || !opts.toReplace) {
                    if (!opts) opts = {};
                    opts.toReplace = '<>;"'; // replace <, >, ;, " by default
                    opts.storeAsDefault = true;
                    if (!opts.encodeChars)
                        encodeChars = window.defaultEncodeChars;
                    if (!encodeChars)
                        encodeChars = this.buildEncodeChars(opts);
                } else
                    encodeChars = this.buildEncodeChars(opts);
                for ( ; idx < len; idx++) {
                    ch = unsafe.charAt(idx);
                    if (ch == '\n' && opts && opts.multiline) {
                        arr.push(unsafe.substring(safeIdx, idx) + '<br/>\n');
                        safeIdx = idx+1;
                    } else if ((ch == ' ' || ch == '\t')
                        && opts.encodeSpace) {
                        arr.push(unsafe.substring(safeIdx, idx) + '&nbsp;');
                        if (ch == '\t')
                            arr.push('&nbsp;&nbsp;&nbsp;');
                        safeIdx = idx+1;
                    }else if (encodeChars[ch]) {
                        arr.push(unsafe.substring(safeIdx, idx) + encodeChars[ch]);
                        safeIdx = idx+1;
                    }
                }
                if (!safeIdx) return unsafe;
                if (safeIdx < idx)
                    arr.push(unsafe.substring(safeIdx));
                return arr.join('');
            },
            // pending ajax request settings
            ajaxPending: function (settings) {
                this.ajaxActionQueue.push(settings);
            },
            // run pending ajax
            ajaxNext: function () {
                if (this.ajaxActionQueue.length > 0)
                    this.ajaxSend(this.ajaxActionQueue.pop());
            },
            // send ajax request, or get cached result
            // settings: ajaxUrl, string, url to send ajax request
            //          ajaxData, string, query string to append after url?
            //          cacheResult, boolean, whether cache response data
            //          preventBrowserCache, boolean whether append specific data to
            //                  prevent browser cache
            //          updateUrl, boolean, whether use pushState to update url and
            //                  store state object
            //          stateObj, object, state object that will be stored with pushState
            //          callback, function, callback function that will be called in
            //                  success function of $.ajax
            //          handler, object, handler to handle callback function
            ajaxSend: function (settings) {
                // pending ajax if already running another
                if (window.itrue.ajaxProcessing) {
                    this.ajaxPending(settings);
                }
                window.itrue.ajaxProcessing = true;
                var ajaxUrl = settings.ajaxUrl,
                    ajaxData = settings.ajaxData,
                    fullUrl, // ajaxUrl?ajaxData
                    cachedData, // cached previous response
                    callback, // callback function
                    processResult; // function to process response data (or cached data)

                fullUrl = ajaxUrl + (ajaxData? '?'+ajaxData : '');
                // append dynamic content to query data so
                // browser will do fresh request each time when
                // ajax query or pop history state
                //
                // will not affect cached data with respect to fullUrl
                if (settings.preventBrowserCache) {
                    var append = 'preventBrowserCacheParem=' + new Date().getTime();
                    if (!ajaxData)
                        ajaxData = append;
                    else
                        ajaxData += '&' + append;
                }
                // function to process result data
                processResult = function (result) {
                        if (settings.updateUrl) // update window.location.href
                            window.itrue.pushState(fullUrl, null, settings.stateObj);
                        if (callback = settings.callback) {
                            var args = [result], // argument array
                                handler = settings.handler || callback; // handler, use callback itself as handler if needed
                            if (settings.extraData) // append extra argument if any
                                args = args.concat(settings.extraData);
                            // run callback by handler
                            callback.apply(handler, args);
                        }
                        // run pending ajax if any
                        window.itrue.ajaxProcessing = false;
                        window.itrue.ajaxNext();
                        // run funcs on ajax response
                        itrue.onResponse();
                    };
                // process cached data if needed
                if (settings.cacheResult && (cachedData = itrue.ajaxGetCachedResult(fullUrl)))
                    processResult(cachedData);
                // get fresh data and process it via ajax
                else
                    $.ajax({
                        url: ajaxUrl,
                        data: ajaxData,
                        type: settings.method || 'GET',
                        dataType: settings.dataType || 'json',
                        success: function (result) {
                            // cache data if needed
                            if (settings.cacheResult) {
                                itrue.ajaxCacheResult(fullUrl, result);
                            }
                            processResult(result);
                        }
                    });
            },
            // cache data
            ajaxCacheResult: function (key, value) {
                this.ajaxResultCache[key] = value;
            },
            // try to get cached data
            ajaxGetCachedResult: function (key) {
                return this.ajaxResultCache[key];
            },
            // get all property keys of an object
            getObjectKeys: function (keys, obj) {
                var name;
                for (name in obj) {
                    if (obj.hasOwnProperty(name))
                        keys.push(name);
                }
            },
            // push history state
            // href, string, will be updated to browser url field
            // title, string, document title
            // stateObj: type, string
            pushState: function (href, title, stateObj) {
                if (window.history && window.history.pushState)
                    window.history.pushState(stateObj, title, href);
            },
            // replace history state entry
            replaceState: function (href, title, stateObj) {
           	    if (window.history && window.history.replaceState)
					window.history.replaceState(stateObj, title, href);
            },
            // get path of current url
            // e.g.
            // assume url is http://localhost:3000/urcosme/category?abc=123
            // the path will be /urcosme/category/
            getCurrentPath: function () {
                var location = window.location,
                    str = location.href,
                    host = location.host,
                    searchStr = location.search || '',
                    hash = location.hash || '';
                str = str.substring(str.indexOf(host)).
                    replace(host, '').replace(searchStr, '').replace(hash, '')
                    .substring(1);
                return '/'+str+'/';
            },
            // set cookie
            setCookie: function (cookieName, cookieValue, expTime, cookiePath) {
                document.cookie = cookieName + '=' + cookieValue
                        + '; expires=' + expTime.toGMTString()
                        + '; path=' + cookiePath;
            },
            // read cookie
            getCookie: function (cName) {
                var cookies = document.cookie;
                if (cookies && cookies.length > 0) {
                    var start = cookies.indexOf(cName+'='),
                        end;
                    if (start > -1) {
                        start = start + cName.length + 1;
                        end = cookies.indexOf(';', start);
                        if (end == -1)
                            end = cookies.length;
                        return cookies.substring(start, end);
                    }
                }
                return '';
            },
            // delete cookie
            removeCookie: function (cName) {
                var expTime = new Date();
                expTime.setTime(expTime.getTime() + (-10*24*60*60*1000));
                setCookie(cName, '', expTime, '/');
            },
            // define a javascript class
            // clazz: string, class name
            // proto: object (i.e., {...}), class prototype
            defineClass: function (clazz, proto) {
                var obj = function () {}; // give it a constructor
                if (proto) // apply prototype
                    obj.prototype = proto;
                // store it if not exists
                if (!this.jsClasses[clazz])
                    this.jsClasses[clazz] = obj;
            },
            // extend a parent javascript class and
            // create another new child javascript class based
            // on parent one
            // baseClazz: string, name of parent class
            // clazz: string, name of child class
            // props: object, properties to override in child prototype
            extend: function (baseClazz, clazz, props) {
                var parent = this.jsClasses[baseClazz], // get parent class
                    cproto = new parent(), // get prototype from parent
                    key;
                cproto.parent = parent; // store parent in child prototype
                for ( key in props ) {
                    // override properties into child prototype
                    cproto[key] = props[key];
                }
                // define child class
                this.defineClass(clazz, cproto);
            },
            // create an instance of a specific class
            // clazz: string, class name to create
            // props: object, properties to override in created instance
            newInst: function (clazz, props) {
                var clz = this.jsClasses[clazz], // get class
                    inst = new clz(), // create instance
                    key, // prop key
                    events = []; // event to register
                for ( key in props ) {
                    inst[key] = props[key]; // override property
                    if (key.indexOf('on') == 0) // event (onXXX), push it to events
                        events.push(key);
                }
                // store class in instance
                inst['$class'] = clz;
                inst['$super'] = function (fn, args) { // function used to call method in super class
                    var currentProto = inst.$superClass || inst['$class'].prototype,
                        newProto = currentProto;
                    while (newProto && currentProto[fn] == newProto[fn]) {
                        if (newProto = newProto.parent)
                            newProto = newProto.prototype;
                    }
                    if (newProto) {
                        inst.$superClass = newProto;
                        newProto[fn].apply(inst, args);
                    }
                    inst.$superClass = null;
                };
                // call instance level init if exists
                if (inst['$init'])
                    inst['$init']();
                // push event defined in clz prototype
                for ( key in inst ) {
                    if (key.indexOf('on') == 0) // event
                        events.push(key);
                }
                // register events
                if (events.length)
                    this.registerInstEvent(inst, events);
                return inst;
            },
            deleteInst: function (inst) {
                var key,
                    events = []; // event to remove
                // push event defined in inst
                for ( key in inst ) {
                    if (key.indexOf('on') == 0) // event
                        events.push(key);
                }
                this.unregisterInstEvent(inst, events);
            },
            // register events for instance
            //  inst: object, instance of a class
            //  events: array, all events that should be registered
            registerInstEvent: function (inst, events) {
                var idx = 0,
                    len = events.length,
                    e, insts;
                for ( ; idx < len; idx++) {
                    e = events[idx];
                    insts = this.instEvtReg[e];
                    if (!insts)
                        insts = this.instEvtReg[e] = [];
                    insts.push(inst);
                }
            },
            unregisterInstEvent: function (inst, events) {
                var idx = 0,
                    len = events.length,
                    reg = this.instEvtReg,
                    e, insts;
                for ( ; idx < len; idx++) {
                    e = events[idx];
                    insts = reg[e];
                    if (insts)
                        insts.splice(insts.indexOf(inst), 1);
                    if (!insts.length)
                        delete reg[e];
                }
            },
            // trigger event for all registered object instances
            //  evtnm: string, event name to trigger
            //  args: array, params to pass into triggerred function
            triggerInstsEvent: function (evtnm, args) {
                var insts = this.instEvtReg[evtnm],
                    idx = 0,
                    len, inst;
                if (insts) {
                    len = insts.length;
                    for ( ; idx < len; idx++) {
                        inst = insts[idx];
                        this.triggerInstEvent(inst, evtnm, args);
                    }
                }
            },
            // trigger event for specific object
            //  inst: object, instance to trigger event
            //  evtnm: string, event name to trigger
            //  args: array, params to pass into triggered function
            triggerInstEvent: function (inst, evtnm, args) {
                inst[evtnm](args);
            },
            // in case that function name is keyword in JavaScript
            addMethod: function (name, func) {
                this[name] = func;
            },
            // void function, used to override existing function easily
            $void: function (data) {/* do nothing */} // empty function for override
        }
        // add itrue.log, display message in
        // log area on screen
        itrue.addMethod ('log', function (cnt) {
            if (itrue.ready) {
                var logDiv = $('.itrue-log-div')[0];
                if (!logDiv) {
                    logDiv = document.createElement('div');
                    $(logDiv).addClass('itrue-log-div');
                    logDiv.innerHTML = '<button onclick="$(\'.itrue-log-div\').remove()">X</button>'
                            + '<br/><textarea class="itrue-log-cnt" rows="10"></textarea>';
                    document.body.appendChild(logDiv);
                }
                $(logDiv).find('.itrue-log-cnt')[0].value += cnt+'\n';
            } else {
                if (!itrue.tmpLogMsg)
                    itrue.tmpLogMsg = '';
                itrue.tmpLogMsg += cnt + '\n';
            }
        });
    }
    // call init on document ready
    $(document).on('ready', function () {
        itrue.init();
    });
    // onpopstate (back/forward button of browser)
    window.onpopstate = function(event) {
        itrue.triggerInstsEvent('onPopState');
    };
    $(window).on('resize', function () {
        itrue.triggerInstsEvent('onResize');
    }).on('scroll', function () {
        itrue.triggerInstsEvent('onScroll');
    });
})();

