import Discord from "discord.js"
import promisify from "../utils/promisify.js"
import Courier from "./courier.js"

/**
 * Creates connections through a Discord bot on a text channel
 */
export default class DiscordCourier extends Courier {
	private client: Discord.Client
	private channel: Discord.TextChannel
	private loggedIn: Promise<void>

	/**
	 * @param token Bot token
	 * @param channel Channel id
	 */
	public constructor(token: string, channelId: string) {
		super()

		this.client = new Discord.Client({intents: [
			Discord.Intents.FLAGS.GUILDS,
			Discord.Intents.FLAGS.GUILD_MESSAGES
		]})

		this.client.on("messageCreate", msg => {
			if(msg.author.id != this.client.user.id)
				return

			this.recieve(msg.content)
		})

		this.loggedIn = new Promise<void>(async (resolve, reject) => {
			try {
				await this.client.login(token)
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

			await promisify(this.client, this.client.once, "ready")

			let channel = await this.client.channels.fetch(channelId)

			if(!channel) {
				reject(`Unable to connect to channel '${channelId}'`)
				return
			}

			if(!(channel instanceof Discord.TextChannel)) {
				reject(`Expected text channel, but '${channelId}' is a ${channel.type} channel`)
				return
			}

			this.channel = channel
			resolve()
		})
	}

	public override async ready(): Promise<void> {
		await super.ready()
		await this.loggedIn
	}

	public override discard(): void {
		this.client.destroy()
	}

	public override toString(): string {
		if(!this.client || !this.channel)
			return "*DiscordCourier"

		return `DiscordCourier[user=${this.client.user.username}, chan=${this.channel.id}]`
	}

	protected send(msg: string): void {
		this.channel.send(msg)
	}
}