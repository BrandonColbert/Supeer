import blessed from "blessed"
import {Writable} from "stream"

export class App {
	/** Used to execute commands */
	public input: blessed.Widgets.TextboxElement

	/** Shows direct command execution output */
	public output: blessed.Widgets.Log

	/** Shows the activity of objects in the pool */
	public activity: blessed.Widgets.Log

	/** Shows various metrics on how the program is performing */
	public metrics: blessed.Widgets.BoxElement

	/** Displays all objects in the pool */
	public pool: blessed.Widgets.BoxElement

	private screen: blessed.Widgets.Screen

	public constructor() {
		this.screen = blessed.screen({
			smartCSR: true,
			tabSize: 4,
			dockBorders: true,
			title: "Supeer"
		})

		this.input = blessed.textbox({
			...this.baseOptions,
			parent: this.screen,
			label: "Console",
			top: 0,
			left: 0,
			width: "30%",
			height: 3,
			scrollable: true
		})

		this.output = blessed.log({
			...this.baseOptions,
			parent: this.screen,
			top: 2,
			left: 0,
			width: "30%",
			height: "100%-2",
			scrollable: true
		})

		this.activity = blessed.log({
			...this.baseOptions,
			parent: this.screen,
			label: "Activity",
			top: 0,
			left: "30%",
			width: "70%",
			height: "100%-8",
			scrollable: true
		})

		this.metrics = blessed.box({
			...this.baseOptions,
			parent: this.screen,
			label: "Metrics",
			top: "100%-8",
			left: "30%",
			width: "35%",
			height: 8
		})

		this.pool = blessed.box({
			...this.baseOptions,
			parent: this.screen,
			label: "Pool",
			top: "100%-8",
			left: "65%",
			width: "35%",
			height: 8,
			scrollable: true
		})

		this.listen()
	}

	private get baseOptions(): blessed.Widgets.BoxOptions {
		return {
			border: "line",
			scrollable: false,
			vi: true,
			keys: true,
			mouse: true,
			input: true,
			inputOnFocus: true,
			focusable: true,
			tags: true,
			padding: {
				left: 1,
				right: 1,
			},
			scrollbar: {
				style: {
					bg: "blue"
				},
				track: {
					bg: "white"
				}
			}
		}
	}

	public destroy(): void {
		this.screen.destroy()
	}

	public render(): void {
		this.screen.render()
	}

	public createOutputStream(): Writable {
		return new Writable({
			write: (chunk: Buffer, _, callback) => {
				this.output.log(blessed.escape(chunk.toString()))
				callback()
			}
		})
	}

	public createOutputErrorStream(): Writable {
		return new Writable({
			write: (chunk: Buffer, _, callback) => {
				this.output.log(`{red-fg}${blessed.escape(chunk.toString())}{/}`)
				callback()
			}
		})
	}

	public createActivityStream(): Writable {
		return new Writable({
			write: (chunk: Buffer, _, callback) => {
				this.activity.log(blessed.escape(chunk.toString()))
				callback()
			}
		})
	}

	public createActivityErrorStream(): Writable {
		return new Writable({
			write: (chunk: Buffer, _, callback) => {
				this.activity.log(`{red-fg}${blessed.escape(chunk.toString())}{/}`)
				callback()
			}
		})
	}

	private listen(): void {
		this.screen.key("C-c", () => process.exit())
	}
}

export default App