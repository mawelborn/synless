/*! Synless.js 1.2.1 | (c) Michael Welborn | Synless is MIT licensed */
((root, factory) => {
    "use strict";
    if (typeof define === "function" && define.amd)
        define(["exports", "underscore", "incremental-dom"], factory);
    else if (typeof exports !== "undefined")
        factory(exports, require("underscore"), require("incremental-dom"));
    else
        factory(root.Synless = {}, root._, root.IncrementalDOM);
})(typeof self !== "undefined" ? self : this, (Synless, _, IncrementalDOM) => {
    "use strict";
    Synless.VERSION = "1.2.1";
    Synless.options = {variable: "data",
                       collapse: true,
                       strip: false};
    Synless.compile = (nodes, options) => {
        const renderer = renderer_for(nodes, options);
        const source_url = "//# sourceURL=" + _.uniqueId("synless_render_") + ".js";
        return (new Function(renderer + source_url))();
    };
    Synless.precompile = (nodes, options) => `(function(){${renderer_for(nodes, options)}}())`;
    Synless.template = (nodes, options) => {
        const render = Synless.compile(nodes, options);
        return function(el, data, context) {
            return IncrementalDOM.patch(el, render.bind(context || this), data);
        };
    };

    const tag_name_pattern = /<(\w+)/;
    const parent_for = {
        "base": "head", "body": "html", "caption": "table", "col": "colgroup",
        "colgroup": "table", "dd": "dl", "dt": "dl", "figcaption": "figure",
        "head": "html", "legend": "fieldset", "li": "ul", "optgroup": "select",
        "option": "select", "param": "object", "source": "video", "style": "head",
        "summary": "details", "tbody": "table", "td": "tr", "tfoot": "table",
        "th": "tr", "thead": "table", "title": "head", "tr": "tbody", "track": "video"
    };
    Synless.dom_parser = html_string => {
        let tag_name = _.last(html_string.match(tag_name_pattern)) || "";
        let parent_tag_name = parent_for[tag_name.toLowerCase()] || "div";
        let wrapper = document.createElement(parent_tag_name);
        wrapper.innerHTML = html_string;
        return wrapper.childNodes;
    };


    let opts = {}, counters = {}, vars = [], hoisted = {}, code = [];
    const renderer_for = (nodes, options) => {
        opts = _.extend({}, Synless.options, options);
        vars = ["_k=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));"
                    + "_.isArray(c)&&(c=c.join(_w));return c;}",
                "_w=' '",
                "_e=_.each",
                "_i=_.isEmpty",
                "_t=IncrementalDOM.text",
                "_o=IncrementalDOM.elementOpen",
                "_c=IncrementalDOM.elementClose",
                "_v=IncrementalDOM.elementVoid",
                "_s=IncrementalDOM.skip",
                "_a=IncrementalDOM.attributes",
                "_d=IncrementalDOM.applyAttr",
                "_p=IncrementalDOM.applyProp"];
        nodes = prepare_nodes(nodes);
        compile_nodes(nodes);
        let renderer = `var ${vars.join(",")};return function(${opts.variable}){${code.join("")}};`;
        opts = {};
        counters = {};
        vars = [];
        hoisted = {};
        code = [];
        return renderer;
    };


    const prepare_nodes = nodes => {
        if (_.isString(nodes))
            nodes = Synless.dom_parser(nodes);
        if (nodes instanceof DocumentFragment)
            nodes = nodes.childNodes;
        if (nodes instanceof NodeList || nodes instanceof HTMLCollection)
            nodes = _.toArray(nodes);
        if (_.isUndefined(nodes) || nodes === null)
            nodes = [];
        if (!_.isArray(nodes))
            nodes = [nodes];
        return nodes;
    };


    const compile_nodes = nodes => _.each(nodes, node => {
        if (node.nodeType === 9)
            node = node.documentElement;
        if (node.nodeType === 3)
            compile_text(node);
        if (node.nodeType === 1)
            compile_element(node);
    });


    const close_conditional = "}";
    const close_iterator = "},this);";
    const whitespace_instruction = "_t(_w);";
    const compile_text = node => {
        let text = compress(node.nodeValue);
        if (!opts.strip || text.length > 0) {
            let instruction = "_t(" + (text === single_space ? "_w" : literal(text)) + ");",
                whitespace_text = text.trim() === "",
                preceding_whitespace = _.last(code) === whitespace_instruction,
                duplicate_whitespace = (opts.collapse && preceding_whitespace
                                        && instruction === whitespace_instruction),
                preceding_conditional = _.last(code) === close_conditional,
                preceding_iterator = _.last(code) === close_iterator,
                preceding_iterator_conditional = (preceding_iterator
                                                  && code[code.length - 2] === close_conditional);

            if (whitespace_text && preceding_iterator_conditional)
                code.splice(-2, 0, instruction);
            else if (whitespace_text && (preceding_iterator || preceding_conditional))
                code.splice(-1, 0, instruction);
            else if (!duplicate_whitespace)
                code.push(instruction);
        }
    };


    const whitespace_pattern = /[ \t\r\n\f]+/g;
    const single_space = " ";
    const compress = text => {
        if (opts.collapse)
            text = text.replace(whitespace_pattern, single_space);
        if (opts.strip)
            text = text.trim();
        return text;
    };


    const compile_element = element => {
        const [sl_attrs, el_attrs, attrs, as_props] = get_attrs(element);

        if (_.has(sl_attrs, "sl-omit"))
            return;

        let key = _.has(sl_attrs, "sl-key") ? sl_attrs["sl-key"] : literal(unique_id("_k"));
        const hoist_var = hoist_attributes(el_attrs);

        if (_.has(sl_attrs, "sl-each")) {
            let iterator = sl_attrs["sl-each"];
            let iteratee = sl_attrs["sl-as"] || "";
            iteratee = iteratee.split(",");
            _.each(_.range(3), i => iteratee[i] = iteratee[i] || "_" + i);
            key = _.has(sl_attrs, "sl-key")
                  ? `${key}+${literal(unique_id("_k"))}`
                  : `${iteratee[1]}+${key}`;
            iteratee = iteratee.join(",");
            code.push(`_e(${iterator},function(${iteratee}){`);
        }

        if (_.has(attrs, "class"))
            attrs["class"] = `_k(${attrs["class"]})`;

        if (_.has(sl_attrs, "sl-empty"))
            sl_attrs["sl-if"] = `!(${sl_attrs["sl-empty"]})||_i(${sl_attrs["sl-empty"]})`;

        if (_.has(sl_attrs, "sl-if"))
            code.push(`if(${sl_attrs["sl-if"]}){`);
        else if (_.has(sl_attrs, "sl-elif"))
            code.push(`else if(${sl_attrs["sl-elif"]}){`);
        else if (_.has(sl_attrs, "sl-else"))
            code.push("else{");

        if (_.has(sl_attrs, "sl-skip"))
            wrap_with_element(element, key, hoist_var, attrs, as_props, "_s();");
        else if (_.has(sl_attrs, "sl-text"))
            wrap_with_element(element, key, hoist_var, attrs, as_props,
                              `_t(${sl_attrs["sl-text"]});`);
        else if (_.has(sl_attrs, "sl-eval"))
            code.push(sl_attrs["sl-eval"]);
        else if (_.isEmpty(element.childNodes))
            void_element(element, key, hoist_var, attrs, as_props);
        else {
            open_element(element, key, hoist_var, attrs, as_props);
            compile_nodes(_.toArray(element.childNodes));
            close_element(element);
        }

        if (_.has(sl_attrs, "sl-if")
            || _.has(sl_attrs, "sl-elif")
            || _.has(sl_attrs, "sl-else"))
            code.push(close_conditional);

        if (_.has(sl_attrs, "sl-each"))
            code.push(close_iterator);
    };


    const sl_pattern = /^sl-/;
    const attr_pattern = /^sl-attr:/;
    const prop_pattern = /^sl-prop:/;
    const dash_pattern = /-(\w)/;
    const camel_replacement = (match, letter) => letter.toUpperCase();
    const get_attrs = element => {
        const sl = {}, el = {}, attrs = {}, as_props = [];
        _.each(element.attributes, attr => {
            if (prop_pattern.test(attr.nodeName)) {
                var prop_name = attr.nodeName.replace(prop_pattern, "")
                                             .replace(dash_pattern, camel_replacement);
                as_props.push(prop_name);
                attrs[prop_name] = attr.nodeValue;
            }
            if (attr_pattern.test(attr.nodeName))
                attrs[attr.nodeName.replace(attr_pattern, "")] = attr.nodeValue;
            else if (sl_pattern.test(attr.nodeName))
                sl[attr.nodeName] = attr.nodeValue;
            else
                el[attr.nodeName] = attr.nodeValue;
        });
        return [sl, el, attrs, as_props];
    };


    const void_element = (...args) => vo_element("_v", ...args);
    const open_element = (...args) => vo_element("_o", ...args);
    const vo_element = (func, el, key, hoist, attrs, as_props) => {
        _.each(as_props, prop => code.push(`_a[${literal(prop)}]=_p;`));
        code.push(`${func}(${tag_name(el)},${key}`);
        if (hoist !== "null" || _.keys(attrs).length > 0)
            code.push(`,${hoist}`);
        _.each(attrs, (value, name) => code.push(`,${literal(name)},${value}`));
        code.push(");");
        _.each(as_props, prop => code.push(`_a[${literal(prop)}]=_d;`));
    };


    const close_element = el => {
        code.push("_c(" + tag_name(el) + ");");
    };


    const wrap_with_element = (el, key, hoist, attrs, as_props, wrapped) => {
        open_element(el, key, hoist, attrs, as_props);
        code.push(wrapped);
        close_element(el);
    };


    const hoist_attributes = attrs => {
        if (_.keys(attrs).length === 0)
            return "null";
        attrs = _.map(_.keys(attrs).sort(), key => `${literal(key)},${literal(attrs[key])}`);
        attrs = `[${attrs.join(",")}]`;
        if (_.has(hoisted, attrs))
            return hoisted[attrs];
        else {
            let hoist_var = unique_id("_h");
            vars.push(`${hoist_var}=${attrs}`);
            hoisted[attrs] = hoist_var;
            return hoist_var;
        }
    };


    const tag_name = el => literal(el.nodeName.toLowerCase());


    const escapes = {"\n": "\\n",
                     "\r": "\\r",
                     "\t": "\\t",
                     "\"": "\\\""};
    const literal = value => (
        "\""
        + _.reduce(_.pairs(escapes),
                   (value, [unescaped, escaped]) => value.split(unescaped).join(escaped),
                   value)
        + "\""
    );


    const next_counter = prefix => {
        if (!_.has(counters, prefix))
            counters[prefix] = 0;
        return counters[prefix]++;
    };
    const unique_id = prefix => "" + prefix + next_counter(prefix);
});
