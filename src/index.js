import TinyReact from '../lib/tinyReact';

const container = document.getElementById('root');

const updateValue = e => {
	rerender(e.target.value);
};

const rerender = value => {
	const element = (
		<div id='foo'>
			<h1>What's your name ?</h1>
			<input onInput={updateValue} value={value} />
			<p>Your name is : {value}</p>
		</div>
	);
	TinyReact.render(element, container);
};

rerender('');
