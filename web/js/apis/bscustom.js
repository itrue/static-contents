// customize bootstrap as needed
(function () {
    "use strict";
    if (window.itrue.bscustom) return;
    itrue.defineClass('bscustom', {
        onInit: function () {

        },
        makeHoverDropdownMenu: function () {
            // make bootstrap drop down menu work with
            // mouseover and mouseout
            $('.dropdown-toggle').each(function () {
                var wgt = this,
                    $wgt = $(wgt),
                    func = function () { // close function
                        if ($wgt.parent('.open')[0])
                            $wgt.trigger('click');
                    };
                $wgt.on('mouseover', function () {
                    // cancel close and open when mouseover
                    itrue.clearTimeout(wgt, 'closeTimeout');
                    if (!$wgt.parent('.open')[0]) {
                        $wgt.trigger('click');
                    }
                }).on('mouseout', function () {
                    // close when mouseout
                    itrue.replaceTimeout(wgt, func, 300, 'closeTimeout');
                });
                $wgt.next('.dropdown-menu')
                    .on('mouseout', function (e) {
                    // close when mouseout child menu
                    itrue.replaceTimeout(wgt, func, 300, 'closeTimeout');
                }).on('mouseover', function (e) {
                    // cancel close when mouseover child menu
                    itrue.clearTimeout(wgt, 'closeTimeout');
                });
            });
        }
    });
})();
