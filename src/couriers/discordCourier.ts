import Discord from "discord.js"
import Supeer from "../supeer.js"
import Courier from "./courier.js"

/**
 * Creates connections through a Discord bot on a text channel
 */
export default class DiscordCourier extends Courier {
	private readonly token: string
	private readonly channelId: string
	private client: Discord.Client
	private channel: Discord.TextChannel
	readonly #ready: Promise<void>

	/**
	 * @param token Bot token
	 * @param channel Channel id
	 */
	public constructor(token: string, channelId: string) {
		super()
		this.token = token
		this.channelId = channelId
		this.client = new Discord.Client({intents: [
			Discord.Intents.FLAGS.GUILDS,
			Discord.Intents.FLAGS.GUILD_MESSAGES
		]})

		//Register listeners
		this.client.on("messageCreate", this.#onClientMessage)

		this.#ready = this.setup()
	}

	public override async ready(): Promise<void> {
		await this.#ready
	}

	public override discard(): void {
		//Remove event listeners
		this.client.removeListener("messageCreate", this.#onClientMessage)

		Supeer.console(this).log("Stopping...")

		//Notify discard
		this.events.fire("discard")

		//Destroy the client
		this.client.destroy()
		this.client = null
		this.channel = null
	}

	public override toString(): string {
		if(!this.client || !this.channel)
			return "*DiscordCourier"

		return `DiscordCourier[user=${this.client.user.username}, chan=${this.channel.id}]`
	}

	protected send(msg: string): void {
		this.channel.send(msg)
	}

	private async setup(): Promise<void> {
		//Log in to the discord client
		await new Promise<void>(async (resolve, reject) => {
			this.client.once("ready", async client => {
				let channel = await client.channels.fetch(this.channelId)
	
				if(!channel) {
					reject(`Unable to connect to channel '${this.channelId}'`)
					return
				}
	
				if(!(channel instanceof Discord.TextChannel)) {
					reject(`Expected text channel, but '${this.channelId}' is a ${channel.type} channel`)
					return
				}
	
				this.channel = channel
				resolve()
			})

			try {
				await this.client.login(this.token)
			} catch(e) {
				switch(typeof e) {
					case "string":
						reject(e)
						break
					default:
						if(e instanceof Error)
							reject(e.message)
						else
							reject("Discord courier failed to login")
						break
				}
			}
		})

		Supeer.console(this).log("Ready!")

		//Notify ready
		this.events.fire("ready")
	}

	#onClientMessage = (msg: Discord.Message) => {
		if(msg.author.id != this.client.user.id)
			return

		this.receive(msg.content)
	}
}