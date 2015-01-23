
// (function () { ... })();
(function () {
    "use strict";

    // basic dom widget class
    itrue.defineClass('componentWidget', { // prototype
        dom: null, // self dom element
        parentWgt: null, // parent widget instance
        jqfns: null,
        getJqFns: function () {
            if (!this.jqfns)
                this.jqfns = [];
            return this.jqfns;
        },
        // generate dom and
        // attach dom to page
        // initialize event listener
        render: function () {
            this.dom = this.createDom();
            this.attachDom();
            this.initJqFns();
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
        addDomToDocument: function () {
            var parent = this.parentWgt;
            if (parent)
                parent.attachChild(this);
            document.body.appendChild(this.dom);
        },
        // attach dom to page
        // call parent.attachChild if has parent
        // attach to document.body otherwise
        attachDom: function () {
            this.addDomToDocument();
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
        },
        on: function (evtnm, func) {
		    this.getJqFns().push({nm: evtnm, fn: func});
		    if (this.dom)
			    $(this.dom).on(evtnm, func);
	    },
	    off: function (evtnm, func) {
		    var jqfns = this.getJqFns(),
			    len = jqfns.length,
			    idx = 0,
			    ele;

		    if (this.dom)
			    $(this.dom).off(evtnm, func);
		    for ( ; idx < len; idx++) {
			    ele = jqfns[idx];
			    if (ele.nm == evtnm && ele.fn == func) {
				    jqfns.splice(idx, 1);
			    }
		    }
	    },
	    initJqFns: function () {
		    var jqfns = this.getJqFns(),
			    idx = 0,
			    len = jqfns.length,
			    jqfn,
			    $dom = $(this.dom);
		    for ( ; idx < len; idx++) {
			    jqfn = jqfns[idx];
			    $dom.on(jqfn.nm, jqfn.fn);
		    }
	    }
    });
})();

