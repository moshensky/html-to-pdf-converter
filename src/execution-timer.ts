export class ExecutionTimer {
  start = process.hrtime()
  logs: { tag: string; time: [number, number] }[] = []

  log(tag: string, format: boolean = false) {
    const time = process.hrtime(this.start)
    this.logs.push({ tag, time })
    this.start = process.hrtime()

    return format ? `${tag}: ${this.format(time)}` : time
  }

  format(time: [number, number]) {
    return `${time[0]}s ${time[1] / 1000000}ms`
  }

  toString() {
    const NS_PER_SEC = 1e9
    const logs = this.logs.map(({ tag, time }) => `${tag}: ${this.format(time)}`)
    const total = this.logs.reduce(([s, n], { time: t }) => [s + t[0], n + t[1]], [0, 0]) as [
      number,
      number
    ]

    return logs.join('\n') + `\ntotal: ${(total[0] * NS_PER_SEC + total[1]) / NS_PER_SEC}s`
  }
}
