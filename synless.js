/* global define, exports, require, self, document, NodeList, HTMLCollection */
((root, factory) => {
    if (typeof define === "function" && define.amd)
        define(["exports", "underscore"], factory);
    else if (typeof exports !== "undefined")
        factory(exports, require("underscore"));
    else
        factory(root.Synless = {}, root._);
})(typeof self !== "undefined" ? self : this, (Synless, _) => {
    Synless.VERSION = "0.1.0";

    Synless.dom_parser = html_string => {
        let wrapper = document.createElement("div");
        wrapper.innerHTML = html_string;
        return wrapper.childNodes;
    };

    Synless.compile = (nodes, options) => (new Function(renderer_for(nodes, options)))();
    Synless.precompile = (nodes, options) => `!function(){${renderer_for(nodes, options)}}();`;
    Synless.options = {variable: "data"};


    let counters = {};
    const increment_counter = prefix => {
        if (!_.has(counters, prefix))
            counters[prefix] = 0;
        return counters[prefix]++;
    };
    const unique_id = prefix => "" + prefix + increment_counter(prefix);


    const renderer_for = (nodes, options) => {
        options = _.extend({}, Synless.options, options);
        counters = {};

        const vars = ["t=IncrementalDOM.text",
                      "o=IncrementalDOM.elementOpen",
                      "c=IncrementalDOM.elementClose",
                      "v=IncrementalDOM.elementVoid",
                      "s=IncrementalDOM.skip"];
        const hoisted = {};
        const code = [];

        nodes = prepare_nodes(nodes);
        compile_nodes(vars, hoisted, code, nodes);

        return `var ${vars.join(",")};return function(${options.variable}){${code.join("")}};`;
    };


    const prepare_nodes = nodes => {
        if (_.isString(nodes))
            nodes = Synless.dom_parser(nodes);

        if (nodes instanceof NodeList || nodes instanceof HTMLCollection)
            nodes = _.toArray(nodes);

        if (_.isUndefined(nodes) || nodes === null)
            nodes = [];

        if (!_.isArray(nodes))
            nodes = [nodes];

        return nodes;
    };


    const compile_nodes = (vars, hoisted, code, nodes) => _.each(nodes, node => {
        if (node.nodeType == 9)
            node == node.documentElement;
        if (node.nodeType == 3)
            code.push("t(" + escape_string(node.nodeValue) + ");");
        if (node.nodeType == 1)
            compile_element(vars, hoisted, code, node);
    });


    const compile_element = (vars, hoisted, code, element) => {
        const [sl_attrs, el_attrs, attrs] = get_attrs(element);
        let key = _.has(sl_attrs, "sl-key") ? sl_attrs["sl-key"] : escape_string(unique_id("k"));
        const hoist_var = hoist_attributes(vars, hoisted, el_attrs);

        if (_.has(sl_attrs, "sl-each")) {
            let iterator, iteratee, index, rest;
            [iterator, iteratee] = sl_attrs["sl-each"].split(":");
            if (!iteratee || iteratee == "")
                iteratee = "_0";
            [iteratee, index, ...rest] = iteratee.split(",");
            if (!index || index == "")
                index = "_1";
            if (rest.length == 0)
                rest.push("_2");
            key = `${index}+${key}`;
            code.push(`_.each(${iterator},function(${iteratee},${index},${rest.join(",")}){`);
        }

        if (_.has(sl_attrs, "sl-if"))
            code.push(`if(${sl_attrs["sl-if"]}){`);
        else if (_.has(sl_attrs, "sl-elif"))
            code.push(`else if(${sl_attrs["sl-elif"]}){`);
        else if (_.has(sl_attrs, "sl-else"))
            code.push("else{");

        if (_.has(sl_attrs, "sl-skip"))
            wrap_with_element(code, element, key, hoist_var, attrs, "s();");
        else if (_.has(sl_attrs, "sl-text"))
            wrap_with_element(code, element, key, hoist_var, attrs,
                              `t(${sl_attrs["sl-text"]});`);
        else if (_.isEmpty(element.childNodes))
            void_element(code, element, key, hoist_var, attrs);
        else {
            open_element(code, element, key, hoist_var, attrs);
            compile_nodes(vars, hoisted, code, _.toArray(element.childNodes));
            close_element(code, element);
        }

        if (_.has(sl_attrs, "sl-if")
            || _.has(sl_attrs, "sl-elif")
            || _.has(sl_attrs, "sl-else"))
            code.push("}");

        if (_.has(sl_attrs, "sl-each"))
            code.push("});");
    };


    const sl_pattern = /^sl-/;
    const attr_pattern = /^sl-attr:/;
    const get_attrs = element => {
        const sl = {}, el = {}, attrs = {};
        _.each(element.attributes, attr => {
            if (attr_pattern.test(attr.nodeName))
                attrs[attr.nodeName.replace(attr_pattern, "")] = attr.nodeValue;
            else if (sl_pattern.test(attr.nodeName))
                sl[attr.nodeName] = attr.nodeValue;
            else
                el[attr.nodeName] = attr.nodeValue;
        });
        return [sl, el, attrs];
    };


    const vo_element = (func, code, el, key, hoist, attrs) => {
    const void_element = (...args) => vo_element("v", ...args);
    const open_element = (...args) => vo_element("o", ...args);
        code.push(`${func}(${tag_name(el)},${key}`);
        if (hoist != "null" || _.keys(attrs).length > 0)
            code.push(`,${hoist}`);
        _.each(attrs, (value, name) => code.push(`,${escape_string(name)},${value}`));
        code.push(");");
    };


    const close_element = (code, el) => {
        code.push("c(" + tag_name(el) + ");");
    };


    const wrap_with_element = (code, el, key, hoist, attrs, wrapped) => {
        open_element(code, el, key, hoist, attrs);
        code.push(wrapped);
        close_element(code, el);
    };


    const hoist_attributes = (vars, hoisted, attrs) => {
        if (_.keys(attrs).length == 0)
            return "null";
        attrs = _.map(_.keys(attrs).sort(),
                      key => `${escape_string(key)},${escape_string(attrs[key])}`);
        attrs = `[${attrs.join(",")}]`;
        if (_.has(hoisted, attrs))
            return hoisted[attrs];
        else {
            let hoist_var = unique_id("a");
            vars.push(`${hoist_var}=${attrs}`);
            hoisted[attrs] = hoist_var;
            return hoist_var;
        }
    };


    const tag_name = el => escape_string(el.nodeName.toLowerCase());


    const escapes = {"\n": "\\n",
                     "\r": "\\r",
                     "\t": "\\t",
                     "\"": "\\\""};
    const escape_string = value => (
        "\""
        + _.reduce(_.pairs(escapes),
                   (value, [unescaped, escaped]) => value.split(unescaped).join(escaped),
                   value)
        + "\""
    );
});
