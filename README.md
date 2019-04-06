![Synless](./synless.svg)

> Syntax-less HTML templates that compile to Incremental DOM

<hr>

[Background](#background)
| [Browser Compatibility](#browser-compatibility)
| [Usage](#usage)
| [API](#api)
| [Configuration](#configuration)
| [Template Directives](#template-directives)
| [Changelog](#changelog)


Synless is an HTML template compiler that targets
[Incremental DOM](https://github.com/google/incremental-dom).
It aims to be small, self-contained, and well-behaved in restrictive environments. Synless templates
do not use any custom syntax&mdash;all templates are valid HTML5 markup. Attribute, property, text,
and control directives are specified with HTML attributes, and most directives support arbitrary
JavaScript expressions.


```HTML
<div id="template">
    <h1 sl-text="data.heading"></h1>
    <p sl-if="data.logged_in">Hello, <span sl-text="data.name"></span>!</p>
    <p sl-else>Hey, stranger. Maybe <a sl-attr:href="data.login_url">log in</a>?</p>
    <b>Recent Members</b>
    <ul>
        <li sl-each="data.recent_members" sl-as="member">
            <span sl-text="member.name"></span> Joined On
            <time sl-attr:datetime="member.join_date" sl-text="member.formatted_date()"></time>
        </li>
        <li sl-empty="data.recent_members">No Recent Members</li>
    </ul>
    <button type="button" sl-prop:disabled="data.close_disabled">Close</button>
</div>
```

```JavaScript
var template = Synless.template(document.querySelector("#template").childNodes);
template(document.body, {
    heading: "Synless Templates",
    logged_in: true,
    name: "John",
    recent_members: [
        {name: "Jane", join_date: "1970-01-01", formatted_date: function() {...}},
        ...
    ],
    close_disabled: false
});
```


# Background

Synless was originally designed to be a replacement for Mustache and jQuery inside Backbone View
render methods. They were very easy to use for rendering, with most views needing only one line to
manipulate the DOM:

```JavaScript
Backbone.View.extend({
    template: $("template").html(),
    render: function() {
        this.$el.html(Mustache.render(this.template, this.model.attributes));
        return this.el;
    }
});
```

But rendering the view in this way wipes out all element state (most importantly focus and user
interactions) as well as any subviews that have been created. In addition, Mustache templates are
"Text that happens-to-be HTML" and aren't always valid HTML markup before being rendered. This often
necessitates using inconvenient JavaScript strings or script tag tricks to store templates.

Synless aims to be as simple to use as Mustache and jQuery while also solving these problems.

```JavaScript
Backbone.View.extend({
    template: Synless.template(document.querySelector("template").content),
    render: function() {
        return this.template(this.el);
    }
});
```

It does so by adhering to these principles:

**No Syntax**  
Templates should have no special syntax. They should be valid HTML when uncompiled and easy to work
with in restrictive environments that only allow valid HTML and JavaScript, like commercial
off-the-shelf products.

**Fully In-Browser**  
Templates should be fully functional in-browser and not require an external build system. The
original, readable template source should be usable in COTS environments without needing to maintain
an external version that must be built or transpiled before use.

**Multiple Input Types**  
HTML can be represented in multiple ways&mdash;Strings, Documents, Nodes, NodeLists,
HTMLCollections, template element DocumentFragments. The compiler should be able to take any of
these input types and produce a render function.

**DOM Patching**  
Instead of wiping out the existing DOM subtree, rendering a template should patch the subtree in
a performant way that maintains element state. Synless depends on
[Incremental DOM](https://github.com/google/incremental-dom) for this.

**Preservation of Subviews**  
Templates should have a way to specify that an element's subtree will be managed by an external
factor. Patching the DOM tree should leave such elements' subtrees unchanged.


# Browser Compatibility

The minified production version of Synless is ECMAScript 5 compatible and supports Chrome, Edge,
Firefox, and IE10+.

IE9 is supported with the caveat that certain HTML strings do not compile correctly in-browser. Root
elements that have specific parent element requirements (td, option, etc.) are not preserved when
converted to a DOM tree.

```JavaScript
var wrapper = document.createElement("tbody");
wrapper.innerHTML = "<tr><td>One</<td><td>Two</td></tr>";
wrapper.childNodes // Incorrectly produces TextNode("OneTwo")
```

If you need to compile such templates in IE9, include the template in your HTML and compile the DOM
nodes directly instead of using an HTML string.


# Usage

Synless depends on [Incremental DOM](https://github.com/google/incremental-dom) 0.6.0 and
[Underscore](https://underscorejs.org) 1.6.0+ (or equivalent).

```HTML
<!doctype html>
<html lang="en">
    <head>
        ...
        <script src="incremental-dom-min.js"></script>
        <script src="underscore-min.js"></script>
        <script src="synless-min.js"></script>
    </head>
    <body>
        ...
        <script>
            var template = Synless.template(document.querySelector(...).childNodes);
            template(document.querySelector(...), data);
        </script>
    </body>
</html>
```


# API

## Synless.template(html[, options])

Compile the `html` representation using `options` into a function that patches an element using
Incremental DOM. `html` can be an HTML string or object that conforms to the DOM spec (or an array
of such objects). This includes entire Documents, DocumentFragments, Nodes, NodeLists, and
HTMLCollections.

```JavaScript
var template = Synless.template(html_or_dom, {variable: "template_data"});
template(element, data);
```

This is merly a convenience wrapper around `Synless.compile`:

```JavaScript
Synless.template = (nodes, options) => {
    const render = Synless.compile(nodes, options);
    return function(el, data, context) {
        return IncrementalDOM.patch(el, render.bind(context || this), data);
    };
};
```


## Template Function(el[, data[, context]])

The template function returned by `Synless.template` will patch the `el` element's subtree and
return `el`. The optional `data` argument will be assigned to the `options.variable` name within the
template function. The optional `context` argument will be assigned to `this` within the template.

If no `context` is provided, `this` defaults to the context from which the template was called. If
the template function is a property of a Backbone View, `this` will automatically be the view
instance that the render function was called on.

```JavaScript
Backbone.View.extend({
    // `this` within the template will be a view instance.
    template: Synless.template(`<span sl-text="this.model.get('name')"></span>`),
    render: function() {
        // `this.template` will return `this.el`.
        return this.template(this.el);
    }
});
```


## Synless.compile(html[, options])

Compile the `html` representation using `options` into an Incremental DOM render function. `html`
can be an HTML string or object that conforms to the DOM spec (or an array of such objects). This
includes entire Document, DocumentFragment, Node, NodeList, and HTMLCollection. The following are
all valid uses:

```JavaScript
var render_function = Synless.compile("<p>HTML String</p>");
render_function = Synless.compile(document.getElementById("template"));
render_function = Synless.compile(document.body.childNodes);
render_function = Synless.compile(document.querySelector("template").content);
render_function = Synless.compile(document.querySelectorAll("p"));
IncrementalDOM.patch(document.body, render_function, [...users]);
```


## Render Function(data)

The render function returned by `Synless.compile` contains the Incremental DOM instructions used by
`IncrementalDOM.patch` to patch a DOM tree. The `data` passed to `IncrementalDOM.patch` is placed in
scope within the template using the `options.variable` name.

```JavaScript
var render_function = Synless.compile(html);
IncrementalDOM.patch(element, render_function, data);
```


## Synless.precompile(html[, options])

Compile the `html` representation using `options` into a JavaScript IIFE string that will return an
Incremental DOM render function when evaluated. This can be used to precompile templates
server-side. `html` can be any type that is supported by `Synless.compile`. Underscore is required
for compilation, and Incremental DOM and Underscore are required to be in scope when the IIFE is
evaluated.

```JavaScript
fs.writeFileSync("template.js", "var template = " + Synless.precompile("<p>HTML String</p>"));
```


# Configuration

## Options

Specify template compilation options globally using `Synless.options` or per template using the
`options` parameter of `Synless.template`, `Synless.compile`, or `Synless.precompile`.

Option|Description
------|-----------
variable|The name of the variable that data passed to the render function will be assigned to.<br>Default: `"data"`
collapse|Collapse contiguous runs of whitespace into single spaces. This reduces compiled template size but will not affect element layout or spacing.<br>Default: `true`
strip|Strip whitespace from the beginning and end of text nodes. If a stripped text node is empty, it is omitted from the compiled template entirely. This further reduces compiled template size but can affect element layout and the spacing of inline elements.<br>Default: `false`


## DOM Parser

Synless compiles templates by walking DOM trees and emitting Incremental DOM JavaScript code. HTML
strings are first converted to a DOM tree with `Synless.dom_parser`. By default, it uses the current
environment's `document` object to parse HTML.

If used in a non-browser environment, `dom_parser` should be overwritten with a function that takes
an HTML string and returns a list of Nodes for the string. Synless supports HTML strings with
multiple root elements, and any `dom_parser` replacement should do the same.

```JavaScript
Synless.dom_parser = html_string => {
    let wrapper = document.createElement("div");
    wrapper.innerHTML = html_string;
    return wrapper.childNodes;
};
```


# Template Directives

Template directives for attribute and property assignment, text substitution, and flow control are
specified using HTML attributes prefixed with `sl-`. The value of the attribute is the JavaScript
expression used for the assignment, substitution, or control statement.

Directive|Description
---------|-----------
`sl-text`|Assign the element's innerText property.
`sl-attr:*`|Assign an attribute on the element.
`sl-prop:*`|Assign a property on the element.
`sl-skip`|Skip this element's subtree when patching.
`sl-each`, `sl-as`|Repeat this element and its subtree for every item in the collection.
`sl-key`|Assign a unique key to this element.
`sl-if`, `sl-elif`, `sl-else`|Conditionally render this element.
`sl-empty`|Conditionally render this element if the expression is empty.
`sl-omit`|Skip this element during compilation.
`sl-eval`|Execute arbitrary JavaScript statements in place of an element.


## Assignment Directives

Assignment directives specify assignments for and element's attributes, properties, or text content.
Values for these directives can be any valid JavaScript expression.


### Text

Use the `sl-text` directive to specify the text content of the element it's found on. Any children
of the element will omitted from the compiled template.

```HTML
<span sl-text="this.name"></span>
<span sl-text="Date.now()"></span>
<span sl-text="this.model.get('title')"></span>
<span sl-text="1+2">Existing child nodes are discarded.</span>
```


### Attributes

Use `sl-attr:*` to bind dynamic values to an element's attribute. The attribute to bind comes after
the colon. Values are set as an attribute or property based on their type. Objects and Functions are
set as properties, and all other types are set as attributes.

```HTML
<a sl-attr:href="this.model.get('url')" sl-text="this.model.get('name')"></a>
<button type="button" sl-attr:onclick="this.function_callback">Button</button>
```


#### Special Case: Style

The `style` attribute can be set using a string or an object. A string value should be written as it
normally would in HTML. An object value should use camelCase keys as would be used if assigning
`el.style` in JavaScript.

```HTML
<div sl-attr:style="this.style_value"></div>
```

Given the above, the following would be equivalent values for `style_value`:

```JavaScript
"margin: 0; padding-left: 10px; font-size: 1.5em;"
```

```JavaScript
{
    margin: 0,
    paddingLeft: "10px",
    fontSize: "1.5em"
}
```


#### Special Case: Class

The `class` attribute can be set using a string, array, or object. A string should be written as it
normally would in HTML. An array of class names will be combined into a class list. An object will
be converted to a class list by including keys in the list whose values are truthy.

```HTML
<ul class="list">
    <li sl-attr:class="this.classes"></li>
</ul>
```

Given the above, the following would be equivalent:

```JavaScript
"list-item selected"
```

```JavaScript
["list-item", "selected"]
```

```JavaScript
{
    "list-item": true,
    "selected": true,
    "another-class": false
}
```

The value can be any JavaScript expression that evaluates to a string, array, or object. Inline
objects are good way to toggle classes based on data properties:

```HTML
<ul>
    <li sl-attr:class="{'list-item': true, 'selected': this.model.get('selected')}"></li>
</ul>
```


### Properties

Use `sl-prop:*` to force a value to be set as a property. This is useful for boolean attributes like
`checked` and `disabled` where any attribute value would be considered true. They must be set as
properties to work correctly.

```HTML
<input type="checkbox" sl-prop:checked="this.model.get('checked')">
```

Property names are converted from dash-case to camelCase to support specifying properties like
`scrollTop`.

> In many environments, HTML attribute names are case-insensitive and get converted to lower case.

```HTML
<div class="dropdown" sl-prop:scroll-top="this.index * 20">
    <!-- This is equivalent to el.scrollTop = this.index * 20; -->
</div>
```


## Control Directives

Control directives generally wrap a control statement around the element that the directive is found
on. If multiple directives are found on the same element, skips takes precedence over iteration,
iteration takes precedence over conditionals, and conditionals take precedence over assignments.


### Skip Subtrees

Use `sl-skip` to prevent an element's subtree from being patched. This is useful for when an
external factor manages an element's children, like a Backbone View appending subviews to a
container element. Any children of this element are omitted from the compiled template. Attributes
and properties will be patched on the element that this directive is found on.

```HTML
<div sl-skip id="container">
    <!-- This element's subtree is not patched, but the element itself is. -->
</div>
```


### Iteration

Use `sl-each` to repeat an element once for every value in an array or object. The value can be any
valid JavaScript expression. The variable assignment for each iteration can be specified using
`sl-as`. The value is used as the arguments list for the callback to `_.each()`, and can include an
argument for the value, key, and iterator. Each iteration inherits the `this` context from the
containing scope (`this` references the same thing throughout the template).

```HTML
<ul>
    <li sl-each="this.collection.models" sl-as="model,index,models">
        <a sl-attr:href="model.get('url')" sl-text="model.get('name')"></a>
    </li>
</ul>
```

Would be like:

```HTML
<ul>
    _.each(this.collection.models, function(model, index, models) {
        <li>
            <a href="{{model.get('url')}}">{{model.get('name')}}</a>
        </li>
    }, this);
</ul>
```


### Key

Use `sl-key` to specify a unique key for an element. The value can be any valid JavaScript
expression that can be converted to a string. Using keys allows element state (like focus and user
interaction) to be properly maintained when elements are added, removed, or reordered.

Keys only need to be unique among sibling elements. Synless automatically generates a unique key for
every element, and by default uses the loop index as a part of a composite key inside `sl-each`
loops. Specifying an alternate key for `sl-each` elements allows you to use some other attribute of
the iterated data to determine uniqueness.

Generally, `sl-key` directives only need to be specified on elements that have `sl-each` directives;
and even then, only when the loop index does not deterministically track elements in a collection.

```HTML
<ul>
    <li sl-each="this.collection.models" sl-as="model" sl-key="model.id">
        <input type="text" placeholder="Name" sl-prop:value="model.get('name')">
    </li>
</ul>
```


### Conditionals

Use `sl-if`, `sl-elif`, and `sl-else` to conditionally render elements. The values of `sl-if` and
`sl-elif` are placed in the corresponding JavaScript conditional and support any valid JavaScript
expression.

```HTML
<p sl-if="this.user">Hello, <span sl-text="this.user.get('name')"></span>!</p>
<p sl-else>Hello, stranger!</p>
```

Would be like:

```HTML
if (this.user) {
    <p>Hello, <span>{{this.user.get('name')}}</span>!</p>
}
else {
    <p>Hello, stranger!</p>
}
```

Iteration has higher precedence than conditionals, which allows both `sl-each` and `sl-if` to be
used at the same time.

```HTML
<ul>
    <li sl-each="this.collection.models" sl-as="model"
        sl-if="!model.get('hidden')"
        sl-text="model.get('name')"></li>
</ul>
```

Would be like:

```HTML
<ul>
    _.each(this.collection.models, function(model) {
        if (!model.get('hidden')) {
            <li>{{model.get('name')}}</li>
        }
    }, this);
</ul>
```


### Empty (Each-Else)

`sl-empty` is like the opposite of `sl-each`. It renders an element only if the expression is empty
(a falsey value, an array with length 0, or an object with no keys). `sl-empty` can be used on its
own; it does not have to follow an `sl-each`.


```HTML
<ul>
    <li sl-each="this.collection.models" sl-as="model">
        <a sl-attr:href="model.get('url')" sl-text="model.get('name')"></a>
    </li>
    <li sl-empty="this.collection.models">No Items</li>
</ul>
```

Would be like:

```HTML
<ul>
    _.each(this.collection.models, function(model) {
        <li>
            <a href="{{model.get('url')}}">{{model.get('name')}}</a>
        </li>
    }, this);
    if (!(this.collection.models) || _.isEmpty(this.collection.models)) {
        <li>No Items</li>
    }
</ul>
```


## Omit Element

Use `sl-omit` to skip an element during the compilation process and omit it from the template
entirely. No other directives are processed on the element.

```HTML
<div sl-omit>
    <!-- This element and it's children are ignored entirely. -->
</div>
```


## Evaluation

Use `sl-eval` to execute arbitrary JavaScript statements in place of the element this directive is
found on. The element and any children are omitted from the compiled template (as `sl-omit` does).
This statement can be used to execute other Incremental DOM render functions created with
`Synless.compile`, allowing for composable component-like behavior. Unlike `Synless.template` which
patches the DOM tree below the specified element, this *replaces* the element's DOM tree.

```HTML
<div class="form-group" sl-key="data.name">
    <label class="control-label" sl-text="data.label"></label>
    <input type="text" class="form-control" sl-attr:name="data.name">
</div>
...
<form>
    <div sl-eval="data.field_component({label: 'Email', name: 'email'})"></div>
    <div sl-eval="data.field_component({label: 'Username', name: 'username'})"></div>
    <div sl-eval="data.field_component({label: 'Password', name: 'password'})"></div>
</form>
```

Using the following Javascript:

```JavaScript
var template = Synless.template(document.querySelector("form").childNodes);
var field_component = Synless.compile(document.querySelector("div.form-group"));
template(document.querySelector("form"), {field_component: field_component});
```

Would be like:

```HTML
<form>
    <div class="form-group" sl-key="email">
        <label class="control-label" sl-text="Email"></label>
        <input type="text" class="form-control" sl-attr:name="email">
    </div>
    <div class="form-group" sl-key="username">
        <label class="control-label" sl-text="Username"></label>
        <input type="text" class="form-control" sl-attr:name="username">
    </div>
    <div class="form-group" sl-key="password">
        <label class="control-label" sl-text="Password"></label>
        <input type="text" class="form-control" sl-attr:name="password">
    </div>
</form>
```

This directive can be combined with the control directives `sl-if`, `sl-elif`, `sl-else`, `sl-each`,
and `sl-empty` on the same element.

Note that when calling a separate render function using `sl-eval`, the inner render function's
auto-generated element keys may collide with sibling elements in the outer render function. It's a
good idea to set an explicit unique `sl-key` or pass in a key from the outer iterator if it's in
one. This is why `sl-key` is specified in the preceeding example. Otherwise, each `div.form-group`
would have the same key.

```HTML
<div class="component" sl-key="data.key">
    ...
</div>
...
<div sl-each="data.models" sl-as="model,index" 
     sl-eval="data.component({model: model, key: index})"></div>
```


# Changelog

## v1.1.0
- Add `sl-omit` directive to ignore an element during compilation.
- Add `sl-eval` directive for executing arbitary JavaScript and partial template functions.

## v1.0.0
- Initial stable release.
- Hoist Underscore and IncrementalDOM functions for improved performance and template compactness.
- Prefix hoisted variables with underscores to avoid collisions with user defined variables.
- Fix a bug where the contents of Document types (nodeType == 9) were discarded.

## v0.9.1
- Convert dash case `sl-prop:*` directive values to camel case to support setting properties like
  `element.scrollTop`.

## v0.9.0
- Breaking Change: separate the conbined `sl-each` syntax for iteratee and iterator variables into 
  separate `sl-each` and `sl-as` directives.

## v0.8.1
- Add an optional context argument to `Synless.template` that will be bound to `this` within the
  template.
- Make iterators inherit their parent's `this` context instead of it being null.

## v0.8.0
- Initial functional version.
