Synless Templates
=================

Templates that commit no sins.


API
===

Synless.template(template[, options]) => Function(element, data)
----------------------------------------------------------------

Compile the `template` representation using `options` to a function that patches an element using
IncrementalDOM.

```JavaScript
var template = Synless.template(html_or_dom, options);
template(element, data);
```

This is merly a convenience wrapper around `Synless.compile`:

```JavaScript
Synless.template = (nodes, options) => {
    const render = Synless.compile(nodes, options);
    return (el, data) => IncrementalDOM.patch(el, render, data);
};
```


Synless.compile(template[, options]) => Function
------------------------------------------------

Compile the `template` representation using `options` to an IDOM render function. `template` can be
an HTML string or object (including arrays of objects) that conform to the DOM spec. This includes
entire `Document`s, `DocumentFragment`s, `Node`s, `NodeList`s, and `HTMLCollection`s. The following
are all valid uses:

```JavaScript
var render_function = Synless.compile("<p>HTML String</p>");
render_function = Synless.compile(document.getElementById("template"));
render_function = Synless.compile(document.body.childNodes);
render_function = Synless.compile(document.querySelectorAll("p"));
IncrementalDOM.patch(document.body, render_function, [...users]);
```


Synless.precompile(template[, options]) => String
-------------------------------------------------

Compile the `template` representation using `options` to a JavaScript IIFE that returns an IDOM
render function. This can be used to precompile templates server-side. `template` can be an HTML
string or an object (or array of objects) that conform to the Document Object Model spec.

```JavaScript
fs.writeFileSync("template.js", "var template = " + Synless.precompile("<p>HTML String</p>"));
```


Configuration
=============

Options
-------

Specify template options for compilation globally using `Synless.options` or per template using the
`options` parameter to `Synless.template`, `Synless.compile`, and `Synless.precompile`. Compilation
options are:

Option|Description
------|-----------
variable|The name of the variable that data passed to the render function will be assigned to.<br>Default: data
collapse|Collapse adjacent whitespace into a single space.<br>This will not affect element layout or spacing.<br>Default: true
strip|Trim whitespace from the beginning and end of text nodes.<br>If a stripped text node is empty, it will be omitted from the template entirely.<br>This can affect element layout and spacing of inline elements.<br>Default: false


DOM Parser
----------

Synless compiles templates by walking DOM trees and emitting Incremental DOM JavaScript code. HTML
strings are first converted to a DOM tree with `Synless.dom_parser`. By default, it uses the current
environment's `document` object to parse HTML.

If used in a non-browser environment, `dom_parser` should be overwritten with a function that takes
an HTML string and returns a list of `Node`s for the string. Synless supports HTML strings with
multiple root elements, and any `dom_parser` replacement should do the same.

```JavaScript
Synless.dom_parser = html_string => {
    let wrapper = document.createElement("div");
    wrapper.innerHTML = html_string;
    return wrapper.childNodes;
};
```


Attributes, Properties, Text, and HTML
======================================

Text
----

Use the `sl-text` directive to specify the text content of the element it's found on. The element
should not have any child nodes. If it does, they will be ignored and replaced with the specified
text content. The value of `sl-text` can be any valid JavaScript expression.

```HTML
<span sl-text="data.name"></span>
<span sl-text="Date.now()"></span>
<span sl-text="backbone_model.get('title')"></span>
<span sl-text="1+2">Existing child nodes are discarded.</span>
```

Would compile to:

```JavaScript
elementOpen("span");
    text(data.name);
elementClose("span");
elementOpen("span");
    text(Date.now());
elementClose("span");
elementOpen("span");
    text(backbone_model.get('title'));
elementClose("span");
elementOpen("span");
    text(1+2);
elementClose("span");
```


Attributes and Properties
-------------------------

Use `sl-attr:*` to bind dynamic values to an element attribute or property. The attribute to bind
comes after the colon. Values can be any valid JavaScript expression. Values are set as an attribute
or property based on their type. Objects and Functions are set as properties, and all other types
are set as attributes.

```HTML
<a sl-attr:href="data.url" sl-attr:onclick="data.function_callback" sl-text="data.name"></a>
```

To force a value to be set as a property, use `sl-prop:*`. This is useful for boolean attributes
like `checked` and `disabled` where any attribute value would be considered true. They must be set
as properties to work correctly.

```HTML
<input type="checkbox" sl-prop:checked="data.is_checked">
```


### Special Case: Style

The style attribute can be set using a string or an object. A string style value should be written
as it normally would in HTML. An object style value should use camelCase keys as would be used if
working with `el.style` in JavaScript.

```HTML
<div sl-attr:style="data.div_style"></div>
```

Given the above, the following would be equivalent values for `div_style`:

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


### Special Case: Class

The class attribute can be set using a string, array, or object. A string value should be written
as it normally would in HTML. An array of class names will be combined into a class list. An object
will be converted to a class list by including keys in the list whose values are truthy.

```HTML
<ul class="list">
    <li sl-attr:style="data.classes"></li>
</ul>
```

Given the above, the following would be equivalent:

```JavasScript
"list-item selected"
```

```JavasScript
["list-item", "selected"]
```

```JavasScript
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
    <li sl-attr:style="{'list-item': true, 'selected': data.is_selected}"></li>
</ul>
```


Control Directives
==================

Control directives compile to the control statement wrapped around the element that the directive is
found on. Iteration has higher precendence than conditionals.

Skip
----

Use `sl-skip` to prevent Incremental DOM from patching the tree below the element that the directive
is found on. This is useful for when something else manages an element's children, like a container
for the Views of a Backbone Collection. Incremental DOM will create and manage attributes for the
element that this directive is found on.

```HTML
<div id="container" sl-skip>
    ... Subtree items are not patched by IDOM ...
</div>
```

Would compile to:

```JavaScript
elementOpen("div", null, null, "id", "container");
skip();
elementClose("div");
```


Each
----

Use `sl-each` to repeat an element once for value in an array or object. Specify the name of the
iterable, followed by a colon, followed by the name to assign the value to in each iteration.

```HTML
<ul>
    <li sl-each="data.list_items:item">
        <a sl-attr:href="item.url" sl-text="item.name"></a>
    </li>
</ul>
```

Is equivalent to:

```Mustache
<ul>
    {{#list_items}}
    <li>
        <a href="{{url}}">{{name}}</a>
    </li>
    {{/list_items}}
</ul>
```

And would compile to:

```JavaScript
elementOpen("ul");
_.each(data.list_items, function(item) {
    elementOpen("li");
        elementOpen("a", null, null, "href", item.url);
            text(item.name);
        elementClose("a");
    elementClose("li");
});
elementClose("ul");
```


Key
---

Use `sl-key` to specify a unique key for an element. The value can be any valid JavaScript
expression that can be converted to a string. Using keys allows Incremental DOM to hoist static
attributes and more efficiently patch the DOM tree. It also allows focus to be properly maintained
when elements are added or removed around an element that the user is interacting with.

Keys only need to be unique among sibling elements. Synless automatically generates a unique key for
every element, and inside loops it uses the loop index as a part of the composite key. Specifying a
key for loop elements allows you to use some other attribute of the iterated data to determine
uniqueness.

```HTML
<ul>
    <li sl-each="data.items:item" sl-key="item.id">
        <input type="text" placeholder="Name" sl-prop:value="item.name">
    </li>
</ul>
```


If, Else If, Else
-----------------

Use `sl-if`, `sl-elif`, and `sl-else` to conditionally render an element. The value of `sl-if` of
`sl-elif` is placed in the corresponding JavaScript conditional and supports any valid JavaScript
expression.

```HTML
<p sl-if="data.logged_in">
    Hello, <span sl-text="data.user_name"></span>!
</p>
<p sl-else>
    Hello, stranger!
</p>
```

Is equivalent to:

```Mustache
{{#logged_in}}
<p>
    Hello, {{user_name}}!
</p>
{{/logged_in}}
{{^logged_in}}
<p>
    Hello, stranger!
</p>
{{/logged_in}}
```

And would compile to:

```JavaScript
if (data.logged_in) {
    elementOpen("p");
        text("Hello, ");
        elementOpen("span");
            text(data.user);
        elementClose("span");
        text("!");
    elementClose("p");
}
else {
    elementOpen("p");
        text("Hello, stranger!");
    elementClose("p");
}
```

Iteration has higher precedence than conditionals, which allows compact representations like the
following:

```HTML
<ul>
    <li sl-each="data.list_items:item"
        sl-if="!item.hidden"
        sl-text="item.name"></li>
</ul>
```

Which is equivalent to:

```Mustache
<ul>
    {{#list_items}}
    {{^hidden}}
    <li>{{name}}</li>
    {{/hidden}}
    {{/list_items}}
</ul>
```

And compiles to:

```JavaScript
elementOpen("ul");
_.each(data.list_items, function(item) {
    if (!item.hidden) {
        elementOpen("li");
            text(item.name);
        elementClose("li");
    }
});
elementClose("ul");
```


Empty
-----

`sl-empty="condition"` is a shorthand for `sl-if="!(condition)||_.isEmpty(condition)"`. Useful for
specifying something to be displayed if a value is falsey (including empty arrays and objects).


```HTML
<ul>
    <li sl-each="data.list_items:item">
        <a sl-attr:href="item.url" sl-text="item.name"></a>
    </li>
    <li sl-empty="data.list_items">No Items</li>
</ul>
```

Is equivalent to:

```Mustache
<ul>
    {{#list_items}}
    <li>
        <a href="{{url}}">{{name}}</a>
    </li>
    {{/list_items}}
    {{^list_items}}
    <li>No Items</li>
    {{/list_items}}
</ul>
```

And would compile to:

```JavaScript
elementOpen("ul");
_.each(data.list_items, function(item) {
    elementOpen("li");
        elementOpen("a", null, null, "href", item.url);
            text(item.name);
        elementClose("a");
    elementClose("li");
});
if (!(data.list_items) || _.isEmpty(data.list_items)) {
    elementOpen("li");
        text("No Items");
    elementClose("li");
}
elementClose("ul");
```