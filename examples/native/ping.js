const LocalCourier = require("../../js/couriers/localCourier.js").default
const Lobby = require("../../js/signal/lobby.js").default
const Host = require("../../js/peers/host.js").default
const Guest = require("../../js/peers/guest.js").default
const using = require("../../js/utils/using.js").default

using(
	new Guest(),
	new LocalCourier(),
	new Host(),
	new LocalCourier()
)(async (guest, guestCourier, host, hostCourier) => {
	guest.events.on("connect", () => guest.send("ping"))
	host.events.on("connect", () => console.log(`Guest joined`))
	host.events.on("disconnect", () => console.log(`Guest left`))

	let guestPingPromise = new Promise(r => guest.events.on("receive", e => {
		console.log(`Received "${e.message}" from host`)
		r()
	}))

	let hostPingPromise = new Promise(r => host.events.on("receive", e => {
		console.log(`Received "${e.message}" from guest`)
		host.send("pong", [e.id])
		r()
	}))

	await using(new Lobby(hostCourier, host))(async lobby => {
		await lobby.ready()
		await Lobby.join(guestCourier, guest, lobby.code)
		await Promise.all([guestPingPromise, hostPingPromise])
	})
})