
// (function () { ... })();
(function () {
    "use strict";

    // basic dom widget class
    itrue.defineClass('componentWidget', { // prototype
        dom: null, // self dom element
        parentWgt: null, // parent widget instance
        // generate dom and
        // attach dom to page
        // initialize event listener
        render: function () {
            this.dom = this.createDom();
            this.attachDom();
            // register dom event if needed
            if (this.dom && window.itrue.domutil)
                itrue.domutil.registerInstDomEvent(this);
        },
        // create dom element of this component
        //  note: there is only one dom element for a component
        //      so can only have one root
        createDom: function () {
            return document.createElement('div');
        },
        // attach dom to page
        // call parent.attachChild if has parent
        // attach to document.body otherwise
        attachDom: function () {
            var parent = this.parentWgt;
            if (parent)
                parent.attachChild(this);
            document.body.appendChild(this.dom);
            this.afterDomAttached();
        },
        afterDomAttached: function () {
        
        },
        // attach child dom to self dom
        //  child: widget instance of child
        attachChild: function (child) {
            this.dom.appendChild(child.dom);
        },
        destroy: function () {
            itrue.deleteInst(this);
            $(this.dom).remove();
        }
    });
})();

