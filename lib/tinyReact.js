/**
 * Create an "React Element" from a JSX structure.
 *
 * @param {String} type Tag HTML
 * @param {Object} props Object of every HTML props (id, value, ...)
 * @param  {Object[]} children Array of every children (Text element or classic HTML Tag)
 * @return {Object} The current DOM Element (in Object form)
 *
 * @example
 * createElement("div", {"id": "foo"}, ["Hello"]);
 */
function createElement(type, props, ...children) {
	return {
		type,
		props: {
			...props,
			children: children.map(child =>
				typeof child === 'object' ? child : createTextElement(child)
			)
		}
	};
}

/**
 * Create a Text Element.
 *
 * @param {String} Text
 * @return {Object} Text Element as an object
 */
function createTextElement(text) {
	return {
		type: 'TEXT_ELEMENT',
		props: {
			nodeValue: text,
			children: []
		}
	};
}

/**
 * Render the current application.
 *
 * @param {Object} element The App after transformation (createElement)
 * @param {HTMLElement} container The element to append every child
 */
function render(element, container) {
	const dom =
		element.type == 'TEXT_ELEMENT'
			? document.createTextNode('')
			: document.createElement(element.type);

	const isProperty = key => key !== 'children';
	Object.keys(element.props)
		.filter(isProperty)
		.forEach(name => {
			dom[name] = element.props[name];
		});

	element.props.children.forEach(child => render(child, dom));

	container.appendChild(dom);
}

exports.createElement = createElement;
exports.render = render;
