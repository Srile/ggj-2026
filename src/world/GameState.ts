
let instance: GameState | null = null

export default class GameState {
    flags: Map<string, any> = new Map()

    constructor() {
        if (instance) {
            return instance
        }
        instance = this
    }

    setFlag(key: string, value: any) {
        this.flags.set(key, value)
    }

    getFlag(key: string) {
        return this.flags.get(key)
    }
}
