import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

type CellContent = 'X' | 'O' | null;

type SquareProps = { onClick: () => void, value: CellContent }

function Square(props: SquareProps): JSX.Element {
	return (
		<button className="square" onClick={props.onClick}>
			{props.value}
		</button>
	);
}

type BoardProps = {
	squares: CellContent[],
	onClick: (i: number) => void,
};


class Board extends React.Component<BoardProps, {}> {
	renderSquare(i: number) {
		const content = this.props.squares[i];
		if (content === undefined) {
			throw new Error("Invalid index passed to renderSquare");
		}
		return (
			<Square
				value={content}
				onClick={() => this.props.onClick(i)}
			/>
		);
	}

	render() {
		return (
			<div>
				<div className="board-row">
					{this.renderSquare(0)}
					{this.renderSquare(1)}
					{this.renderSquare(2)}
				</div>
				<div className="board-row">
					{this.renderSquare(3)}
					{this.renderSquare(4)}
					{this.renderSquare(5)}
				</div>
				<div className="board-row">
					{this.renderSquare(6)}
					{this.renderSquare(7)}
					{this.renderSquare(8)}
				</div>
			</div>
		);
	}
}

type GameState = {
	history: { squares: CellContent[] }[],
	stepNumber: number,
	xIsNext: boolean,
}

class Game extends React.Component<{}, GameState> {
	constructor(props: {}) {
		super(props);
		this.state = {
			history: [{ squares: Array(9).fill(null) }],
			stepNumber: 0,
			xIsNext: true
		};
	}

	handleClick(i: number) {
		const history = this.state.history.slice(0, this.state.stepNumber + 1);
		const current = history[history.length - 1];
		if (!current) {
			throw new Error("Length of `history` became 0");
		}
		const squares = current.squares.slice();
		if (calculateWinner(squares) || squares[i]) return;
		squares[i] = this.state.xIsNext ? 'X' : 'O';
		this.setState({ history: history.concat([{ squares }]), xIsNext: !this.state.xIsNext, stepNumber: history.length })
	}

	jumpTo(step: number) {
		this.setState({
			stepNumber: step,
			xIsNext: (step % 2) === 0,
		})
	}

	render() {
		const history = this.state.history;
		const current = history[this.state.stepNumber];
		if (!current) {
			throw new Error("Invalid stepNumber");
		}
		const winner = calculateWinner(current.squares);

		const moves = history.map((step, move: number) => {
			const desc = move ? 'Go to move #' + move : 'Go to game start';
			return (
				<li key={move}>
					<button onClick={() => this.jumpTo(move)}>{desc}</button>
				</li>
			);
		});

		const status = winner ? `Winner: ${winner}` : `Next player: ${this.state.xIsNext ? 'X' : 'O'}`;

		return (
			<div className="game">
				<div className="game-board">
					<Board squares={current.squares} onClick={(i: number) => this.handleClick(i)} />
				</div>
				<div className="game-info">
					<div>{status}</div>
					<ol>{moves}</ol>
				</div>
			</div>
		);
	}
}

// ========================================

const rootDOM = document.getElementById("root");
if (!rootDOM) { throw new Error("Cannot find an HTML element with id `root`") }

const root = ReactDOM.createRoot(rootDOM);
root.render(<Game />);

function calculateWinner(squares: ReadonlyArray<CellContent>) {
	const lines: [number, number, number][] = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];
	for (const [a, b, c] of lines) {
		if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
			return squares[a];
		}
	}
	return null;
}