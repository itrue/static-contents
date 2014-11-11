
// (function () { ... })();
(function () {
    "use strict";
    // set position of given widget
    function reposition (wgt) {
        var dom = wgt.dom, // dom element
            $target = $(wgt.target), // target
            pos = wgt.position, // widget position setting
            offsetLeft, // left
            offsetTop; // top
        // calculate position
        offsetLeft = (pos == 'left'? $target.offset().left + $(dom).width()/2
                        : pos == 'right'? $target.offset().left + $target.width() - $(dom).width()/2
                            : $target.width()/2 - $(dom).width()/2
        );
        offsetTop = (pos == 'top'? $target.offset().top + $(dom).height()/2
                        : pos == 'bottom'? $target.offset().top + $target.height() - $(dom).height()/2
                            : $target.offset().top + $target.height()/2 - $(dom).height()
        );
        // apply position
        $(dom).css({
                'left': offsetLeft+'px',
                'top': offsetTop+'px'
            });
        dom.style.display = 'block';
    }
    // create widget dom element
    function createDom (wgt) {
        var dom = document.createElement('div');

        wgt.dom = dom;
        document.body.appendChild(dom);
    }
    // set dom element class
    function applyStyle (wgt, dom) {
        var cls = 'expand-collapse-bar expand-collapse-bar-' + wgt.settings[wgt.position]['dir'];
        $(dom).addClass(cls);
    }
    // initial widget dom style and position
    function initialize (wgt) {
         if (wgt.target) {
            applyStyle(wgt, wgt.dom);
            reposition(wgt);
        }
    }
    // expand/collapse controll
    // set target dom and widget position
    // then it will appear and show/hide target dom when
    // clicking on it
    // presume the target default status while setTarget is called
    // can call setTargetProperties manually to update default status of
    // target dom if needed
    itrue.defineClass('expandCollapseControl', { // prototype
        // position settings
        // e.g. widget dom is at left
        //  -> then it should be vertical (dir)
        //  -> and slide right to collapse/slide left to expand
        settings: {left: {dir: 'ver', collapse: 'right', expand: 'left'},
                right: {dir: 'ver', collapse: 'left', expand: 'right'},
                top: {dir: 'hor', collapse: 'down', expand: 'up'},
                bottom: {dir: 'hor', collapse: 'up', expand: 'down'}},
        position: 'bottom', // default at bottom
        dom: null,
        target: null,
        tProps: null,
        // initialize function
        $init: function () {
            createDom(this);
        },
        // reposition
        reposition: function () {
            reposition(this);
        },
        // set properties of target dom
        setTargetProperties: function (props) {
            this.tProps = props;
        },
        // toggle open/close
        toggle: function () {
            if (this.isOpen)
                this.close();
            else
                this.open();
        },
        // open target dom
        open: function () {
            var wgt = this, // instance
                dom = this.dom, // dom element of this instance
                target = this.target, // target dom to handle
                setting = this.settings[this.position], // setting based on specified position
                dir = setting.dir, // vertical or horizontal
                expDir = setting.expand, // expand direction
                props = {}, // props for target dom animate
                dprops = {}; // props for self dom animate
            if (!this.acting) { // ignore if already acting
                this.acting = true;
                this.isOpen = true; // update open status

                // tProps: original target property
                if (dir == 'ver') // update width to expand if is vertical bar
                    props.width = this.tProps.width;
                else // update height to expand if is horizontal bar
                    props.height = this.tProps.height;
                if (expDir == 'left') { // shrink margin left if expand to left
                    props['margin-left'] = '0px'; // also move control bar to left
                    dprops['left'] = '-='+this.tProps.width;
                } else if (expDir == 'up') { // shrink margin top if expand to top
                    props['margin-top'] = '0px'; // also move control bar to top
                    dprops['top'] = '-='+this.tProps.height;
                } else if (expDir == 'right') { // move control bar to right if expand to right
                    dprops['left'] = '+='+this.tProps.width;
                } else { // move control bar to bottom if expand downward
                    dprops['top'] = '+='+this.tProps.height;
                }

                // apply animation with props
                $(target).animate(props, 10, null, function () {
                    target.style.display = wgt.tProps.display;
                    // run custom callback if exists
                    if (wgt.afterAnima && wgt.afterAnima['open'])
                        wgt.afterAnima['open']();
                    delete wgt.acting;
                });
                $(dom).animate(dprops, 10);
            }
        },
        // close target dom
        close: function () {
            var wgt = this,
                dom = this.dom,
                target = this.target,
                setting = this.settings[this.position],
                dir = setting.dir,
                clpDir = setting.collapse,
                props = {},
                dprops = {};
            if (!this.acting) {
                this.acting = true;
                this.isOpen = false;
                if (dir == 'ver')
                    props.width = '-='+this.tProps.width;
                else
                    props.height = '-='+this.tProps.height;
                if (clpDir == 'right') {
                    props['margin-left'] = '+='+this.tProps.width;
                    dprops['left'] = '+='+this.tProps.width;
                } else if (clpDir == 'down') {
                    props['margin-top'] = '+='+this.tProps.height;
                    dprops['top'] = '+='+this.tProps.height;
                } else if (clpDir == 'left') {
                    dprops['left'] = '-='+this.tProps.width;
                } else {
                    dprops['top'] = '-='+this.tProps.height;
                }

                $(target).animate(props, 10, null, function () {
                    target.style.display = 'none';
                    if (wgt.afterAnima && wgt.afterAnima['close'])
                        wgt.afterAnima['close']();
                    delete wgt.acting;
                });
                
                $(dom).animate(dprops, 10);
            }
        },
        // set callback function that will be
        // called after open/close
        setAfterAnima: function (funcs) {
            this.afterAnima = funcs;
        },
        // set open status
        setOpen: function (v) {
            this.isOpen = v;
        },
        // set widget dom position
        setPosition: function (pos) {
            if (pos && this.position != pos) {
                this.position = pos;
                initialize(this);
            }
        },
        // set target dom
        setTarget: function (dom) {
            if (dom && dom != this.target) {
                var $target = $(dom);
                this.target = dom;
                this.setTargetProperties({
                    width: $target.width()+'px',
                    height: $target.height()+'px',
                    display: $target[0].style.display
                });
                initialize(this);
            }
        },
        // event handlers
        onClick: function () {
            this.toggle();
        },
        onResize: function () {
            var wgt = this;
            this.dom.style.display = 'none';
            if (this.resizeTimer)
                clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(function () {
                wgt.reposition();
            }, 600);
        },
        onScroll: function () {
            this.onResize();
        }
    });
})();

