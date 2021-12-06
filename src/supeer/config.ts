import fs from "fs"
import path from "path"
import _Settings from "./config/settings.js"
import Supeer from "../supeer.js"
import Buffered from "../utils/buffered.js"

/**
 * Defines configuration options for runtime
 */
export class Config {
	private static readonly registry: Map<string, any> = new Map<string, any>()

	/**
	 * Path to the config directory
	 */
	public static get path(): string {
		return `config`
	}

	/**
	 * Acquires the configuration information from each file the predefined config path
	 * 
	 * @throws When the config file could not be found
	 */
	public static async load(): Promise<void> {
		//Get all files in the config folder
		let files: string[]

		try {
			files = await getFiles(Config.path)
		} catch(e) {
			throw new Error(`Config directory at '${Config.path}' could not be read`)
		}

		//Parse all JSON files and store their content under the filename as the key
		for(let filePath of files) {
			let data = path.parse(filePath)

			if(data.ext != ".json")
				continue

			let key = data.name
			let value: any
			let content: string

			//Get file content
			try {
				content = await getFileContent(filePath)
			} catch(e) {
				throw new Error(`Configuration file '${data.name}' could not be read...`)
			}

			//Parse configuration object
			try {
				value = JSON.parse(content)
			} catch(e) {
				if(e instanceof SyntaxError)
					throw new Error(`Configuration file '${data.name}' contains invalid JSON!\n${e.message}`)
			}

			//Register object under filename
			this.registry.set(key, value)
		}

		let settings = Supeer.Config.get("settings")

		//Validate configuration
		Supeer.Config.Settings.applyDefaults(settings)
		Supeer.Config.Settings.validate(settings)
		Buffered.defaultChunkSize = settings.chunkSize
	}

	/**
	 * @param key Config filename
	 * @returns Content of the JSON file as an object
	 */
	public static get<T extends keyof Config.Files>(key: T): Config.Files[T] {
		return this.registry.get(key)
	}

	/**
	 * @param key Config filename
	 * @returns Whether the config file exists
	 */
	public static has(key: string): boolean {
		return this.registry.has(key)
	}
}

export namespace Config {
	/**
	 * Describes the expected content of each configuration file
	 */
	export interface Files {
		settings: Config.Settings
		rtc: RTCConfiguration
	}

	export type Settings = _Settings
	export const Settings = _Settings
}

/**
 * @param path Directory path
 * @returns Path to all files in a directory
 */
function getFiles(path: string): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => fs.readdir(path, (err, files) => {
		if(err)
			reject(err)
		else
			resolve(files.map(filename => `${path}/${filename}`))
	}))
}

/**
 * @param path File path
 * @returns The content of the file at the path
 */
function getFileContent(path: string): Promise<string> {
	return new Promise<string>((resolve, reject) => fs.readFile(path, (err, data) => {
		if(err)
			reject(err)
		else
			resolve(data.toString())
	}))
}

export default Config