const readline = require("readline")
const Host = require("../../js/peers/host.js").default
const Guest = require("../../js/peers/guest.js").default
const Lobby = require("../../js/signal/lobby.js").default
const SignalCourier = require("../../js/couriers/signalCourier.js").default
const SignalServer = require("../../js/signal/signalServer.js").default

const port = 25587

let term = readline.createInterface(process.stdin, process.stdout)

term.question("Host or guest? ", async answer => {
	switch(answer.toLocaleLowerCase()) {
		case "host": {
			const server = new SignalServer(port)
			await server.ready()

			let host = new Host()
			host.events.on("connect", () => console.log(`Guest joined`))
			host.events.on("disconnect", () => console.log(`Guest left`))
			host.events.on("receive", e => console.log(`\nGuest: ${e.message}`))

			let lobby = new Lobby(new SignalCourier("localhost", port), host)
			await lobby.ready()
			console.log(`Lobby: ${lobby.code}\n`)

			function loop() {
				term.question("You: ", msg => {
					host.send(msg)
					loop()
				})
			}

			loop()
			break
		}
		case "guest": {
			let guest = new Guest()
			guest.events.on("connect", () => console.log("Joined host"))
			guest.events.on("disconnect", () => console.log("Left host"))
			guest.events.on("receive", e => console.log(`\nHost: ${e.message}`))

			let code = await new Promise(r => term.question("Lobby: ", answer => r(parseInt(answer))))
			await Lobby.join(new SignalCourier("localhost", port), guest, code)
			console.log("")

			function loop() {
				term.question("You: ", msg => {
					guest.send(msg)
					loop()
				})
			}

			loop()
			break
		}
		default:
			console.log("Invalid response...")
			break
	}
})