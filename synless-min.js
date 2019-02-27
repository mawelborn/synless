(function(a,b){"use strict";"function"==typeof define&&define.amd?define(["exports","underscore"],b):"undefined"==typeof exports?b(a.Synless={},a._):b(exports,require("underscore"))})("undefined"==typeof self?this:self,function(a,b){"use strict";function _toArray(a){return _arrayWithHoles(a)||_iterableToArray(a)||_nonIterableRest()}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _slicedToArray(a,b){return _arrayWithHoles(a)||_iterableToArrayLimit(a,b)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}return c}function _arrayWithHoles(a){if(Array.isArray(a))return a}a.VERSION="0.8.0",a.options={variable:"data",collapse:!0,strip:!1},a.compile=function(a,b){return new Function(j(a,b))()},a.precompile=function(a,b){return"(function(){".concat(j(a,b),"}())")},a.template=function(b,c){var d=a.compile(b,c);return function(a,b){return IncrementalDOM.patch(a,d,b)}};var c=/<(\w+)/,d={base:"head",body:"html",caption:"table",col:"colgroup",colgroup:"table",dd:"dl",dt:"dl",figcaption:"figure",head:"html",legend:"fieldset",li:"ul",optgroup:"select",option:"select",param:"object",source:"video",style:"head",summary:"details",tbody:"table",td:"tr",tfoot:"table",th:"tr",thead:"table",title:"head",tr:"tbody",track:"video"};a.dom_parser=function(a){var e=b.last(a.match(c))||"",f=d[e.toLowerCase()]||"div",g=document.createElement(f);return g.innerHTML=a,g.childNodes};var e={},f={},g=[],h={},i=[],j=function(c,d){e=b.extend({},a.options,d),g=["cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(\" \"));return c;}","t=IncrementalDOM.text","o=IncrementalDOM.elementOpen","c=IncrementalDOM.elementClose","v=IncrementalDOM.elementVoid","s=IncrementalDOM.skip","a=IncrementalDOM.attributes","aa=IncrementalDOM.applyAttr","ap=IncrementalDOM.applyProp"],c=k(c),l(c);var j="var ".concat(g.join(","),";return function(").concat(e.variable,"){").concat(i.join(""),"};");return e={},f={},g=[],h={},i=[],j},k=function(c){return b.isString(c)&&(c=a.dom_parser(c)),c instanceof DocumentFragment&&(c=c.childNodes),(c instanceof NodeList||c instanceof HTMLCollection)&&(c=b.toArray(c)),(b.isUndefined(c)||null===c)&&(c=[]),b.isArray(c)||(c=[c]),c},l=function(a){return b.each(a,function(a){9!=a.nodeType||a!=a.documentElement,3==a.nodeType&&m(a),1==a.nodeType&&p(a)})},m=function(a){var c=o(a.nodeValue);if(!e.strip||0<c.length){var d="t("+C(c)+");",f=""==c.trim(),g="}"==b.last(i),h="});"==b.last(i),j=h&&"}"==i[i.length-2];f&&j?i.splice(-2,0,d):f&&(h||g)?i.splice(-1,0,d):i.push(d)}},n=/\s+/g,o=function(a){return e.collapse&&(a=a.replace(n," ")),e.strip&&(a=a.trim()),a},p=function(a){var c=t(a),d=_slicedToArray(c,4),e=d[0],f=d[1],g=d[2],h=d[3],j=b.has(e,"sl-key")?e["sl-key"]:C(E("k")),k=z(f);if(b.has(e,"sl-each")){var m,n,o,p,q=e["sl-each"].split(":"),r=_slicedToArray(q,2);m=r[0],n=r[1],n&&""!=n||(n="_0");var s=n.split(","),w=_toArray(s);n=w[0],o=w[1],p=w.slice(2),o&&""!=o||(o="_1"),0==p.length&&p.push("_2"),j="".concat(o,"+").concat(j),i.push("_.each(".concat(m,",function(").concat(n,",").concat(o,",").concat(p.join(","),"){"))}b.has(g,"class")&&(g["class"]="cls(".concat(g["class"],")")),b.has(e,"sl-empty")&&(e["sl-if"]="!(".concat(e["sl-empty"],")||_.isEmpty(").concat(e["sl-empty"],")")),b.has(e,"sl-if")?i.push("if(".concat(e["sl-if"],"){")):b.has(e,"sl-elif")?i.push("else if(".concat(e["sl-elif"],"){")):b.has(e,"sl-else")&&i.push("else{"),b.has(e,"sl-skip")?y(a,j,k,g,h,"s();"):b.has(e,"sl-text")?y(a,j,k,g,h,"t(".concat(e["sl-text"],");")):b.isEmpty(a.childNodes)?u(a,j,k,g,h):(v(a,j,k,g,h),l(b.toArray(a.childNodes)),x(a)),(b.has(e,"sl-if")||b.has(e,"sl-elif")||b.has(e,"sl-else"))&&i.push("}"),b.has(e,"sl-each")&&i.push("});")},q=/^sl-/,r=/^sl-attr:/,s=/^sl-prop:/,t=function(a){var c={},d={},e={},f=[];return b.each(a.attributes,function(a){s.test(a.nodeName)&&(f.push(a.nodeName.replace(s,"")),e[a.nodeName.replace(s,"")]=a.nodeValue),r.test(a.nodeName)?e[a.nodeName.replace(r,"")]=a.nodeValue:q.test(a.nodeName)?c[a.nodeName]=a.nodeValue:d[a.nodeName]=a.nodeValue}),[c,d,e,f]},u=function(){for(var a=arguments.length,b=Array(a),c=0;c<a;c++)b[c]=arguments[c];return w.apply(void 0,["v"].concat(b))},v=function(){for(var a=arguments.length,b=Array(a),c=0;c<a;c++)b[c]=arguments[c];return w.apply(void 0,["o"].concat(b))},w=function(a,c,d,e,f,g){b.each(g,function(a){return i.push("a[".concat(C(a),"]=ap;"))}),i.push("".concat(a,"(").concat(A(c),",").concat(d)),("null"!=e||0<b.keys(f).length)&&i.push(",".concat(e)),b.each(f,function(a,b){return i.push(",".concat(C(b),",").concat(a))}),i.push(");"),b.each(g,function(a){return i.push("a[".concat(C(a),"]=aa;"))})},x=function(a){i.push("c("+A(a)+");")},y=function(a,b,c,d,e,f){v(a,b,c,d,e),i.push(f),x(a)},z=function(a){if(0==b.keys(a).length)return"null";if(a=b.map(b.keys(a).sort(),function(b){return"".concat(C(b),",").concat(C(a[b]))}),a="[".concat(a.join(","),"]"),b.has(h,a))return h[a];var c=E("a");return g.push("".concat(c,"=").concat(a)),h[a]=c,c},A=function(a){return C(a.nodeName.toLowerCase())},B={"\n":"\\n","\r":"\\r","	":"\\t",'"':"\\\""},C=function(a){return"\""+b.reduce(b.pairs(B),function(a,b){var c=_slicedToArray(b,2),d=c[0],e=c[1];return a.split(d).join(e)},a)+"\""},D=function(a){return b.has(f,a)||(f[a]=0),f[a]++},E=function(a){return""+a+D(a)}});
