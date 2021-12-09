import os from "os"

export default abstract class Metrics {
	private static lastTotal: number
	private static lastProgram: number

	/**
	 * Percentage of CPU the program is using
	 */
	public static get cpu(): number {
		let total = os
			.cpus()
			.flatMap(cpu => Object.values(cpu.times))
			.reduce((a, b) => a + b, 0)

		let totalDiff = total - Metrics.lastTotal
	
		let {user, system} = process.cpuUsage()
		user /= 1000
		system /= 1000

		let prog = user + system
		let progDiff = prog - Metrics.lastProgram
	
		let proportion = progDiff / totalDiff

		Metrics.lastTotal = total
		Metrics.lastProgram = prog

		return isNaN(proportion) ? 0 : proportion
	}

	/**
	 * Memory used in megabytes
	 */
	public static get memUsed(): number {
		return process.memoryUsage().heapUsed / (1024 * 1024)
	}

	/**
	 * Total memory available in megabytes
	 */
	public static get memTotal(): number {
		return process.memoryUsage().heapTotal / (1024 * 1024)
	}

	/**
	 * Program uptime in ISO format
	 */
	public static get uptime(): string {
		let date = new Date(null)
		date.setSeconds(process.uptime())

		return date.toISOString().slice(11, -5)
	}
}