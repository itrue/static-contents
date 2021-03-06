// utils for common dom tasks

(function () {
    if (window.itrue.domutil) return;
    var domutil = window.itrue.domutil = {
        // mapping dom events with object events
        // used to trigger event handler on object by
        // dom event
        domEvts: {onClick: 'click',
            onContextmenu: 'contextmenu',
            onDblclick: 'dblclick',
            onMousedown: 'mousedown',
            onMousemove: 'mousemove',
            onMouseover: 'mouseover',
            onMouseout: 'mouseout',
            onMouseup: 'mouseup',
            onKeydown: 'keydown',
            onKeypress: 'keypress',
            onKeyup: 'keyup',
            onBlur: 'blur',
            onChange: 'change',
            onFocus: 'focus',
            onSelect: 'select',
            onSubmit: 'submit'
        },
        // register event for trigger object event handler
        // by dom event
        registerInstDomEvent: function (wgt) {
            var dom = wgt.dom, // get dom element
                evts = this.domEvts, // events map
                key; // map key (event name listened by widget)
            // no dom element, stop
            if (!dom) return;
            
            // jquery object
            var $dom = $(dom);
            // for each key
            for ( key in evts ) {
                // if widget listen to it (has handler)
                if (wgt[key])
                    this.bindEvent($dom, wgt, evts[key], key);
            }
        },
        bindEvent: function ($dom, wgt, evtnm, objEvt) {
            $dom.on(evtnm, function (e) {
                var event = e || window.event;
                itrue.triggerInstEvent(wgt, objEvt, e);
            });
        },
        // create dom elements from given html string
        //  html: string, html to create dom
        //
        //  return: returns an array if has more than one root
        //      returns dom element otherwise
        createDomFromHtml: function (html) {
            var div = document.createElement('div'),
                child;
            div.innerHTML = html;
            child = div.childNodes;
            if (child.length > 1)
                return child;
            return child[0];
        },
        // create a fieldset to display
        // and hide the given dom
        //  dom: dom element to hide
        //  cls: string, extra css class
        collapseWithFieldset: function (dom, cls, opts) {
            cls = cls? cls : '';
            var parent = dom.parentNode,
                fieldset = $('.'+cls)[0],
                msg = (opts && opts.msg? opts.msg : 'Click to Search...'),
                delay = (opts && opts.delay? opts.delay : 200);
            cls += ' collapse-fieldset';
            if (!fieldset) {
                fieldset = document.createElement('fieldset');
                fieldset.innerHTML = '<legend style="background-color: #ccc; cursor: pointer;">'+msg+'</legend>';
                $(fieldset).addClass(cls)
                    .css({'display': 'none'
                });
                $(fieldset).on('click', function () {
                    $(fieldset).slideUp(delay, function () {
                        $(dom).slideDown(delay);
                    });
                });
                parent.insertBefore(fieldset, dom);
            }
            if (!dom.iscollapseWithFieldset) {
                dom.iscollapseWithFieldset = true;
                $(dom).slideUp(delay, function () {
                    $(fieldset).slideDown(delay, function () {
                        delete dom.iscollapseWithFieldset;
                    });
                });
            }
        },
        loadScript: function (src, callback, props) {
            var script = document.createElement('script'),
                head = $('head')[0],
                key,
                applyCallback = function () {
                    if (callback)
                        callback();
                    script.onload = script.onreadystatechange = null;
                };
            script.src = src;
            if (props) {
                for (key in props)
                    script[key] = props[key];
            }
            if (callback) {
                script.onload = applyCallback;
                script.onreadystatechange = function() {
                    if (this.readyState == 'complete') {
                        applyCallback();
                    }
                }
            }
            head.appendChild(script);
        },
        openScreenConsole: function () {
            if (!$('.screen-console')[0]) {
                var console = itrue.newInst('screenConsole');
                console.render();
            }
        },
        getSelectionRange: function (inp) {
            try {
                if (document.selection != null && inp.selectionStart == null) { //IE
                    var range = document.selection.createRange();
                    var rangetwo = inp.createTextRange();
                    var stored_range = "";
                    if(inp.type.toLowerCase() == "text"){
                        stored_range = rangetwo.duplicate();
                    }else{
                         stored_range = range.duplicate();
                         stored_range.moveToElementText(inp);
                    }
                    stored_range.setEndPoint('EndToEnd', range);
                    var start = stored_range.text.length - range.text.length;
                    return [start, start + range.text.length];
                } else { //Gecko
                    return [inp.selectionStart, inp.selectionEnd];
                }
            } catch (e) {
                return [0, 0];
            }
        },
        // strip all tags including script from html string
        stripHTMLTags: function (html) {
            if (!html) return '';
            var $html = $(html),
                textNodes;
            // remove all script element
            $html.find('script').each(function () {
                $(this).remove();
            });
            return $html.text() || itrue.encodeUnsafeToText(html);
        },
        setSelectionRange: function (inp, start, end) {
	        var len = inp.value.length;
	        if (start == null || start < 0) start = 0;
	        if (start > len) start = len;
	        if (end == null || end > len) end = len;
	        if (end < 0) end = 0;

	        if (inp.setSelectionRange) {
		        inp.setSelectionRange(start, end);
	        } else if (inp.createTextRange) {
		        var range = inp.createTextRange();
		        if(start != end){
			        range.moveEnd('character', end - range.text.length);
			        range.moveStart('character', start);
		        }else{
			        range.move('character', start);
		        }
		        range.select();
	        }
        },
        dockToBottomLeft: function (target, dom) {
	        var $target = $(target);
	        $(document.body).append(dom);
	        $(dom).css({
		        'position': 'absolute',
		        'left': $target.offset().left+'px',
		        'top': $target.offset().top +$target.height()+'px'
	        });
        },
        // 自動將內容置中
        // opts {
        //     container: {
        //           selector: '.auto-center-container', // 容器 selector, 預設值如左
        //           events: {'resize': true} // 要處理的 event, 無預設值
        //       }
        //       content:  {
        //            selector: '.auto-center-content' // 內容 selector, 預設值如左
        //            events: {'load': true} // 要處理的 event, 無預設值
        //       }
        // }
        autoCenterContentH: function (opts) {
            opts = opts || {};
            opts.container = opts.container || {};
            opts.content = opts.content || {};
            var $containers = $(opts.container.selector || '.auto-center-container'),
                centerContent = function ($container, $cnt) {
                    var cntw = $cnt.width(),
		                diff = $container.width() - cntw;
		            if (cntw && diff) {
		                $cnt.css({
		                    'position': 'relative',
		                    'left': diff/2 + 'px'
		                });
		            }
                };
            $containers.each(function () {
                var $self = $(this),
                    $content = $self.find(opts.content.selector || 'img').eq(0),
                    key;
                // center content
                centerContent($self, $content);
                for (key in (opts.container.events || {}))
                    $self.on(key, function () {
                        centerContent($self, $content);
                    });
                for (key in (opts.content.events || {}))
                    $content.eq(0).on(key, function () {
                        centerContent($self, $content);
                    });
            });
        },
        initPlaceholder: function (inp, placeholder) {
	        var $inp = $(inp);
	        if ($inp.hasClass('placeholder-inited')) return;
	        $inp.addClass('placeholder-inited');
	        if ($inp[0]) {
		        if (!$inp.val())
			        $inp.val(placeholder);
		        var fixCursorPos = function () {
				        if ($inp.val() == placeholder)
					        setTimeout(function () {
						        setSelectionRange($inp[0], 0, 0);
					        }, 0);
			        },
			        fixInputValue = function (clear) {
				        if (clear
					        || ($inp.val()
						        && $inp.val().indexOf(placeholder) > 0
						        && $inp.val() != placeholder)) {
					        $inp.val($inp.val().replace(placeholder, ''));
				        }
				        if ($inp.val() != placeholder)
					        $inp.trigger('placehoder-cleared');
			        };
		        $inp.on('blur', function () {
			        if (!$inp.val())
				        $inp.val(placeholder);
		        }).on('focus', function () {
			        fixCursorPos();
		        }).on('click', function () {
			        fixCursorPos();
		        }).on('keydown', function (e) {
			        var keyCode = e.keyCode;
			        if ((keyCode == 8 || keyCode == 46)
				        && $inp.val() == placeholder)
				        fixInputValue(true);
				
			        setTimeout(function () {
				        fixCursorPos();
				        fixInputValue();
			        }, 0);
		        }).on('keypress', function () {
			        setTimeout(function () {
				        fixCursorPos();
				        fixInputValue();
			        }, 0);
		        }).on('keyup', function () {
			        fixCursorPos();
			        fixInputValue();
		        });
	        }
        }
    };
    // console widget
    itrue.defineClass('screenConsole', { // prototype
        dom: null, // self dom element
        commands: [],
        lastCommand: null,
        editor: null,
        idx: null,
        resources: {
            baseCSS: 'https://cdn.rawgit.com/itrue/static-contents/916d09e352d3954768a2f8d3994d8cb1ae7b1d01/web/resources/libs/third-party/CodeMirror/codemirror/lib/codemirror.css',
            baseJS: 'https://cdn.rawgit.com/itrue/static-contents/916d09e352d3954768a2f8d3994d8cb1ae7b1d01/web/resources/libs/third-party/CodeMirror/codemirror/lib/codemirror.js',
            mode: {
                javascript: 'https://cdn.rawgit.com/itrue/static-contents/916d09e352d3954768a2f8d3994d8cb1ae7b1d01/web/resources/libs/third-party/CodeMirror/codemirror/mode/javascript/javascript.js'
            }
        },
        // generate dom and
        // attach dom to page
        // initialize event listener
        render: function () {
            this.dom = itrue.domutil
                .createDomFromHtml('<div class="screen-console">'
                +                   '<div class="container">'
                +                      '<div class="close-btn btn btn-danger">X</div>'
                +                       '<span class="output"></span>'
                +                       '<div class="input-container"><textarea class="input"></textarea></div>'
                +                   '</div>'
                +                   '</div>');
            document.body.appendChild(this.dom);
            // register dom event if needed
            itrue.domutil.registerInstDomEvent(this);
            $(this.dom).height($(window).height() / 2);
            this.applyCodeMirror();
        },
        applyCodeMirror: function () {
            var dom = this.dom,
                wgt = this,
                res = this.resources,
                callback = function () {
                    wgt.editor = CodeMirror.fromTextArea($(dom).find('textarea')[0], {
                        lineNumbers: true,
                        mode: 'javascript'
                    })
                },
                loadMode = function () {
                    itrue.domutil.loadScript(res.mode.javascript, callback);
                };
            // load css if not loaded
            if (!$('head').find('link[href*="codemirror"]')[0])
                $('head').append('<link rel="stylesheet" href="'+res.baseCSS+'" type="text/css" />');
            // load js if not loaded
            if (!$('head').find('script[src*="codemirror"]')[0])
                itrue.domutil.loadScript(res.baseJS, loadMode);
            else { // run callback directly otherwise
                callback();
            }
        },
        onKeydown: function (e) {
            var key = e.keyCode,
                inp = $(this.dom).find('.input')[0],
                editor = this.editor;
            if (!e.shiftKey) {
                if (key == 38) { // Up Arrow
                    var firstLine = (editor.getCursor().line == editor.firstLine());
                    if (firstLine)
                        $(inp).addClass('at-first-line');
                } else if (key == 40) { // Down Arrow
                    var lastLine = (editor.getCursor().line == editor.lastLine());
                    if (lastLine)
                        $(inp).addClass('at-last-line');
                }
            }
        },
        onKeyup: function (e) {
            var key = e.keyCode,
                exec = true,
                dom = this.dom,
                inp = $(dom).find('.input')[0],
                out = $(dom).find('.output')[0],
                editor = this.editor;
            if (!e.shiftKey) {
                if (key == 13) { // Enter
                    var val = editor.getValue();
                    if (val) {
                        var result = eval.apply(window, [val]);
                        this.commands.push(val);
                        this.idx = this.commands.length;
                        editor.setValue('');
                        out.innerHTML += $('<div/>').text(result).html()+'<br/>';
                        out.scrollTop = out.scrollHeight;
                        this.lastCommand = '';
                    }
                } else if (key == 38) { // Up Arrow
                    var firstLine = (editor.getCursor().line == editor.firstLine());
                    if (firstLine && $(inp).hasClass('at-first-line')) {
                        this.idx = (this.idx || this.idx == 0)? (this.idx-1) : (this.commands.length-1);
                        if (this.idx < 0)
                            this.idx = 0;
                        if (this.commands[this.idx])
                            this.editor.setValue(this.commands[this.idx]);
                    }
                    $(inp).removeClass('at-first-line');
                } else if (key == 40) { // Down Arrow
                    var lastLine = (editor.getCursor().line == editor.lastLine());
                    if (lastLine && $(inp).hasClass('at-last-line')) {
                        this.idx = (this.idx || this.idx == 0)? (this.idx+1) : null;
                        if (this.idx > this.commands.length)
                            this.idx = this.commands.length;
                        if (this.idx < 0)
                            this.idx = 0;
                        if (this.commands[this.idx] || this.lastCommand)
                            editor.setValue(this.commands[this.idx] || this.lastCommand);
                        else
                            editor.setValue('');
                    }
                    $(inp).removeClass('at-last-line');
                } else
                    exec = false;
            }
            if (!exec)
                this.lastCommand = editor.getValue();
        },
        onClick: function (e) {
            if ($(this.dom).find('.close-btn')[0] == e.target)
                this.destroy();
        },
        onResize: function () {
            $(this.dom).height($(window).height() / 2);
        },
        destroy: function () {
            itrue.deleteInst(this);
            $(this.dom).remove();
        }
    });
})();
