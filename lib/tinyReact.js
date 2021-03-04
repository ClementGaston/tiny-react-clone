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
 * Render the current element.
 *
 * @param {Object} fiber The current element
 */
function createDom(fiber) {
	const dom =
		fiber.type == 'TEXT_ELEMENT'
			? document.createTextNode('')
			: document.createElement(fiber.type);

	updateDom(dom, {}, fiber.props);
	return dom;
}

const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

/**
 * Update every props of a specific dom element
 *
 * @param {HTMLElement} dom The current element to update
 * @param {Object} prevProps Object that contain every old props
 * @param {Object} nextProps Object that contain every new props
 */
function updateDom(dom, prevProps, nextProps) {
	//Remove old or changed event listeners
	Object.keys(prevProps)
		.filter(isEvent)
		.filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
		.forEach(name => {
			const eventType = name.toLowerCase().substring(2);
			dom.removeEventListener(eventType, prevProps[name]);
		});

	// Remove old properties
	Object.keys(prevProps)
		.filter(isProperty)
		.filter(isGone(prevProps, nextProps))
		.forEach(name => {
			dom[name] = '';
		});

	// Set new or changed properties
	Object.keys(nextProps)
		.filter(isProperty)
		.filter(isNew(prevProps, nextProps))
		.forEach(name => {
			dom[name] = nextProps[name];
		});

	// Add event listeners
	Object.keys(nextProps)
		.filter(isEvent)
		.filter(isNew(prevProps, nextProps))
		.forEach(name => {
			const eventType = name.toLowerCase().substring(2);
			dom.addEventListener(eventType, nextProps[name]);
		});
}

/**
 * Commit every changement to the DOM (Avoid incomplete UI changment)
 */
function commitRoot() {
	deletions.forEach(commitWork);
	commitWork(wipRoot.child);
	currentRoot = wipRoot;
	wipRoot = null;
}

/**
 * Create, update or delete the DOM with the current element given
 *
 * @param {Object} fiber The current element
 */
function commitWork(fiber) {
	if (!fiber) {
		return;
	}
	const domParent = fiber.parent.dom;
	if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
		domParent.appendChild(fiber.dom);
	} else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
		updateDom(fiber.dom, fiber.alternate.props, fiber.props);
	} else if (fiber.effectTag === 'DELETION') {
		domParent.removeChild(fiber.dom);
	}

	commitWork(fiber.child);
	commitWork(fiber.sibling);
}

/**
 * Set the next element to render.
 *
 * @param {Object} element The App after transformation (createElement)
 * @param {HTMLElement} container The element to append every child
 */
function render(element, container) {
	wipRoot = {
		dom: container,
		props: {
			children: [element]
		},
		alternate: currentRoot
	};
	deletions = [];
	nextUnitOfWork = wipRoot;
}

// Current component to render
let nextUnitOfWork = null;
// Elements to render
let wipRoot = null;
// Last element committed to the DOM
let currentRoot = null;
// Array of every element to remove
let deletions = null;

/**
 * Look trought every component to render (and render it if the browser isn't busy)
 *
 * @param {Int} deadline Time before the browser needs to take control again
 */
function workLoop(deadline) {
	let shouldYield = false;
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1;
	}

	if (!nextUnitOfWork && wipRoot) {
		commitRoot();
	}

	requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

/**
 * Set the next element to render.
 *
 * @param {Object} fiber The current tree to render
 */
function performUnitOfWork(fiber) {
	if (!fiber.dom) {
		fiber.dom = createDom(fiber);
	}

	const elements = fiber.props.children;
	reconcileChildren(fiber, elements);

	if (fiber.child) {
		return fiber.child;
	}
	let nextFiber = fiber;
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
	}
}

/**
 * Reconcile the old fibers with the new Elements
 *
 * @param {Object} wipFiber Element
 * @param {Object} elements Element's children
 */
function reconcileChildren(wipFiber, elements) {
	let index = 0;
	let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
	let prevSibling = null;

	while (index < elements.length || oldFiber != null) {
		const element = elements[index];
		let newFiber = null;

		const sameType = oldFiber && element && element.type == oldFiber.type;

		if (sameType) {
			newFiber = {
				type: oldFiber.type,
				props: element.props,
				dom: oldFiber.dom,
				parent: wipFiber,
				alternate: oldFiber,
				effectTag: 'UPDATE'
			};
		}
		if (element && !sameType) {
			newFiber = {
				type: element.type,
				props: element.props,
				dom: null,
				parent: wipFiber,
				alternate: null,
				effectTag: 'PLACEMENT'
			};
		}
		if (oldFiber && !sameType) {
			oldFiber.effectTag = 'DELETION';
			deletions.push(oldFiber);
		}

		if (oldFiber) {
			oldFiber = oldFiber.sibling;
		}

		if (index === 0) {
			wipFiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}

		prevSibling = newFiber;
		index++;
	}
}

exports.createElement = createElement;
exports.render = render;
