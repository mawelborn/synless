/* global QUnit Synless document */
var closure_stripper = /.*;return |;}\(\)\)/gi;

QUnit.test("Compilation", function (assert) {
    assert.equal(Synless.precompile().replace(closure_stripper, ""),
                 "function(data){}",
                 "Empty render function");
    assert.equal(Synless.precompile(),
                 "(function(){var _k=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(_w));return c;},_w=' ',_e=_.each,_i=_.isEmpty,_t=IncrementalDOM.text,_o=IncrementalDOM.elementOpen,_c=IncrementalDOM.elementClose,_v=IncrementalDOM.elementVoid,_s=IncrementalDOM.skip,_a=IncrementalDOM.attributes,_d=IncrementalDOM.applyAttr,_p=IncrementalDOM.applyProp;return function(data){};}())",
                 "IIFE with hoisted attributes");
});

QUnit.test("Configuration", function (assert) {
    assert.equal(Synless.precompile(null, {variable: "template"}).replace(closure_stripper, ""),
                 "function(template){}",
                 "Variable");
    assert.equal(Synless.precompile(" \t ").replace(closure_stripper, ""),
                 "function(data){_t(_w);}",
                 "Collapse");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ").replace(closure_stripper, ""),
                 "function(data){_t(_w);_o(\"div\",\"_k0\");_t(\" String Thing \");_o(\"div\",\"_k1\");_t(_w);_c(\"div\");_t(_w);_c(\"div\");}",
                 "Collapse");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){_t(\"  \");_o(\"div\",\"_k0\");_t(\" \\t String \\t\\t\\t Thing \\t \");_o(\"div\",\"_k1\");_t(\"  \");_c(\"div\");_t(\"  \");_c(\"div\");}",
                 "No Collapse");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {strip: true}).replace(closure_stripper, ""),
                 "function(data){_o(\"div\",\"_k0\");_t(\"String Thing\");_o(\"div\",\"_k1\");_c(\"div\");_c(\"div\");}",
                 "Strip");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {collapse: false, strip: true}).replace(closure_stripper, ""),
                 "function(data){_o(\"div\",\"_k0\");_t(\"String \\t\\t\\t Thing\");_o(\"div\",\"_k1\");_c(\"div\");_c(\"div\");}",
                 "Strip, No Collapse");
    assert.equal(Synless.precompile("<div> \t\r\n\f&nbsp;</div>").replace(closure_stripper, ""),
                 "function(data){_o(\"div\",\"_k0\");_t(\" \u00A0\");_c(\"div\");}",
                 "Unicode Whitespace");
});

QUnit.test("String vs DOM input", function (assert) {
    var string = "Lorem Ipsum";
    var node = document.createTextNode(string);
    var nodes = [node];
    assert.equal(Synless.precompile(string).replace(closure_stripper, ""), Synless.precompile(node).replace(closure_stripper, ""));
    assert.equal(Synless.precompile(node).replace(closure_stripper, ""), Synless.precompile(nodes).replace(closure_stripper, ""));
});

QUnit.test("DOM Parser Edge Cases", function (assert) {
    assert.equal(Synless.precompile("<td>One</td><td>Two</td><td>Three</td>").replace(closure_stripper, ""),
                 "function(data){_o(\"td\",\"_k0\");_t(\"One\");_c(\"td\");_o(\"td\",\"_k1\");_t(\"Two\");_c(\"td\");_o(\"td\",\"_k2\");_t(\"Three\");_c(\"td\");}",
                 "Root TD element");
    assert.equal(Synless.precompile("<tr><td>One</td><td>Two</td><td>Three</td></tr>").replace(closure_stripper, ""),
                 "function(data){_o(\"tr\",\"_k0\");_o(\"td\",\"_k1\");_t(\"One\");_c(\"td\");_o(\"td\",\"_k2\");_t(\"Two\");_c(\"td\");_o(\"td\",\"_k3\");_t(\"Three\");_c(\"td\");_c(\"tr\");}",
                 "Root TR element");
    assert.equal(Synless.precompile("<option selected>One</option><option selected>Two</option><option>Three</option>").replace(closure_stripper, ""),
                 "function(data){_o(\"option\",\"_k0\",_h0);_t(\"One\");_c(\"option\");_o(\"option\",\"_k1\",_h0);_t(\"Two\");_c(\"option\");_o(\"option\",\"_k2\");_t(\"Three\");_c(\"option\");}",
                 "Root Option element");
    assert.equal(Synless.precompile("<li>One</li><li>Two</li><li>Three</li>").replace(closure_stripper, ""),
                 "function(data){_o(\"li\",\"_k0\");_t(\"One\");_c(\"li\");_o(\"li\",\"_k1\");_t(\"Two\");_c(\"li\");_o(\"li\",\"_k2\");_t(\"Three\");_c(\"li\");}",
                 "Root LI element");
});

QUnit.test("Elements", function (assert) {
    assert.equal(Synless.precompile("<div />").replace(closure_stripper, ""),
                 "function(data){_v(\"div\",\"_k0\");}",
                 "Void element");
    assert.equal(Synless.precompile("<div></div>").replace(closure_stripper, ""),
                 "function(data){_v(\"div\",\"_k0\");}",
                 "Void element");
    assert.notEqual(Synless.precompile(document).replace(closure_stripper, ""),
                    "function(data){}",
                    "Document objects");
});

QUnit.test("Text", function (assert) {
    assert.equal(Synless.precompile("Lorem ipsum").replace(closure_stripper, ""),
                 "function(data){_t(\"Lorem ipsum\");}",
                 "Root text node");
    assert.equal(Synless.precompile("<p>paragraph</p>").replace(closure_stripper, ""),
                 "function(data){_o(\"p\",\"_k0\");_t(\"paragraph\");_c(\"p\");}",
                 "Simple paragraph");
    assert.equal(Synless.precompile("<p sl-text=\"1+2\"></p>").replace(closure_stripper, ""),
                 "function(data){_o(\"p\",\"_k0\");_t(1+2);_c(\"p\");}",
                 "Text directive with JS expression");
    assert.equal(Synless.precompile("<p sl-text=\"'value'\">Existing Children.</p>").replace(closure_stripper, ""),
                 "function(data){_o(\"p\",\"_k0\");_t('value');_c(\"p\");}",
                 "Text directive with JS string");
});

QUnit.test("Attributes", function (assert) {
    assert.equal(Synless.precompile("<input type=\"text\">").replace(closure_stripper, ""),
                 "function(data){_v(\"input\",\"_k0\",_h0);}",
                 "Input type text");
    assert.equal(Synless.precompile("<input type=\"text\" disabled>").replace(closure_stripper, ""),
                 "function(data){_v(\"input\",\"_k0\",_h0);}",
                 "Input type text, Disabled");
    assert.equal(Synless.precompile("<input type=\"text\" disabled>"),
                 "(function(){var _k=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(_w));return c;},_w=' ',_e=_.each,_i=_.isEmpty,_t=IncrementalDOM.text,_o=IncrementalDOM.elementOpen,_c=IncrementalDOM.elementClose,_v=IncrementalDOM.elementVoid,_s=IncrementalDOM.skip,_a=IncrementalDOM.attributes,_d=IncrementalDOM.applyAttr,_p=IncrementalDOM.applyProp,_h0=[\"disabled\",\"\",\"type\",\"text\"];return function(data){_v(\"input\",\"_k0\",_h0);};}())",
                 "Hoisted Input type text, Disabled");
    assert.equal(Synless.precompile("<input type=\"text\" class=\"form-control\" value=\"something\"><input class=\"form-control\" value=\"something\" type=\"text\">"),
                 "(function(){var _k=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(_w));return c;},_w=' ',_e=_.each,_i=_.isEmpty,_t=IncrementalDOM.text,_o=IncrementalDOM.elementOpen,_c=IncrementalDOM.elementClose,_v=IncrementalDOM.elementVoid,_s=IncrementalDOM.skip,_a=IncrementalDOM.attributes,_d=IncrementalDOM.applyAttr,_p=IncrementalDOM.applyProp,_h0=[\"class\",\"form-control\",\"type\",\"text\",\"value\",\"something\"];return function(data){_v(\"input\",\"_k0\",_h0);_v(\"input\",\"_k1\",_h0);};}())",
                 "Reuse Hoisted");
    assert.equal(Synless.precompile("<input type=\"text\" class=\"form-control\" value=\"something\"><input type=\"text\" class=\"form-control\">"),
                 "(function(){var _k=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(_w));return c;},_w=' ',_e=_.each,_i=_.isEmpty,_t=IncrementalDOM.text,_o=IncrementalDOM.elementOpen,_c=IncrementalDOM.elementClose,_v=IncrementalDOM.elementVoid,_s=IncrementalDOM.skip,_a=IncrementalDOM.attributes,_d=IncrementalDOM.applyAttr,_p=IncrementalDOM.applyProp,_h0=[\"class\",\"form-control\",\"type\",\"text\",\"value\",\"something\"],_h1=[\"class\",\"form-control\",\"type\",\"text\"];return function(data){_v(\"input\",\"_k0\",_h0);_v(\"input\",\"_k1\",_h1);};}())",
                 "Differentiate Hoisted");
    assert.equal(Synless.precompile("<input type=\"text\" sl-attr:value=\"data.name\">").replace(closure_stripper, ""),
                 "function(data){_v(\"input\",\"_k0\",_h0,\"value\",data.name);}",
                 "Bound Attribute");
    assert.equal(Synless.precompile("<div sl-attr:class=\"data.class_list\">").replace(closure_stripper, ""),
                 "function(data){_v(\"div\",\"_k0\",null,\"class\",_k(data.class_list));}",
                 "Class");
    assert.equal(Synless.precompile("<div sl-attr:data-dashed-case=\"data.something\"></div>").replace(closure_stripper, ""),
                 "function(data){_v(\"div\",\"_k0\",null,\"data-dashed-case\",data.something);}",
                 "Dash-Case Attribute");
});

QUnit.test("Properties", function (assert) {
    assert.equal(Synless.precompile("<input type=\"text\" sl-prop:disabled=\"data.disabled\">").replace(closure_stripper, ""),
                 "function(data){_a[\"disabled\"]=_p;_v(\"input\",\"_k0\",_h0,\"disabled\",data.disabled);_a[\"disabled\"]=_d;}",
                 "Disabled Prop");
    assert.equal(Synless.precompile("<div sl-prop:scroll-top=\"100\"></div>").replace(closure_stripper, ""),
                 "function(data){_a[\"scrollTop\"]=_p;_v(\"div\",\"_k0\",null,\"scrollTop\",100);_a[\"scrollTop\"]=_d;}",
                 "Dash-Case Property (Conversion To camelCase)");
});

QUnit.test("Control Statements", function (assert) {
    assert.equal(Synless.precompile("<div sl-if=\"data.show\" />").replace(closure_stripper, ""),
                 "function(data){if(data.show){_v(\"div\",\"_k0\");}}",
                 "Normal if");
    assert.equal(Synless.precompile("<div sl-if=\"data.show\"></div><p sl-else></p>").replace(closure_stripper, ""),
                 "function(data){if(data.show){_v(\"div\",\"_k0\");}else{_v(\"p\",\"_k1\");}}",
                 "Normal if else");
    assert.equal(Synless.precompile("<b sl-if=\"data.bold\"></b><i sl-elif=\"data.italic\"></i><span sl-else></span>").replace(closure_stripper, ""),
                 "function(data){if(data.bold){_v(\"b\",\"_k0\");}else if(data.italic){_v(\"i\",\"_k1\");}else{_v(\"span\",\"_k2\");}}",
                 "Normal if elseif else");
    assert.equal(Synless.precompile("<div sl-skip></div>").replace(closure_stripper, ""),
                 "function(data){_o(\"div\",\"_k0\");_s();_c(\"div\");}",
                 "Skip");
    assert.equal(Synless.precompile("<div sl-skip>Some <span>subcontent<span></div>").replace(closure_stripper, ""),
                 "function(data){_o(\"div\",\"_k0\");_s();_c(\"div\");}",
                 "Skip with children");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item\"></div>").replace(closure_stripper, ""),
                 "function(data){_e(data.items,function(item,_1,_2){_v(\"div\",_1+\"_k0\");},this);}",
                 "Each");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\"></div>").replace(closure_stripper, ""),
                 "function(data){_e(data.items,function(_0,_1,_2){_v(\"div\",_1+\"_k0\");},this);}",
                 "No Iteratee");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"\"></div>").replace(closure_stripper, ""),
                 "function(data){_e(data.items,function(_0,_1,_2){_v(\"div\",_1+\"_k0\");},this);}",
                 "Hanging Colon");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item,index\"></div>").replace(closure_stripper, ""),
                 "function(data){_e(data.items,function(item,index,_2){_v(\"div\",index+\"_k0\");},this);}",
                 "Index");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item,index,source\"></div>").replace(closure_stripper, ""),
                 "function(data){_e(data.items,function(item,index,source){_v(\"div\",index+\"_k0\");},this);}",
                 "Source");
    assert.equal(Synless.precompile("<div sl-key=\"data.key\"></div>").replace(closure_stripper, ""),
                 "function(data){_v(\"div\",data.key);}",
                 "Key");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item\" sl-key=\"item.id\"></div>").replace(closure_stripper, ""),
                 "function(data){_e(data.items,function(item,_1,_2){_v(\"div\",item.id+\"_k0\");},this);}",
                 "Each Key");
    assert.equal(Synless.precompile("<div sl-empty=\"data.items\" />").replace(closure_stripper, ""),
                 "function(data){if(!(data.items)||_i(data.items)){_v(\"div\",\"_k0\");}}",
                 "Empty");
    assert.equal(Synless.precompile("<div sl-if=\"data.bold\"></div> \t <div sl-else></div>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){if(data.bold){_v(\"div\",\"_k0\");_t(\" \\t \");}else{_v(\"div\",\"_k1\");}}",
                 "Whitespace text binds to preceding conditional");
    assert.equal(Synless.precompile("<div sl-each=\"data\"></div> \t <div></div>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){_e(data,function(_0,_1,_2){_v(\"div\",_1+\"_k0\");_t(\" \\t \");},this);_v(\"div\",\"_k1\");}",
                 "Whitespace text binds to preceding iterator");
    assert.equal(Synless.precompile("<div sl-each=\"data\" sl-if=\"true\"></div> \t <div></div>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){_e(data,function(_0,_1,_2){if(true){_v(\"div\",_1+\"_k0\");_t(\" \\t \");}},this);_v(\"div\",\"_k1\");}",
                 "Whitespace text binds to preceding conditional inside iterator");
});

QUnit.test("Omitting Elements", function (assert) {
    assert.equal(Synless.precompile("<p></p><div sl-omit></div><p></p>").replace(closure_stripper, ""),
                 "function(data){_v(\"p\",\"_k0\");_v(\"p\",\"_k1\");}",
                 "Omit");
    assert.equal(Synless.precompile("<p></p> <div sl-omit></div> <p></p>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){_v(\"p\",\"_k0\");_t(_w);_t(_w);_v(\"p\",\"_k1\");}",
                 "Omit no collapse whitespace");
    assert.equal(Synless.precompile("<p></p> <div sl-omit></div> <p></p>").replace(closure_stripper, ""),
                 "function(data){_v(\"p\",\"_k0\");_t(_w);_v(\"p\",\"_k1\");}",
                 "Omit collapse whitespace");
});

QUnit.test("Evaluation", function (assert) {
    assert.equal(Synless.precompile("<p></p><div sl-eval=\"console.log(_w);\"></div><p></p>").replace(closure_stripper, ""),
                 "function(data){_v(\"p\",\"_k0\");console.log(_w);_v(\"p\",\"_k2\");}",
                 "Eval");
});
