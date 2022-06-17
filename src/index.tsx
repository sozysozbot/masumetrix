import React from 'react';
import ReactDOM from 'react-dom/client';
import type * as CSS from 'csstype';
import './index.css';

type CellContent = { is_red: boolean, is_finalized: boolean } | null;

type SquareProps = { onClick: () => void, value: CellContent }

function Square(props: SquareProps): JSX.Element {
	if (props.value === null) {
		return (
			<button className="square" onClick={props.onClick}>
				{null}
			</button>
		);
	}
	const { is_red, is_finalized } = props.value
	const style: CSS.Properties = {
		color: is_red ? "rgb(234, 35, 0)" : "#000000"
	}

	const value = is_finalized ? "○" : "☆"

	return (
		<button className="square" onClick={props.onClick} style={style}>
			{value}
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
					{this.renderSquare(0 * 6 + 0)}
					{this.renderSquare(0 * 6 + 1)}
					{this.renderSquare(0 * 6 + 2)}
					{this.renderSquare(0 * 6 + 3)}
					{this.renderSquare(0 * 6 + 4)}
					{this.renderSquare(0 * 6 + 5)}
				</div>
				<div className="board-row">
					{this.renderSquare(1 * 6 + 0)}
					{this.renderSquare(1 * 6 + 1)}
					{this.renderSquare(1 * 6 + 2)}
					{this.renderSquare(1 * 6 + 3)}
					{this.renderSquare(1 * 6 + 4)}
					{this.renderSquare(1 * 6 + 5)}
				</div>
				<div className="board-row">
					{this.renderSquare(2 * 6 + 0)}
					{this.renderSquare(2 * 6 + 1)}
					{this.renderSquare(2 * 6 + 2)}
					{this.renderSquare(2 * 6 + 3)}
					{this.renderSquare(2 * 6 + 4)}
					{this.renderSquare(2 * 6 + 5)}
				</div>
				<div className="board-row">
					{this.renderSquare(3 * 6 + 0)}
					{this.renderSquare(3 * 6 + 1)}
					{this.renderSquare(3 * 6 + 2)}
					{this.renderSquare(3 * 6 + 3)}
					{this.renderSquare(3 * 6 + 4)}
					{this.renderSquare(3 * 6 + 5)}
				</div>
				<div className="board-row">
					{this.renderSquare(4 * 6 + 0)}
					{this.renderSquare(4 * 6 + 1)}
					{this.renderSquare(4 * 6 + 2)}
					{this.renderSquare(4 * 6 + 3)}
					{this.renderSquare(4 * 6 + 4)}
					{this.renderSquare(4 * 6 + 5)}
				</div>
				<div className="board-row">
					{this.renderSquare(5 * 6 + 0)}
					{this.renderSquare(5 * 6 + 1)}
					{this.renderSquare(5 * 6 + 2)}
					{this.renderSquare(5 * 6 + 3)}
					{this.renderSquare(5 * 6 + 4)}
					{this.renderSquare(5 * 6 + 5)}
				</div>
			</div>
		);
	}
}

type GameState = {
	history: { squares: CellContent[] }[],
	stepNumber: number,
	xIsNext: boolean,
	day: number,
}

class Game extends React.Component<{}, GameState> {
	constructor(props: {}) {
		super(props);
		this.state = {
			history: [{ squares: Array(36).fill(null) }],
			stepNumber: 0,
			xIsNext: true,
			day: 1,
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
		squares[i] = { is_red: true, is_finalized: false };
		this.setState({ history: history.concat([{ squares }]), xIsNext: !this.state.xIsNext, stepNumber: history.length })
	}


	render() {
		const history = this.state.history;
		const current = history[this.state.stepNumber];
		if (!current) {
			throw new Error("Invalid stepNumber");
		}
		const winner = calculateWinner(current.squares);

		const day = this.state.day;

		const day_str = `Day #${day}`;
		const status = winner ? `Winner: ${winner}` : `Choose the square(s) you want to take`;

		return (
			<div className="game">
				<div className="game-board">
					<Board squares={current.squares} onClick={(i: number) => this.handleClick(i)} />
				</div>
				<div className="game-info">
					<div>{day_str}</div>
					<div>{status}</div>
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