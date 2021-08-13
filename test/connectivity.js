const {Writable} = require("stream")
const using = require("../js/utils/using.js").default
const DiscordCourier = require("../js/couriers/discordCourier.js").default
const LocalCourier = require("../js/couriers/localCourier.js").default
const SignalCourier = require("../js/couriers/signalCourier.js").default
const SignalServer = require("../js/signal/signalServer.js").default
const Host = require("../js/peers/host.js").default
const Guest = require("../js/peers/guest.js").default
const Lobby = require("../js/signal/lobby.js").default
const Supeer = require("../js/supeer.js").default
const promisify = require("../js/utils/promisify.js").default

const nullStream = new Writable({write: () => {}})
Supeer.Stream.out = nullStream
Supeer.Stream.err = nullStream

describe("Courier", () => {
	describe("Local", () => {
		it("transmits", done => {
			using(new LocalCourier(), new LocalCourier())((a, b) => new Promise(async r => {
				await a.ready()
				await b.ready()

				b.listen((_, data) => {
					if("hello".localeCompare(data) == 0)
						done()
					else
						done("Recieved incorrect data")

					r()
				})

				a.broadcast("hello")
			}))
		}).timeout(5000)
	})

	describe("Signal", () => {
		const hostname = "localhost"
		const port = 25580

		it("transmits", done => {
			using(
				new SignalServer(port),
				new SignalCourier(hostname, port),
				new SignalCourier(hostname, port)
			)((server, a, b) => new Promise(async r => {
				await server.ready()
				await a.ready()
				await b.ready()

				b.listen((_, data) => {
					if("hello".localeCompare(data) == 0)
						done()
					else
						done("Recieved incorrect data")

					r()
				})

				a.broadcast("hello")
			}))
		}).timeout(5000)
	})

	describe("Discord", () => {
		const token = "" //TODO: Insert your token for testing here
		const channelId = "" //TODO: Insert your channel id for testing here

		it("transmits", done => {
			using(
				new DiscordCourier(token, channelId),
				new DiscordCourier(token, channelId)
			)((a, b) => new Promise(async r => {
				await a.ready()
				await b.ready()

				b.listen((_, data) => {
					if("hello".localeCompare(data) == 0)
						done()
					else
						done("Recieved incorrect data")

					r()
				})

				a.broadcast("hello")
			}))
		}).timeout(60000)
	})
})

describe("Lobby", () => {
	it("connects", async () => {
		await using(
			new Host(),
			new LocalCourier(),
			new Guest(),
			new LocalCourier()
		)(async (host, hostCourier, guest, guestCourier) => {
			await hostCourier.ready()
			await guestCourier.ready()

			let connectPromise = Promise.all([
				new Promise(r => host.events.on("connect", () => r())),
				new Promise(r => guest.events.on("connect", () => r()))
			])

			await using(new Lobby(hostCourier, host))(async lobby => {
				await lobby.ready()
				await Lobby.join(guestCourier, guest, lobby.code)
			})

			await connectPromise
		})
	}).timeout(5000)

	describe("Peer", () => {
		it("transmits", async () => {
			using(
				new Guest(),
				new LocalCourier(),
				new Host(),
				new LocalCourier()
			)(async (guest, guestCourier, host, hostCourier) => {
				guest.events.on("connect", () => guest.send("ping"))
	
				let guestPingPromise = promisify(guest.events, guest.events.on, "recieve")
				let hostPingPromise = promisify(host.events, host.events.on, "recieve").then(() => {
					host.send("pong", [e.id])
				})
	
				await using(new Lobby(hostCourier, host))(async lobby => {
					await lobby.ready()
					await Lobby.join(guestCourier, guest, lobby.code)
					await Promise.all([guestPingPromise, hostPingPromise])
				})
			})
		})
	})
})