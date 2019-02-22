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


    let counter = 0;
    const unique_key = (prefix) => "" + prefix + counter++;


    const renderer_for = (nodes, options) => {
        options = _.extend({}, Synless.options, options);

        const vars = ["t=IncrementalDOM.text",
                      "o=IncrementalDOM.elementOpen",
                      "c=IncrementalDOM.elementClose",
                      "v=IncrementalDOM.elementVoid",
                      "s=IncrementalDOM.skip"];
        const code = [];

        nodes = prepare_nodes(nodes);
        compile_nodes(vars, code, nodes);

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


    const compile_nodes = (vars, code, nodes) => _.each(nodes, node => {
        if (node.nodeType == 9)
            node == node.documentElement;
        if (node.nodeType == 3)
            code.push("t(" + escape_string(node.nodeValue) + ");");
        if (node.nodeType == 1)
            compile_element(vars, code, node);
    });


    const compile_element = (vars, code, element) => {
        const [sl_attrs, el_attrs] = get_attrs(element);

        if (_.has(sl_attrs, "sl-each")) {
            let [iterator, iteratee] = sl_attrs["sl-each"].split(":");
            code.push(`_.each(${iterator},function(${iteratee}){`);
        }

        if (_.has(sl_attrs, "sl-if"))
            code.push(`if(${sl_attrs["sl-if"]}){`);
        else if (_.has(sl_attrs, "sl-elif"))
            code.push(`else if(${sl_attrs["sl-elif"]}){`);
        else if (_.has(sl_attrs, "sl-else"))
            code.push("else{");

        if (_.has(sl_attrs, "sl-skip"))
            wrap_with_element(code, element, el_attrs, "s();");
        else if (_.has(sl_attrs, "sl-text"))
            wrap_with_element(code, element, el_attrs,
                              `t(${sl_attrs["sl-text"]});`);
        else if (_.isEmpty(element.childNodes))
            void_element(code, element, el_attrs);
        else {
            open_element(code, element, el_attrs);
            compile_nodes(vars, code, _.toArray(element.childNodes));
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
    const get_attrs = element => {
        const sl = {}, el = {};
        _.each(element.attributes, attr => {
            if (sl_pattern.test(attr.nodeName))
                sl[attr.nodeName] = attr.nodeValue;
            else
                el[attr.nodeName] = attr.nodeValue;
        });
        return [sl, el];
    };


    const void_element = (code, el, attrs) => vo_element("v", code, el, attrs);
    const open_element = (code, el, attrs) => vo_element("o", code, el, attrs);
    const vo_element = (func, code, el, attrs) => {
        code.push(`${func}(${tag_name(el)}`)
        if (_.keys(attrs).length > 0)
            code.push(",null,null");
        _.each(attrs, (value, name) => code.push(`,${escape_string(name)},${escape_string(value)}`));
        code.push(");");
    };


    const close_element = (code, el) => {
        code.push("c(" + tag_name(el) + ");");
    };


    const wrap_with_element = (code, el, attrs, wrapped) => {
        open_element(code, el, attrs);
        code.push(wrapped);
        close_element(code, el);
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
