/* global QUnit Synless document */
var closure_stripper = /.*;return |;}\(\)\)/gi;

QUnit.test("Compilation", function (assert) {
    assert.equal(Synless.precompile().replace(closure_stripper, ""),
                 "function(data){}",
                 "Empty render function");
    assert.equal(Synless.precompile(),
                 "(function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(\" \"));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp;return function(data){};}())",
                 "IIFE with hoisted attributes");
});

QUnit.test("Configuration", function (assert) {
    assert.equal(Synless.precompile(null, {variable: "template"}).replace(closure_stripper, ""),
                 "function(template){}",
                 "Variable");
    assert.equal(Synless.precompile(" \t ").replace(closure_stripper, ""),
                 "function(data){t(\" \");}",
                 "Collapse");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ").replace(closure_stripper, ""),
                 "function(data){t(\" \");o(\"div\",\"k0\");t(\" String Thing \");o(\"div\",\"k1\");t(\" \");c(\"div\");t(\" \");c(\"div\");}",
                 "Collapse");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){t(\"  \");o(\"div\",\"k0\");t(\" \\t String \\t\\t\\t Thing \\t \");o(\"div\",\"k1\");t(\"  \");c(\"div\");t(\"  \");c(\"div\");}",
                 "No Collapse");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {strip: true}).replace(closure_stripper, ""),
                 "function(data){o(\"div\",\"k0\");t(\"String Thing\");o(\"div\",\"k1\");c(\"div\");c(\"div\");}",
                 "Strip");
    assert.equal(Synless.precompile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {collapse: false, strip: true}).replace(closure_stripper, ""),
                 "function(data){o(\"div\",\"k0\");t(\"String \\t\\t\\t Thing\");o(\"div\",\"k1\");c(\"div\");c(\"div\");}",
                 "Strip, No Collapse");
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
                 "function(data){o(\"td\",\"k0\");t(\"One\");c(\"td\");o(\"td\",\"k1\");t(\"Two\");c(\"td\");o(\"td\",\"k2\");t(\"Three\");c(\"td\");}",
                 "Root TD element");
    assert.equal(Synless.precompile("<tr><td>One</td><td>Two</td><td>Three</td></tr>").replace(closure_stripper, ""),
                 "function(data){o(\"tr\",\"k0\");o(\"td\",\"k1\");t(\"One\");c(\"td\");o(\"td\",\"k2\");t(\"Two\");c(\"td\");o(\"td\",\"k3\");t(\"Three\");c(\"td\");c(\"tr\");}",
                 "Root TR element");
    assert.equal(Synless.precompile("<option selected>One</option><option selected>Two</option><option>Three</option>").replace(closure_stripper, ""),
                 "function(data){o(\"option\",\"k0\",a0);t(\"One\");c(\"option\");o(\"option\",\"k1\",a0);t(\"Two\");c(\"option\");o(\"option\",\"k2\");t(\"Three\");c(\"option\");}",
                 "Root Option element");
    assert.equal(Synless.precompile("<li>One</li><li>Two</li><li>Three</li>").replace(closure_stripper, ""),
                 "function(data){o(\"li\",\"k0\");t(\"One\");c(\"li\");o(\"li\",\"k1\");t(\"Two\");c(\"li\");o(\"li\",\"k2\");t(\"Three\");c(\"li\");}",
                 "Root LI element");
});

QUnit.test("Elements", function (assert) {
    assert.equal(Synless.precompile("<div />").replace(closure_stripper, ""),
                 "function(data){v(\"div\",\"k0\");}",
                 "Void element");
    assert.equal(Synless.precompile("<div></div>").replace(closure_stripper, ""),
                 "function(data){v(\"div\",\"k0\");}",
                 "Void element");
});

QUnit.test("Text", function (assert) {
    assert.equal(Synless.precompile("Lorem ipsum").replace(closure_stripper, ""),
                 "function(data){t(\"Lorem ipsum\");}",
                 "Root text node");
    assert.equal(Synless.precompile("<p>paragraph</p>").replace(closure_stripper, ""),
                 "function(data){o(\"p\",\"k0\");t(\"paragraph\");c(\"p\");}",
                 "Simple paragraph");
    assert.equal(Synless.precompile("<p sl-text=\"1+2\"></p>").replace(closure_stripper, ""),
                 "function(data){o(\"p\",\"k0\");t(1+2);c(\"p\");}",
                 "Text directive with JS expression");
    assert.equal(Synless.precompile("<p sl-text=\"'value'\">Existing Children.</p>").replace(closure_stripper, ""),
                 "function(data){o(\"p\",\"k0\");t('value');c(\"p\");}",
                 "Text directive with JS string");
});

QUnit.test("Attributes", function (assert) {
    assert.equal(Synless.precompile("<input type=\"text\">").replace(closure_stripper, ""),
                 "function(data){v(\"input\",\"k0\",a0);}",
                 "Input type text");
    assert.equal(Synless.precompile("<input type=\"text\" disabled>").replace(closure_stripper, ""),
                 "function(data){v(\"input\",\"k0\",a0);}",
                 "Input type text, Disabled");
    assert.equal(Synless.precompile("<input type=\"text\" disabled>"),
                 "(function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(\" \"));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp,a0=[\"disabled\",\"\",\"type\",\"text\"];return function(data){v(\"input\",\"k0\",a0);};}())",
                 "Hoisted Input type text, Disabled");
    assert.equal(Synless.precompile("<input type=\"text\" class=\"form-control\" value=\"something\"><input class=\"form-control\" value=\"something\" type=\"text\">"),
                 "(function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(\" \"));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp,a0=[\"class\",\"form-control\",\"type\",\"text\",\"value\",\"something\"];return function(data){v(\"input\",\"k0\",a0);v(\"input\",\"k1\",a0);};}())",
                 "Reuse Hoisted");
    assert.equal(Synless.precompile("<input type=\"text\" class=\"form-control\" value=\"something\"><input type=\"text\" class=\"form-control\">"),
                 "(function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(\" \"));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp,a0=[\"class\",\"form-control\",\"type\",\"text\",\"value\",\"something\"],a1=[\"class\",\"form-control\",\"type\",\"text\"];return function(data){v(\"input\",\"k0\",a0);v(\"input\",\"k1\",a1);};}())",
                 "Differentiate Hoisted");
    assert.equal(Synless.precompile("<input type=\"text\" sl-attr:value=\"data.name\">").replace(closure_stripper, ""),
                 "function(data){v(\"input\",\"k0\",a0,\"value\",data.name);}",
                 "Bound Attribute");
    assert.equal(Synless.precompile("<div sl-attr:class=\"data.class_list\">").replace(closure_stripper, ""),
                 "function(data){v(\"div\",\"k0\",null,\"class\",cls(data.class_list));}",
                 "Class");
    assert.equal(Synless.precompile("<div sl-attr:data-dashed-case=\"data.something\"></div>").replace(closure_stripper, ""),
                 "function(data){v(\"div\",\"k0\",null,\"data-dashed-case\",data.something);}",
                 "Dash-Case Attribute");
});

QUnit.test("Properties", function (assert) {
    assert.equal(Synless.precompile("<input type=\"text\" sl-prop:disabled=\"data.disabled\">").replace(closure_stripper, ""),
                 "function(data){a[\"disabled\"]=ap;v(\"input\",\"k0\",a0,\"disabled\",data.disabled);a[\"disabled\"]=aa;}",
                 "Disabled Prop");
    assert.equal(Synless.precompile("<div sl-prop:scroll-top=\"100\"></div>").replace(closure_stripper, ""),
                 "function(data){a[\"scrollTop\"]=ap;v(\"div\",\"k0\",null,\"scrollTop\",100);a[\"scrollTop\"]=aa;}",
                 "Dash-Case Property (Conversion To camelCase)");
});

QUnit.test("Control Statements", function (assert) {
    assert.equal(Synless.precompile("<div sl-if=\"data.show\" />").replace(closure_stripper, ""),
                 "function(data){if(data.show){v(\"div\",\"k0\");}}",
                 "Normal if");
    assert.equal(Synless.precompile("<div sl-if=\"data.show\"></div><p sl-else></p>").replace(closure_stripper, ""),
                 "function(data){if(data.show){v(\"div\",\"k0\");}else{v(\"p\",\"k1\");}}",
                 "Normal if else");
    assert.equal(Synless.precompile("<b sl-if=\"data.bold\"></b><i sl-elif=\"data.italic\"></i><span sl-else></span>").replace(closure_stripper, ""),
                 "function(data){if(data.bold){v(\"b\",\"k0\");}else if(data.italic){v(\"i\",\"k1\");}else{v(\"span\",\"k2\");}}",
                 "Normal if elseif else");
    assert.equal(Synless.precompile("<div sl-skip></div>").replace(closure_stripper, ""),
                 "function(data){o(\"div\",\"k0\");s();c(\"div\");}",
                 "Skip");
    assert.equal(Synless.precompile("<div sl-skip>Some <span>subcontent<span></div>").replace(closure_stripper, ""),
                 "function(data){o(\"div\",\"k0\");s();c(\"div\");}",
                 "Skip with children");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item\"></div>").replace(closure_stripper, ""),
                 "function(data){_.each(data.items,function(item,_1,_2){v(\"div\",_1+\"k0\");},this);}",
                 "Each");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\"></div>").replace(closure_stripper, ""),
                 "function(data){_.each(data.items,function(_0,_1,_2){v(\"div\",_1+\"k0\");},this);}",
                 "No Iteratee");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"\"></div>").replace(closure_stripper, ""),
                 "function(data){_.each(data.items,function(_0,_1,_2){v(\"div\",_1+\"k0\");},this);}",
                 "Hanging Colon");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item,index\"></div>").replace(closure_stripper, ""),
                 "function(data){_.each(data.items,function(item,index,_2){v(\"div\",index+\"k0\");},this);}",
                 "Index");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item,index,source\"></div>").replace(closure_stripper, ""),
                 "function(data){_.each(data.items,function(item,index,source){v(\"div\",index+\"k0\");},this);}",
                 "Source");
    assert.equal(Synless.precompile("<div sl-key=\"data.key\"></div>").replace(closure_stripper, ""),
                 "function(data){v(\"div\",data.key);}",
                 "Key");
    assert.equal(Synless.precompile("<div sl-each=\"data.items\" sl-as=\"item\" sl-key=\"item.id\"></div>").replace(closure_stripper, ""),
                 "function(data){_.each(data.items,function(item,_1,_2){v(\"div\",_1+item.id);},this);}",
                 "Each Key");
    assert.equal(Synless.precompile("<div sl-empty=\"data.items\" />").replace(closure_stripper, ""),
                 "function(data){if(!(data.items)||_.isEmpty(data.items)){v(\"div\",\"k0\");}}",
                 "Empty");
    assert.equal(Synless.precompile("<div sl-if=\"data.bold\"></div> \t <div sl-else></div>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){if(data.bold){v(\"div\",\"k0\");t(\" \\t \");}else{v(\"div\",\"k1\");}}",
                 "Whitespace text binds to preceding conditional");
    assert.equal(Synless.precompile("<div sl-each=\"data\"></div> \t <div></div>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){_.each(data,function(_0,_1,_2){v(\"div\",_1+\"k0\");t(\" \\t \");},this);v(\"div\",\"k1\");}",
                 "Whitespace text binds to preceding iterator");
    assert.equal(Synless.precompile("<div sl-each=\"data\" sl-if=\"true\"></div> \t <div></div>", {collapse: false}).replace(closure_stripper, ""),
                 "function(data){_.each(data,function(_0,_1,_2){if(true){v(\"div\",_1+\"k0\");t(\" \\t \");}},this);v(\"div\",\"k1\");}",
                 "Whitespace text binds to preceding conditional inside iterator");
});
