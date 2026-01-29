import { EventEmitter } from '../utils/EventEmitter'
import Experience from './Experience'

export default class Controls extends EventEmitter {
    experience: Experience
    keys: { [key: string]: boolean }
    enabled: boolean

    constructor() {
        super()

        this.experience = new Experience()

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false,
            inventory: false
        }
        this.enabled = true

        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event)
        })

        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event)
        })
        
        // Listen on canvas for lock request
        if(this.experience.canvas) {
            this.experience.canvas.addEventListener('click', () => {
                this.trigger('requestLock')
            })
        }
    }

    handleKeyDown(event: KeyboardEvent) {
        if (!this.enabled) {
            // Allow dialogue navigation even when movement is disabled
            // But blocking movement keys
            switch (event.code) {
                case 'AccessoryButton1':
                case 'Enter':
                case 'Space':
                case 'KeyE':
                    this.trigger('interact')
                    break
                case 'KeyI':
                case 'Escape':
                    this.trigger('inventory')
                    break
                case 'ArrowUp':
                case 'KeyW':
                    this.trigger('navigateUp')
                    break
                case 'ArrowDown':
                case 'KeyS':
                    this.trigger('navigateDown')
                    break
                case 'ArrowLeft':
                case 'KeyA':
                    this.trigger('navigateLeft')
                    break
                case 'ArrowRight':
                case 'KeyD':
                    this.trigger('navigateRight')
                    break
            }
            return
        }

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.forward = true
                break
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true
                break
            case 'ArrowDown':
            case 'KeyS':
                this.keys.backward = true
                break
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true
                break
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = true
                break
            case 'AccessoryButton1':
            case 'Enter':
            case 'Space':
            case 'KeyE':
                this.trigger('interact')
                break
            case 'KeyI':
            case 'Escape':
                this.trigger('inventory')
                break
        }

        this.trigger('input', [this.keys])
    }

    handleKeyUp(event: KeyboardEvent) {
        // Always listen to keyup to prevent stuck keys if disabled mid-press
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.forward = false
                break
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false
                break
            case 'ArrowDown':
            case 'KeyS':
                this.keys.backward = false
                break
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false
                break
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = false
                break
        }

        this.trigger('input', [this.keys])
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled
        if (!enabled) {
            // Reset keys
            this.keys.forward = false
            this.keys.backward = false
            this.keys.left = false
            this.keys.right = false
            this.keys.shift = false
        this.trigger('input', [this.keys])
        }
    }

    update() {
        
    }
}
