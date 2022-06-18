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

type BoardDisplayProps = {
	squares: CellContent[],
};

class BoardDisplay extends React.Component<BoardDisplayProps, {}> {
	renderSquare(i: number) {
		const content = this.props.squares[i];
		if (content === undefined) {
			throw new Error("Invalid index passed to renderSquare");
		}
		return (
			<Square
				value={content}
				onClick={() => { }}
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
	day: number,
	mode: "edit" | "after_submission_waiting_for_opponent" | "after_gameset",
	claimed_by_opponent: null,
	whether_to_finalize: null
} | {
	squares: CellContent[],
	day: number,
	mode: "compare_and_ask_for_finalize",
	claimed_by_opponent: number[],
	whether_to_finalize: { me: boolean, opponent: boolean }
}

const getSelectedSquares = (squares: CellContent[]) => squares.reduce(
	(arr: number[], sq, i) => {
		if (sq !== null && !sq.is_finalized) { arr.push(i); }
		return arr
	}
	, []
);

class Game extends React.Component<{}, GameState> {
	constructor(props: {}) {
		super(props);
		this.state = {
			squares: Array(WIDTH * HEIGHT).fill(null),
			day: 1,
			mode: "edit",
			claimed_by_opponent: null,
			whether_to_finalize: null,
		};
	}

	handleClick(i: number) {
		const current = this.state;
		if (current.mode !== "edit") { return; }
		const squares = current.squares.slice();
		const selected_squares = getSelectedSquares(squares);
		if (!isSelectable(selected_squares, i) || squares[i]) return;
		squares[i] = { is_red: true, is_finalized: false };
		this.setState({ squares })
	}

	finalize() {
		if (this.state.mode !== "compare_and_ask_for_finalize") { return; }
		let squares = this.state.squares.slice();
		if (this.state.whether_to_finalize.me) {
			for (const sq of squares) {
				if (sq !== null && !sq.is_finalized) {
					sq.is_finalized = true;
				}
			}
		} else {
			squares = removeNonfinalized(squares);
		}

		if (this.state.whether_to_finalize.opponent) {
			for (const ind of this.state.claimed_by_opponent) {
				squares[ind] = { is_red: false, is_finalized: true }
			}
		}

		this.setState({ mode: "edit", claimed_by_opponent: null, whether_to_finalize: null, squares, day: this.state.day + 1 })
	}

	compare_and_ask_for_finalize(me: number[], opponent: number[]) {
		const whether_to_finalize = (() => {
			if (opponent.every(s => !me.includes(s)) && me.every(s => !opponent.includes(s))) {
				return { me: true, opponent: true }
			} else {
				return { me: me.length < opponent.length, opponent: opponent.length < me.length };
			}
		})();
		this.setState({ mode: "compare_and_ask_for_finalize", claimed_by_opponent: opponent, whether_to_finalize })
	}

	submit_claim() {
		this.setState({ mode: "after_submission_waiting_for_opponent" });
		const me = getSelectedSquares(this.state.squares);

		// どこに置いたかの情報は bot に漏れてはいけないので、検閲する
		// We must censor the nonfinalized squares because the bot is not supposed to know that
		const censored_squares = removeNonfinalized(this.state.squares);
		setTimeout(() => {
			this.compare_and_ask_for_finalize(me, botSubmission(censored_squares))
		}, Math.random() * 5000 + 1000);
	}

	eraseAll() {
		const current = this.state;
		const squares = current.squares.slice();
		this.setState({ squares: removeNonfinalized(squares) });
	}


	render() {
		const current = this.state;
		// const winner = calculateWinner(current.squares);

		const day = this.state.day;

		const day_str = `Day #${day}`;
		const status = {
			edit: `Choose the contiguous square(s) you want to take`,
			after_submission_waiting_for_opponent: `Waiting for the opponent to submit...`,
			compare_and_ask_for_finalize: `Comparing the two players' submission:`,
			after_gameset: `Winner is ${undefined}`
		}[current.mode];

		const buttons = current.mode === "edit" && current.squares.some(sq => sq !== null && !sq.is_finalized) ? [
			<li key={"submit"}>
				<button onClick={() => this.submit_claim()}>{"submit"}</button>
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

				{current.mode === "compare_and_ask_for_finalize" ?
					<div id="compare_and_finalize">
						Your claim:
						<div className="game-board">
							<BoardDisplay squares={current.squares} />
						</div>

						Opponent's claim:
						<div className="game-board">
							<BoardDisplay squares={
								addOpponentsNonfinalized(removeNonfinalized(current.squares), current.claimed_by_opponent)
							} />
						</div>

						{
							current.whether_to_finalize.me ?
								(current.whether_to_finalize.opponent ? "Both gets what's claimed" : "Only you get what's' claimed") :
								(current.whether_to_finalize.opponent ? "Only the opponent gets what's claimed" : "Neither gets what's claimed")
						}

						<button onClick={() => this.finalize()}>{"Ok"}</button>
					</div> : []
				}
			</div>
		);
	}
}

// ========================================

const rootDOM = document.getElementById("root");
if (!rootDOM) { throw new Error("Cannot find an HTML element with id `root`") }

const root = ReactDOM.createRoot(rootDOM);
root.render(<Game />);

function addOpponentsNonfinalized(squares: ReadonlyArray<CellContent>, inds: number[]): CellContent[] {
	const sqs = squares.slice();
	for (const ind of inds) {
		sqs[ind] = { is_red: false, is_finalized: false };
	}
	return sqs;
}

function removeNonfinalized(squares: ReadonlyArray<CellContent>): CellContent[] {
	return squares.map(sq => (sq !== null && !sq.is_finalized) ? null : sq)
}

function isSelectable(indices: ReadonlyArray<number>, i: number): boolean {
	if (indices.length === 0) {
		// まだ何も選択されていないなら、どこをクリックしても連結
		// If nothing is selected yet, click anywhere and it's contiguous
		return true;
	} else {
		if (indices.includes(i)) return false;
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


function botSubmission(squares: ReadonlyArray<CellContent>): number[] {
	const rand = Math.random();
	const attempted_number = rand < 0.2 ? 1 : rand < 0.5 ? 2 : rand < 0.9 ? 3 : 4;
	try {
		const initial_square = (() => {
			for (let i = 0; i < 200; i++) {
				const ind = Math.random() * WIDTH * HEIGHT | 0;
				if (!squares[ind]) return ind;
			}
			throw new Error("Can't find an empty square");
		})();
		const ans = [initial_square];

		outer: for (let j = 0; j < attempted_number - 1; j++) {
			for (let i = 0; i < 200; i++) {
				const ind = Math.random() * WIDTH * HEIGHT | 0;
				if (!isSelectable(ans, ind) || squares[ind]) {
					continue;
				};
				ans.push(ind); continue outer;
			}
			break;
		}
		return ans;
	} catch (e: unknown) { return []; }
}