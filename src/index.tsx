import React from 'react';
import ReactDOM from 'react-dom/client';
import type * as CSS from 'csstype';
import './index.css';

const WIDTH = 6;
const HEIGHT = 6;

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
				{
					Array.from({ length: HEIGHT }).map(
						(_, a) =>
							<div className="board-row">
								{Array.from({ length: WIDTH }).map((_, b) => this.renderSquare(a * WIDTH + b))}
							</div>
					)
				}
			</div>
		);
	}
}

type GameState = {
	squares: CellContent[],
	stepNumber: number,
	day: number,
}

class Game extends React.Component<{}, GameState> {
	constructor(props: {}) {
		super(props);
		this.state = {
			squares: Array(36).fill(null),
			stepNumber: 0,
			day: 1,
		};
	}

	handleClick(i: number) {
		const current = this.state;
		const squares = current.squares.slice();
		const selected_squares = squares.reduce(
			(arr: number[], sq, i) => {
				if (sq !== null && !sq.is_finalized) { arr.push(i); }
				return arr
			}
			, []
		);
		if (!isSelectable(selected_squares, i) || squares[i]) return;
		squares[i] = { is_red: true, is_finalized: false };
		this.setState({ squares, })
	}

	submit() {

	}

	eraseAll() {
		const current = this.state;
		const squares = current.squares.slice();
		this.setState({ squares: squares.map(sq => (sq !== null && !sq.is_finalized) ? null : sq) });
	}


	render() {
		const current = this.state;
		// const winner = calculateWinner(current.squares);

		const day = this.state.day;

		const day_str = `Day #${day}`;
		const status = /*winner ? `Winner: ${winner}` :*/ `Choose the contiguous square(s) you want to take`;

		const buttons = current.squares.some(sq => sq !== null && !sq.is_finalized) ? [
			<li key={"submit"}>
				<button onClick={() => this.submit()}>{"submit"}</button>
			</li>,
			<li key={"erase_all"}>
				<button onClick={() => this.eraseAll()}>{"erase all"}</button>
			</li>
		] : [];

		return (
			<div className="game">
				<div className="game-board">
					<Board squares={current.squares} onClick={(i: number) => this.handleClick(i)} />
				</div>
				<div className="game-info">
					<div>{day_str}</div>
					<div>{status}</div>
					<ul>{buttons}</ul>
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

function isSelectable(indices: number[], i: number): boolean {
	if (indices.length === 0) {
		// まだ何も選択されていないなら、どこをクリックしても連結
		// If nothing is selected yet, click anywhere and it's contiguous
		return true;
	} else {
		return indices.some(ind => isNeighbor(ind, i))
	}
}

function isNeighbor(i1: number, i2: number) {
	const x1 = i1 % WIDTH;
	const y1 = (i1 - x1) / WIDTH;
	const x2 = i2 % WIDTH;
	const y2 = (i2 - x2) / WIDTH;

	return (
		Math.abs(x1 - x2) === 1 && Math.abs(y1 - y2) === 0
	) || (
			Math.abs(x1 - x2) === 0 && Math.abs(y1 - y2) === 1
		);
}
