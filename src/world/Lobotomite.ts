import * as THREE from 'three'
import Character from './Character'

export default class Lobotomite extends Character {
    mixer: THREE.AnimationMixer | null = null

    constructor(resource: any) {
        super(resource.scene)
        
        // Setup animation
        if(resource.animations && resource.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.object)
            const action = this.mixer.clipAction(resource.animations[0])
            action.play()
        }
    }

    update() {
        if (this.mixer) {
            this.mixer.update(this.experience.time.delta / 1000)
        }
    }
}
