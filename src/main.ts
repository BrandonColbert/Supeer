import "source-map-support/register.js"
import readline from "readline"
import Commander from "./commands/core/commander.js"
import CreateCommand from "./commands/createCommand.js"
import ExitCommand from "./commands/exitCommand.js"
import HelpCommand from "./commands/helpCommand.js"
import PoolCommand from "./commands/poolCommand.js"
import Supeer from "./supeer.js"
import ScriptCommand from "./commands/scriptCommand.js"
import {RunCommand} from "./commands/runCommand.js"
import Buffered from "./utils/buffered.js"

//Cleanup on program exit
process.on("exit", () => Supeer.pool.removeAll())

//Create available commands
let commander = new Commander(
	HelpCommand,
	ExitCommand,
	ScriptCommand,
	RunCommand,
	CreateCommand,
	PoolCommand
)

//Load all config files then initialize user interaction
Supeer.Config.populate().then(async () => {
	let settings = Supeer.Config.get("settings")

	//Apply settings
	if(settings.chunkSize != null) {
		if(settings.chunkSize <= 0 || !Number.isInteger(settings.chunkSize))
			throw new Error("Chunk size must be positive, nonzero integer!")

		if(settings.chunkSize % 8 != 0)
			console.warn(`Chunk size should be a multiple of 8, but ${settings.chunkSize} is not...\n`)

		Buffered.defaultChunkSize = settings.chunkSize
	}

	//Prepare terminal for input processing
	let terminal = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true,
		history: settings?.autorun ?? [] //Add autorun commands to history
	})

	//Print welcome message if no additional command line arguments are specified
	if(process.argv.length <= 2) {
		console.log(`Supeer v${Supeer.Config.version}`)
		console.log("Type 'help' for a list of commands.")
		console.log()
	}

	//Execute autorun commands first
	if("autorun" in settings)
		await commander.run({echo: true}, ...settings.autorun)

	//Use additional command line arguments as keys for scripts to run
	if(process.argv.length > 2) {
		//Run each script specified script, ignoring invalid script keys
		for(let line of process.argv.slice(2)) {
			let commands = settings?.scripts?.[line]

			if(!commands) {
				console.error(`Unable to find script '${line}'`)
				continue
			}

			await commander.run(...commands)
		}
	}

	//Poll for commands
	terminal.on("line", async line => {
		if(!line)
			return

		console.log()
		await commander.run(line)
	})
})