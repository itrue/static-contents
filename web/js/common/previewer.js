
// (function () { ... })();
(function () {
    "use strict";
    // preview/show popup window
    itrue.extend('componentWidget', 'previewer', { // prototype
        dom: null,
        original: null,
        modified: null,
        messages: null,
        callback: null,
        callbackParams: null,
        // override
        createDom: function () {
            return itrue.domutil
                .createDomFromHtml('<div class="itrue-previewer">'
                    +                   '<div class="message"></div>'
                    +                   '<span class="control control-ori btn btn-info">Original</span>'
                    +                   '<span class="control control-new btn btn-info">New</span>'
                    +                   '<div class="content content-old"></div>'
                    +                   '<div class="content content-new"></div>'
                    +                   '<div class="close-btn btn btn-danger">X</div>'
                    +                   '<span class="control apply-btn btn btn-success">Apply</span>'
                    +               '</div>');
        },
        setPreview: function (cnts) {
            if (!cnts) return;
            this.original = cnts.original;
            this.modified = cnts.modified;
            this.messages = cnts.messages;
            this.callback = cnts.callback;
            this.callbackParams = cnts.callbackParams;
        },
        afterDomAttached: function () {
            var dom = this.dom;
            $(dom).find('.content-old')[0].innerHTML = this.original || '';
            $(dom).find('.content-new')[0].innerHTML = this.modified || '';
            $(dom).find('.message')[0].innerHTML = this.messages || '';
        },
        showOld: function () {
            $('.content-old').css('display', 'block');
            $('.content-new').css('display', 'none');
        },
        showNew: function () {
            $('.content-old').css('display', 'none');
            $('.content-new').css('display', 'block');
        },
        applyCallback: function () {
            this.callback(this.callbackParams);
            this.destroy();
        },
        // event handlers
        onClick: function (e) {
            var n = this.dom,
                target = e.target;
            if (target == $(this.dom).find('.close-btn')[0]) // close
                this.destroy();
            if (target == $(this.dom).find('.control-ori')[0]) // show ori
                this.showOld();
            if (target == $(this.dom).find('.control-new')[0]) // show new
                this.showNew();
            if (target == $(this.dom).find('.apply-btn')[0]) // show ori
                this.applyCallback();
        }
    });
})();

