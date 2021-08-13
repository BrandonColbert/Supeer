const socket = new WebSocket("ws://localhost:25560")

socket.onopen = () => {
	console.log("Opened")

	socket.send(JSON.stringify({
		type: "connect",
		info: "123"
	}))
}

socket.onmessage = e => console.log(JSON.parse(e.data))