/* global QUnit Synless document */

QUnit.test("Compilation", assert => {
    assert.equal(Synless.compile(), `function(data){}`);
    const precompiled = `!function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(" "));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp;return function(data){};}();`;
    assert.equal(Synless.precompile(), precompiled);
});

QUnit.test("Configuration", assert => {
    assert.equal(Synless.compile(null, {variable: "template"}).toString(),
                 `function(template){}`,
                 "Variable");
    assert.equal(Synless.compile(" \t ").toString(),
                 `function(data){t(" ");}`,
                 "Collapse");
    assert.equal(Synless.compile("  <div> \t String \t\t\t Thing \t <div />  </div>  ").toString(),
                 `function(data){t(" ");o("div","k0");t(" String Thing ");o("div","k1");t(" ");c("div");t(" ");c("div");}`,
                 "Collapse");
    assert.equal(Synless.compile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {collapse: false}).toString(),
                 `function(data){t("  ");o("div","k0");t(" \\t String \\t\\t\\t Thing \\t ");o("div","k1");t("  ");c("div");t("  ");c("div");}`,
                 "No Collapse");
    assert.equal(Synless.compile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {strip: true}).toString(),
                 `function(data){o("div","k0");t("String Thing");o("div","k1");c("div");c("div");}`,
                 "Strip");
    assert.equal(Synless.compile("  <div> \t String \t\t\t Thing \t <div />  </div>  ", {collapse: false, strip: true}).toString(),
                 `function(data){o("div","k0");t("String \\t\\t\\t Thing");o("div","k1");c("div");c("div");}`,
                 "Strip, No Collapse");
});

QUnit.test("String vs DOM input", assert => {
    const string = "Lorem Ipsum";
    const node = document.createTextNode(string);
    const nodes = [node];
    assert.equal(Synless.compile(string).toString(),
                 Synless.compile(node).toString());
    assert.equal(Synless.compile(node).toString(),
                 Synless.compile(nodes).toString());
});

QUnit.test("DOM Parser Edge Cases", assert => {
    assert.equal(Synless.compile("<td>One</td><td>Two</td><td>Three</td>").toString(),
                 `function(data){o("td","k0");t("One");c("td");o("td","k1");t("Two");c("td");o("td","k2");t("Three");c("td");}`,
                 "Root TD element");
    assert.equal(Synless.compile("<tr><td>One</td><td>Two</td><td>Three</td></tr>").toString(),
                 `function(data){o("tr","k0");o("td","k1");t("One");c("td");o("td","k2");t("Two");c("td");o("td","k3");t("Three");c("td");c("tr");}`,
                 "Root TR element");
    assert.equal(Synless.compile("<option selected>One</option><option selected>Two</option><option>Three</option>").toString(),
                 `function(data){o("option","k0",a0);t("One");c("option");o("option","k1",a0);t("Two");c("option");o("option","k2");t("Three");c("option");}`,
                 "Root Option element");
    assert.equal(Synless.compile("<li>One</li><li>Two</li><li>Three</li>").toString(),
                 `function(data){o("li","k0");t("One");c("li");o("li","k1");t("Two");c("li");o("li","k2");t("Three");c("li");}`,
                 "Root LI element");
});

QUnit.test("Elements", assert => {
    assert.equal(Synless.compile("<div />").toString(),
                 `function(data){v("div","k0");}`,
                 "Void element");
    assert.equal(Synless.compile("<div></div>").toString(),
                 `function(data){v("div","k0");}`,
                 "Void element");
});

QUnit.test("Text", assert => {
    assert.equal(Synless.compile("Lorem ipsum").toString(),
                 `function(data){t("Lorem ipsum");}`);
    assert.equal(Synless.compile("<p>paragraph</p>").toString(),
                 `function(data){o("p","k0");t("paragraph");c("p");}`,
                 "Simple paragraph");
    assert.equal(Synless.compile(`<p sl-text="1+2"></p>`).toString(),
                 `function(data){o("p","k0");t(1+2);c("p");}`);
    assert.equal(Synless.compile(`<p sl-text="'value'">Existing Children.</p>`).toString(),
                 `function(data){o("p","k0");t('value');c("p");}`);
});

QUnit.test("Attributes", assert => {
    assert.equal(Synless.compile(`<input type="text">`).toString(),
                 `function(data){v("input","k0",a0);}`,
                 "Input type text");
    assert.equal(Synless.compile(`<input type="text" disabled>`).toString(),
                 `function(data){v("input","k0",a0);}`,
                 "Input type text, Disabled");
    assert.equal(Synless.precompile(`<input type="text" disabled>`),
                 `!function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(" "));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp,a0=["disabled","","type","text"];return function(data){v("input","k0",a0);};}();`,
                 "Hoisted Input type text, Disabled");
    assert.equal(Synless.precompile(`<input type="text" class="form-control" value="something"><input class="form-control" value="something" type="text">`),
                 `!function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(" "));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp,a0=["class","form-control","type","text","value","something"];return function(data){v("input","k0",a0);v("input","k1",a0);};}();`,
                 "Reuse Hoisted");
    assert.equal(Synless.precompile(`<input type="text" class="form-control" value="something"><input type="text" class="form-control">`),
                 `!function(){var cls=function(c){_.isObject(c)&&!_.isArray(c)&&(c=_.filter(_.keys(c),_.propertyOf(c)));_.isArray(c)&&(c=c.join(" "));return c;},t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip,a=IncrementalDOM.attributes,aa=IncrementalDOM.applyAttr,ap=IncrementalDOM.applyProp,a0=["class","form-control","type","text","value","something"],a1=["class","form-control","type","text"];return function(data){v("input","k0",a0);v("input","k1",a1);};}();`,
                 "Differentiate Hoisted");
    assert.equal(Synless.compile(`<input type="text" sl-attr:value="data.name">`).toString(),
                 `function(data){v("input","k0",a0,"value",data.name);}`,
                 "Bound Attribute");
    assert.equal(Synless.compile(`<div sl-attr:class="data.class_list">`).toString(),
                 `function(data){v("div","k0",null,"class",cls(data.class_list));}`,
                 "Class");
});

QUnit.test("Properties", assert => {
    assert.equal(Synless.compile(`<input type="text" sl-prop:disabled="data.disabled">`).toString(),
                 `function(data){a["disabled"]=ap;v("input","k0",a0,"disabled",data.disabled);a["disabled"]=aa;}`,
                 "Disabled Prop");
});

QUnit.test("Control Statements", assert => {
    assert.equal(Synless.compile(`<div sl-if="data.show" />`).toString(),
                 `function(data){if(data.show){v("div","k0");}}`,
                 "Normal if");
    assert.equal(Synless.compile(`<div sl-if="data.show"></div><p sl-else></p>`).toString(),
                 `function(data){if(data.show){v("div","k0");}else{v("p","k1");}}`,
                 "Normal if else");
    assert.equal(Synless.compile(`<b sl-if="data.bold"></b><i sl-elif="data.italic"></i><span sl-else></span>`).toString(),
                 `function(data){if(data.bold){v("b","k0");}else if(data.italic){v("i","k1");}else{v("span","k2");}}`,
                 "Normal if elseif else");
    assert.equal(Synless.compile(`<div sl-skip></div>`).toString(),
                 `function(data){o("div","k0");s();c("div");}`,
                 "Skip");
    assert.equal(Synless.compile(`<div sl-skip>Some <span>subcontent<span></div>`).toString(),
                 `function(data){o("div","k0");s();c("div");}`,
                 "Skip with children");
    assert.equal(Synless.compile(`<div sl-each="data.items:item"></div>`).toString(),
                 `function(data){_.each(data.items,function(item,_1,_2){v("div",_1+"k0");});}`,
                 "Each");
    assert.equal(Synless.compile(`<div sl-each="data.items"></div>`).toString(),
                 `function(data){_.each(data.items,function(_0,_1,_2){v("div",_1+"k0");});}`,
                 "No Iteratee");
    assert.equal(Synless.compile(`<div sl-each="data.items:"></div>`).toString(),
                 `function(data){_.each(data.items,function(_0,_1,_2){v("div",_1+"k0");});}`,
                 "Hanging Colon");
    assert.equal(Synless.compile(`<div sl-each="data.items:item,index"></div>`).toString(),
                 `function(data){_.each(data.items,function(item,index,_2){v("div",index+"k0");});}`,
                 "Index");
    assert.equal(Synless.compile(`<div sl-each="data.items:item,index,source"></div>`).toString(),
                 `function(data){_.each(data.items,function(item,index,source){v("div",index+"k0");});}`,
                 "Source");
    assert.equal(Synless.compile(`<div sl-key="data.key"></div>`).toString(),
                 `function(data){v("div",data.key);}`,
                 "Key");
    assert.equal(Synless.compile(`<div sl-each="data.items:item" sl-key="item.id"></div>`).toString(),
                 `function(data){_.each(data.items,function(item,_1,_2){v("div",_1+item.id);});}`,
                 "Each Key");
    assert.equal(Synless.compile(`<div sl-empty="data.items" />`).toString(),
                 `function(data){if(!(data.items)||_.isEmpty(data.items)){v("div","k0");}}`,
                 "Empty");
    assert.equal(Synless.compile(`<div sl-if="data.bold"></div> \t <div sl-else></div>`, {collapse: false}).toString(),
                 `function(data){if(data.bold){v("div","k0");t(" \\t ");}else{v("div","k1");}}`,
                 "Whitespace text binds to preceding conditional");
    assert.equal(Synless.compile(`<div sl-each="data"></div> \t <div></div>`, {collapse: false}).toString(),
                 `function(data){_.each(data,function(_0,_1,_2){v("div",_1+"k0");t(" \\t ");});v("div","k1");}`,
                 "Whitespace text binds to preceding iterator");
});
