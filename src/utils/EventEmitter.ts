export class EventEmitter {
    callbacks: { [key: string]: Function[] } = {}

    constructor() {
        this.callbacks = {}
    }

    on(_names: string, callback: Function) {
        // Errors
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong names')
            return false
        }

        if (typeof callback === 'undefined') {
            console.warn('wrong callback')
            return false
        }

        // Resolve names
        const names = _names.split(' ')

        names.forEach((_name) => {
            // Resolve name
            const name = _name

            // Create namespace if not exist
            if (!(this.callbacks[name] instanceof Array))
                this.callbacks[name] = []

            // Add callback
            this.callbacks[name].push(callback)
        })

        return this
    }

    off(_names: string) {
        // Errors
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong names')
            return false
        }

        // Resolve names
        const names = _names.split(' ')

        names.forEach((_name) => {
            // Resolve name
            const name = _name

            // Remove namespace
            if (this.callbacks[name] instanceof Array)
                delete this.callbacks[name]
        })

        return this
    }

    trigger(_name: string, _args: any[] = []) {
        // Errors
        if (typeof _name === 'undefined' || _name === '') {
            console.warn('wrong name')
            return false
        }

        let finalResult: any = null
        let result = null

        // Default args
        const args = !(_args instanceof Array) ? [] : _args

        // Resolve names (dot on specific namespace)
        let name = _name

        // Resolve callbacks
        if (this.callbacks[name] instanceof Array) {
            this.callbacks[name].forEach((callback) => {
                result = callback.apply(this, args)

                if (typeof finalResult === 'undefined') {
                    finalResult = result
                }
            })
        }
        
        return finalResult
    }
}
