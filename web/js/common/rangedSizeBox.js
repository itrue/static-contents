// customize bootstrap as needed
(function () {
    "use strict";
    itrue.extend('componentWidget', 'rangedSizeBox', {
        maxWidth: null, // maximum width
        maxHeight: null, // maximum height
        minWidth: null, // minimum width
        minHeight: null, // minimum height
        dom: null, // dom element
        // constructor init
        createDom: function () {
            // create dom on init
            var dom = document.createElement('div');
            $(dom).addClass('ranged-size-box');
            this.dom = dom;
        },
        // wrapping target dom
        //  target: dom element
        wrapping: function (target) {
            // self dom
            var dom = this.dom;
            // if self dom and target dom are exist
            if (dom && target) {
                // parent node of target dom
                var parent = target.parentNode;
                if (parent) {
                    // insert self dom before target dom
                    parent.insertBefore(dom, target);
                    // append target dom as child to self dom
                    dom.appendChild(target);
                }
            }
        },
        // set max width, max height, min width and min height
        //  opts: size options
        //  e.g. {maxWidth: 300, minHeight 50}
        setSizeRange: function (opts) {
            this.maxWidth = opts.maxWidth;
            this.maxHeight = opts.maxHeight;
            this.minWidth = opts.minWidth;
            this.minHeight = opts.minHeight;
            this.onResize();
        },
        // event handler
        onResize: function () {
            var wgt = this,
                $dom = $(wgt.dom),
                resize;
            // reset
            $dom.css('height', '');
            $dom.css('width', '');
            $dom.css('overflow', '');
            resize = function () {
                var h = $dom.height(), // current auto height
                    w = $dom.width(), // current auto width
                    mah = wgt.maxHeight, // size settings
                    maw = wgt.maxWidth,
                    mih = wgt.minHeight,
                    miw = wgt.minWidth,
                    newh, // evaluated height
                    neww; // evaluated width
                // evaluate
                // set new height if
                // has maxHeight and current auto height is
                // larger than maxHeight
                if (mah && h > mah)
                    newh = mah;
                if (mih && h < mih)
                    newh = mih;
                if (maw && w > maw)
                    neww = maw;
                if (miw && w < miw)
                    neww = miw;
                // update height/width and overflow if needed
                if (newh)
                    $dom.css('height', newh + 'px');
                if (neww)
                    $dom.css('width', neww + 'px');
                if (newh || neww)
                    $dom.css('overflow', 'auto');
            };
            itrue.replaceTimeout(this, resize, 100, 'resizeTimer');
        }
    });
})();
