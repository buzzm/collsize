/*
The implementation of sprintf (C) Alexandru Mărășteanu, Bucharest, Romania
http://alexei.ro/
3 BSD License

from

https://github.com/alexei/sprintf.js/blob/master/src/sprintf.js

Rest of implementation is

Copyright (C) {2018} {Buzz Moschetti}

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

Disclaimer
----------

This software is not supported by MongoDB, Inc. under any of their commercial support subscriptions or otherwise. Any usage is at your own risk. Bug reports, feature requests and questions can be posted in the Issues section here on github.
*/

(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[dief]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fiosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    }

    function XXsprintf() {
        var key = arguments[0], cache = XXsprintf.cache
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = XXsprintf.parse(key)
        }
        return XXsprintf.format.call(null, cache[key], arguments)
    }

    XXsprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i])
            if (node_type === "string") {
                output[output.length] = parse_tree[i]
            }
            else if (node_type === "array") {
                match = parse_tree[i] // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(XXsprintf("[XXsprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]]
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (get_type(arg) == "function") {
                    arg = arg()
                }

                if (re.not_string.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(XXsprintf("[XXsprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2)
                    break
                    case "c":
                        arg = String.fromCharCode(arg)
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10)
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                    break
                    case "o":
                        arg = arg.toString(8)
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                    break
                    case "u":
                        arg = arg >>> 0
                    break
                    case "x":
                        arg = arg.toString(16)
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase()
                    break
                }
                if (re.number.test(match[8]) && (!is_positive || match[3])) {
                    sign = is_positive ? "+" : "-"
                    arg = arg.toString().replace(re.sign, "")
                }
                else {
                    sign = ""
                }
                pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
                pad_length = match[6] - (sign + arg).length
                pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
                output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
            }
        }
        return output.join("")
    }

    XXsprintf.cache = {}

    XXsprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0]
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%"
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1]
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else {
                                throw new SyntaxError("[XXsprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[XXsprintf] failed to parse named argument key")
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error("[XXsprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match
            }
            else {
                throw new SyntaxError("[XXsprintf] unexpected placeholder")
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return parse_tree
    }

    var vXXsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0)
        _argv.splice(0, 0, fmt)
        return XXsprintf.apply(null, _argv)
    }

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    if (typeof exports !== "undefined") {
        exports.XXsprintf = XXsprintf
        exports.vXXsprintf = vXXsprintf
    }
    else {
        window.XXsprintf = XXsprintf
        window.vXXsprintf = vXXsprintf

        if (typeof define === "function" && define.amd) {
            define(function() {
                return {
                    XXsprintf: XXsprintf,
                    vXXsprintf: vXXsprintf
                }
            })
        }
    }
})(typeof window === "undefined" ? this : window);

// mongosh no longer uses capitalized whatever-this-is.
//DB.prototype.collsize = function (sortcol) {

//  WORKS!
db.__proto__.collsize = function (sortcol) {

var t = [];

db.getCollectionNames().forEach(function(n) {
	//var stats = db[n].stats();

	// db[n] does not work with collections named with leading underscores!
	var coll = db.getCollection(n);
	var stats = coll.stats();

	// var c = db[n].count();
	// var o = db[n].findOne();
	// var x = Object.bsonsize(o);
	// var tt = x * c;
    var c = stats.count;
    if(undefined == c) {
	c = coll.count();
	print("manual count: " + c);
    }
	var x = stats.avgObjSize;
	var tt = stats.size;

	var nidx = stats.nindexes - 1;

	// Adj for minimums...
	//var comp = (stats.storageSize - 16384) / stats.size * 100;
	var comp;
	if(stats.storageSize > (16384*2)) {
	    //comp = (stats.storageSize - 16384) / stats.size * 100;
	    comp = stats.size / (stats.storageSize - 16384);
	} else {
	    comp = 0;
	}

	// Bias for minimum size....
	var ixpd = (stats.totalIndexSize - (16384 * stats.nindexes)) / stats.count

	t.push({collname:n, count:c, objsize:x, csize:tt, comp:comp, totidx:stats.totalIndexSize, nidx:nidx, ixpd:ixpd});
    });


if(sortcol == undefined) {
    sortcol = "count";
}

sortdir = 1;   
sortcol = sortcol.toLowerCase();
if(sortcol.indexOf("-") == 0) {  // leading -; invert sort
    sortdir = -1;   
    sortcol = sortcol.substring(1,sortcol.length);
}

var hdrmap = {
    "collection":"collname",
    "count":"count",
    "avgsize":"objsize",
    "unz":"csize",
    "totidx":"totidx"
};

t.sort(function(a,b){
    var scol = hdrmap[sortcol];
      
    if(a[scol] < b[scol]) {
        n = -1;
    } else if(a[scol] > b[scol]) {
        n = 1;
    } else {
        n = 0;
    }

    n = n * sortdir;

    return n;
    });



print("Collection            Count   AvgSize          Unz  Xz  +Idx     TotIdx  Idx/doc");
print("--------------------  ------- -------- -G--M------  --- ---- ---M------  -------");


var totals = {
    ncoll: 0,
    count: 0,
    csize: 0,
    totidx:0
};

t.forEach(function(r) {
	totals['ncoll'] += 1;
	totals['count'] += r.count;
	totals['csize'] += r.csize;
	totals['totidx'] += r.totidx;

	// sprintf does not like undef so we must groom the data...
	Object.keys(r).forEach(function(k) { 
		if(r[k] == undefined) {
		    r[k] = -1;
		} 
	    });

    var cn = r.collname;
    if(cn.length > 20) {
	cn = cn.slice(0,19) + '+';
    }
	
	print(XXsprintf("%20s %8d   %5d %12d  %3.1f   %2d %10d  %3d",
			cn,
		      r.count,
		      r.objsize,
		      r.csize,
		      r.comp,
		      r.nidx,
		      r.totidx,
		      r.ixpd
		      ));
    });

print("               -----  ------- -------- -G--M------  --- ---- ---M------  -------");

print(XXsprintf("                  %2d %8d         %12d           %10d",
	      totals.ncoll,
	      totals.count,
	      totals.csize,
	      totals.totidx
		      ));
};

