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
                key, // map key (event name listened by widget)
                evtnm; // event name
            // no dom element, stop
            if (!dom) return;
            
            // jquery object
            var $dom = $(dom);
            // for each key
            for ( key in evts ) {
                // if widget listen to it (has handler)
                if (wgt[key]) {
                    var objEvt = key;
                    // get event name by key
                    evtnm = evts[key];
                    // trigger widget handler by event
                    $dom.on(evtnm, function (e) {
                        var event = e || window.event;
                        itrue.triggerInstEvent(wgt, objEvt, e);
                    });
                }
            }
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
        }
    }
})();
