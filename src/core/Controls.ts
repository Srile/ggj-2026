import { EventEmitter } from '../utils/EventEmitter'
import Experience from './Experience'

export default class Controls extends EventEmitter {
    experience: Experience
    keys: { forward: boolean, backward: boolean, left: boolean, right: boolean }

    constructor() {
        super()
        this.experience = new Experience()
        
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        }

        window.addEventListener('keydown', (event) => this.onKeyDown(event))
        window.addEventListener('keyup', (event) => this.onKeyUp(event))
        
        // Listen on canvas for lock request
        if(this.experience.canvas) {
            this.experience.canvas.addEventListener('click', () => {
                this.trigger('requestLock')
            })
        }
    }

    onKeyDown(event: KeyboardEvent) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true
                break
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true
                break
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true
                break
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true
                break
        }
    }

    onKeyUp(event: KeyboardEvent) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false
                break
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false
                break
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false
                break
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false
                break
        }
    }

    update() {
        // We trigger 'input' every frame with the current state
        this.trigger('input', [this.keys])
    }
}
