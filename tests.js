/* global QUnit Synless document */

QUnit.test("Compilation", assert => {
    assert.equal(Synless.compile(), `function(data){}`);
    assert.equal(Synless.compile(null, {variable: "template"}), `function(template){}`);
    const precompiled = `!function(){var t=IncrementalDOM.text,o=IncrementalDOM.elementOpen,c=IncrementalDOM.elementClose,v=IncrementalDOM.elementVoid,s=IncrementalDOM.skip;return function(data){};}();`;
    assert.equal(Synless.precompile(), precompiled);
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

QUnit.test("Elements", assert => {
    assert.equal(Synless.compile("<div />").toString(),
                 `function(data){v("div");}`,
                 "Void element");
    assert.equal(Synless.compile("<div></div>").toString(),
                 `function(data){v("div");}`,
                 "Void element");
});

QUnit.test("Text", assert => {
    assert.equal(Synless.compile("Lorem ipsum").toString(),
                 `function(data){t("Lorem ipsum");}`);
    assert.equal(Synless.compile("<p>paragraph</p>").toString(),
                 `function(data){o("p");t("paragraph");c("p");}`,
                 "Simple paragraph");
    assert.equal(Synless.compile(`<p sl-text="1+2"></p>`).toString(),
                 `function(data){o("p");t(1+2);c("p");}`);
    assert.equal(Synless.compile(`<p sl-text="'value'">Existing Children.</p>`).toString(),
                 `function(data){o("p");t('value');c("p");}`);
});

QUnit.test("Attributes", assert => {
    assert.equal(Synless.compile(`<input type="text">`).toString(),
                 `function(data){v("input",null,null,"type","text");}`,
                 "Input type text");
    assert.equal(Synless.compile(`<input type="text" disabled>`).toString(),
                 `function(data){v("input",null,null,"type","text","disabled","");}`,
                 "Input type text");
});

QUnit.test("Control Statements", assert => {
    assert.equal(Synless.compile(`<div sl-if="data.show" />`).toString(),
                 `function(data){if(data.show){v("div");}}`,
                 "Normal if");
    assert.equal(Synless.compile(`<div sl-if="data.show"></div><p sl-else></p>`).toString(),
                 `function(data){if(data.show){v("div");}else{v("p");}}`,
                 "Normal if else");
    assert.equal(Synless.compile(`<b sl-if="data.bold"></b><i sl-elif="data.italic"></i><span sl-else></span>`).toString(),
                 `function(data){if(data.bold){v("b");}else if(data.italic){v("i");}else{v("span");}}`,
                 "Normal if elseif else");
    assert.equal(Synless.compile(`<div sl-skip></div>`).toString(),
                 `function(data){o("div");s();c("div");}`,
                 "Skip");
    assert.equal(Synless.compile(`<div sl-skip>Some <span>subcontent<span></div>`).toString(),
                 `function(data){o("div");s();c("div");}`,
                 "Skip with children");
    assert.equal(Synless.compile(`<div sl-each="data.items:item"></div>`).toString(),
                 `function(data){_.each(data.items,function(item){v("div");});}`,
                 "Each");
});
