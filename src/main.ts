import "source-map-support/register.js"
import readline from "readline"
import BridgeCommand from "./commands/bridgeCommand.js"
import Commander from "./commands/core/commander.js"
import CreateCommand from "./commands/createCommand.js"
import ExitCommand from "./commands/exitCommand.js"
import HelpCommand from "./commands/helpCommand.js"
import PoolCommand from "./commands/poolCommand.js"
import ProxyCommand from "./commands/proxyCommand.js"
import RepeaterCommand from "./commands/repeaterCommand.js"
import SignalServerCommand from "./commands/signalServerCommand.js"
import Supeer from "./supeer.js"

//Create available commands
let commander = new Commander(
	CreateCommand,
	PoolCommand,
	ProxyCommand,
	BridgeCommand,
	RepeaterCommand,
	SignalServerCommand,
	ExitCommand,
	HelpCommand
)

//Prepare terminal for input processing
let terminal = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
})

//Load all config files then initialize user interaction
Supeer.Config.populate().then(async () => {
	if(process.argv.length > 2) {
		//If command line arguments are specified, run them immediately and don't show welcome message
		for(let line of process.argv.slice(2).join(" ").split(";"))
			await commander.execute(line.split(/\s+/g))
	} else {
		console.log("Super Peer!")
		console.log("Type 'help' for a list of commands.")
		console.log()
	}

	for(let command of Supeer.Config.get("settings")?.autorun) {
		try {
			console.log(command)
			await commander.execute(command.split(/\s+/g))
		} catch(err) {
			console.error(err)
			break
		}
	}

	//Poll for commands
	terminal.on("line", line => {
		if(!line)
			return

		console.log()
		commander.execute(line.split(/\s+/g))
	})
})