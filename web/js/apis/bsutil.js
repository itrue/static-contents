// util functions for bootstrap

(function () {
    if (window.itrue.bsutil) return;
    var bsutil = window.itrue.bsutil = {
        // render a link button
        // <a href="..." data-method="..." class="cssClass">text</a>
        // 
        renderLinkButton: function (text, href, dataMethod, cssClass) {
            var result = '<a';
            if (href)
                result += ' href="'+href+'"';
            if (dataMethod)
                result += ' data-method="'+dataMethod+'"';
            if (cssClass)
                result += ' class="'+cssClass+'"';
            result += '>';
            if (text)
                result += text;
            result += '</a>';
            return result;
        },
        // render inline checkboxes
        // cnt, string arr, for checkbox value and text
        // defaultCheck, boolean, whether check checkbox by default
        // handle, string, event handling to add
        renderInlineCheckboxes: function (cnt, defaultCheck, handle, opts) {
            var idx = 0,
                len = cnt.length,
                result = '',
                val,
                chk = (defaultCheck? ' checked="true"' : '');
            handle = handle? (' ' + handle) : '';
            for ( ; idx < len; idx++) {
                val = cnt[idx];
                result += '<label class="checkbox-inline"'+handle+'>'
                    + '<input type="checkbox" value="'+val+'"'+chk+'>'+val+'</input>'
                    +'</label>'
                    + (opts && opts.vertical? '<br/>' : '');
            }
            return result;
        },
        // render basic table
        // sizes: int array, contains size of each column
        // contents: 2-D object array, contains contents to display
        //      assumption - the length of sizes equals the number of columns
        // ecls: string array, extra css class for column
        renderBasicTable: function (sizes, contents, ecls) {
            var result = '',
                idx = 0,
                len = sizes.length,
                cidx = 0,
                clen = contents.length,
                sz,
                cnt,
                cls;
            for ( ; cidx < clen; cidx++) {
                cls = (cidx%2? 'row-odd' : 'row-even');
                result += '<div class="row '+cls+'">';
                for ( ; idx < len; idx++) {
                    sz = sizes[idx];
                    cls = (ecls && ecls[idx]? ' '+ecls[idx] : '') + ' ecls-'+idx;
                    cnt = contents[cidx][idx];
                    if (idx == (len-1))
                        cls += ' col-last';
                    result += '<div class="col col-md-'+sz+cls+'">'
                        + cnt
                        + '</div>';
                }
                result += '</div>'
                idx = 0;
            }
            return result;
        }
    }
})();
