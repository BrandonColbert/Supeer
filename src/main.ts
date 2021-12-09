import "source-map-support/register.js"
import readline from "readline"
import {Console} from "console"
import Supeer from "./supeer.js"
import App from "./app.js"
import Metrics from "./utils/metrics.js"
import Commander from "./commands/core/commander.js"
import RunCommand from "./commands/runCommand.js"
import PoolCommand from "./commands/poolCommand.js"
import HelpCommand from "./commands/helpCommand.js"
import ExitCommand from "./commands/exitCommand.js"
import CreateCommand from "./commands/createCommand.js"
import ScriptCommand from "./commands/scriptCommand.js"
import ReloadCommand from "./commands/reloadCommand.js"

//Cleanup on program exit
process.on("exit", () => {
	Supeer.pool.events.forgetAll()
	Supeer.pool.removeAll()
})

//Get command line arguments
let scripts: string[] = []
let mainArgs: {
	/** Whether to use a TUI or not */
	headless?: boolean

	/** Whether to end the program when the pool becomes empty */
	closure?: boolean
} = Object.fromEntries(process
	.argv
	.slice(2)
	.map(arg => {
		if(arg.startsWith("--")) {
			arg = arg.slice(2)

			if(arg.indexOf("=") != -1) {
				let [key, value] = arg.split("=")
				return [key, value]
			} else
				return [arg, true]
		} else
			scripts.push(arg)

		return undefined
	})
	.filter(v => v)
)

//Close on pool finish if specified
if(mainArgs.closure)
	Supeer.pool.events.on("remove", () => {
		if(Supeer.pool.size > 0)
			return

		process.exit()
	})

//Create available commands
let commander = new Commander(
	HelpCommand,
	ExitCommand,
	ScriptCommand,
	ReloadCommand,
	RunCommand,
	CreateCommand,
	PoolCommand
)

//Load all config files then initialize user interaction
Supeer.Config.load().then(async () => {
	let settings = Supeer.Config.get("settings")

	let app: App
	let terminal: readline.Interface

	if(mainArgs.headless) {
		//Prepare terminal for input processing
		terminal = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: true,
			history: settings.autorun //Add autorun commands to history
		})
	} else {
		app = new App()

		Supeer.defaultConsole = new Console(
			app.createOutputStream(),
			app.createOutputErrorStream()
		)

		Supeer.Stream.out = app.createActivityStream()
		Supeer.Stream.err = app.createActivityErrorStream()

		Supeer.pool.events.on("update", () => app.pool.setContent(
			[...Supeer.pool]
			.map(k => {
				return `{bold}${k}{/}: ${Supeer.pool.get(k as any)}`
			})
			.join("\n")
		))
	}

	//Print welcome message if no immediate scripts are specified
	if(scripts.length == 0) {
		Supeer.console().log(`Supeer v${Supeer.version}`)
		Supeer.console().log("Type 'help' for a list of commands.")
		Supeer.console().log()
	}

	//Execute autorun commands first
	if("autorun" in settings)
		await commander.run({echo: true}, ...settings.autorun)

	//Use additional command line arguments as keys for scripts to run
	if(process.argv.length > 2) {
		//Run each script specified script, ignoring invalid script keys
		for(let script of scripts) {
			let commands = settings.scripts?.[script]

			if(!commands) {
				Supeer.console().error(`Unable to find script '${script}'`)
				continue
			}

			await commander.run(...commands)
		}
	}

	if(mainArgs.headless) {	
		//Poll for commands
		terminal.on("line", async line => {
			if(!line)
				return
	
			Supeer.console().log()
			await commander.run(line)
		})
	} else {
		app.input.on("submit", async (line: string) => {
			app.input.clearValue()

			if(!line)
				return

			await commander.run({echo: true}, line)

			app.input.readInput()
		})
		
		app.input.focus()
		
		function calculateMetrics(): void {
			let text = ""
			text += `Supeer: v${Supeer.version}\n`
			text += `Node:   ${process.version}\n`
			text += "\n"
			text += `CPU:    ${(Metrics.cpu * 100).toFixed(2)}%\n`
			text += `Memory: ${Metrics.memUsed.toFixed(1)} / ${Metrics.memTotal.toFixed(1)} MB\n`
			text += `Uptime: ${Metrics.uptime}`
		
			app.metrics.setContent(text)
			app.render()
		}

		calculateMetrics()
		setInterval(calculateMetrics, 1000)
	}
})