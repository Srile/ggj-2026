import * as THREE from 'three'
import Interactable from './Interactable'

export default class Character extends Interactable {
    constructor(object: THREE.Object3D) {
        super(object, 3, 0.5) // Distance 3, Angle ~36 deg
    }

    interact() {
        // Trigger dialogue
        // Access dialogue via the singleton instance
        this.experience.world.dialogue.show('welcome')
        
        // Lock camera
        // Calculate a position 2 units in front of the character (relative to its facing)
        const offset = new THREE.Vector3(0, 0, 1)
        offset.applyQuaternion(this.object.quaternion)
        this.experience.camera.lockToTarget(this.object, offset)
    }
}
