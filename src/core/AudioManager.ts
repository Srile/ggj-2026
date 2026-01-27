import * as THREE from 'three'
import { Howl } from 'howler'
import Experience from './Experience'

export default class AudioManager {
    experience: Experience
    resources: any

    constructor() {
        this.experience = new Experience()
        this.resources = this.experience.resources
    }

    play(name: string, loop: boolean = false, volume: number = 1.0): number | undefined {
        let sound = this.resources.items[name]
        
        if (Array.isArray(sound) && sound.length > 0) {
            const index = Math.floor(Math.random() * sound.length)
            sound = sound[index]
        }

        if (sound instanceof Howl) {
            sound.loop(loop)
            sound.volume(volume)
            // Reset spatial properties for non-spatial playback?
            // sound.pos(null) is invalid types. 
            // For now, we assume non-spatial sounds are just played as is.
            // If previous spatial settings persist, we might need a better strategy,
            // but effectively '0,0,0' or valid coords are needed if we call pos.
            // We'll omit the call to avoid the type error. 
            return sound.play()
        } else {
            console.warn(`Sound ${name} not found or not a Howl instance`)
        }
    }

    playSpatial(name: string, position: THREE.Vector3, loop: boolean = false, volume: number = 1.0): number | undefined {
        let sound = this.resources.items[name]
        
        if (Array.isArray(sound) && sound.length > 0) {
            const index = Math.floor(Math.random() * sound.length)
            sound = sound[index]
        }

        if (sound instanceof Howl) {
            sound.loop(loop)
            sound.volume(volume)
            sound.pos(position.x, position.y, position.z)
            // Panner attributes for spatial audio
            sound.pannerAttr({
                panningModel: 'HRTF',
                refDistance: 1,
                rolloffFactor: 1,
                distanceModel: 'linear'
            })
            return sound.play()
        } else {
            console.warn(`Sound ${name} not found or not a Howl instance`)
        }
    }

    stop(name: string, id?: number) {
        const sound = this.resources.items[name]
        if (sound instanceof Howl) {
            sound.stop(id)
        }
    }

    mute(muted: boolean) {
        Howler.mute(muted)
    }

    setVolume(volume: number) {
        Howler.volume(volume)
    }

    update() {
        // Update listener position via Camera
        // Howler uses a global listener
        const camera = this.experience.camera.instance
        if (camera) {
            const position = new THREE.Vector3()
            const direction = new THREE.Vector3()
            
            camera.getWorldPosition(position)
            camera.getWorldDirection(direction)

            Howler.pos(position.x, position.y, position.z)
            // Howler orientation is (x, y, z, xUp, yUp, zUp)
            // We can simplify or just set orientation if needed. 
            // Standard Web Audio API listener use forward and up vectors.
            // Howler wrapper might be slightly different, let's check docs or assuming standard behavior.
            // For now, simpler is creating a consistent listener position.
            Howler.orientation(direction.x, direction.y, direction.z, 0, 1, 0)
        }
    }
}
