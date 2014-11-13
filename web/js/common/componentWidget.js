
// (function () { ... })();
(function () {
    "use strict";

    // basic dom widget class
    itrue.defineClass('componentWidget', { // prototype
        // generate dom and
        // attach dom to page
        // initialize event listener
        render: function () {
            this.createDom();
            // register dom event if needed
            if (this.dom && window.itrue.domutil)
                itrue.domutil.registerInstDomEvent(this);
        },
        createDom: function () {
        
        }
    });
})();

