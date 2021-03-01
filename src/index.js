import TinyReact from '../lib/tinyReact';

const element = (
	<div id='foo'>
		<h1>Hello !</h1>
		<p>Here you can render some basic JSX !</p>
		<p>Everything is interactive !</p>
	</div>
);

const container = document.getElementById('root');
TinyReact.render(element, container);
