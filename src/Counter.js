import TinyReact from '../lib/tinyReact';

function Counter() {
	const [age, setAge] = TinyReact.useState(0);
	const decrement = () => setAge(age => (age > 0 ? age - 1 : age));
	const increment = () => setAge(age => age + 1);

	return (
		<div>
			<button onClick={decrement}>-</button>
			<span> {age} </span>
			<button onClick={increment}>+</button>
		</div>
	);
}

export default Counter;
