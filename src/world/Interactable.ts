import * as THREE from 'three'
import Experience from '../core/Experience'
import Camera from '../core/Camera'

export default abstract class Interactable {
    experience: Experience
    object: THREE.Object3D
    interactionDistance: number
    interactionAngle: number // Cosine of the angle (dot product threshold)
    localCenter: THREE.Vector3

    constructor(object: THREE.Object3D, distance: number = 2, angle: number = 0.5) {
        this.experience = new Experience()
        this.object = object
        this.interactionDistance = distance
        this.interactionAngle = angle

        // Calculate center relative to object base position
        const bbox = new THREE.Box3().setFromObject(this.object)
        this.localCenter = new THREE.Vector3()
        bbox.getCenter(this.localCenter)
        this.object.worldToLocal(this.localCenter)
    }

    abstract interact(): void

    canInteract(camera: Camera): boolean {
        // Get current world position of the interaction center
        const worldCenter = this.localCenter.clone().applyMatrix4(this.object.matrixWorld)

        // Distance check
        const distance = camera.instance.position.distanceTo(worldCenter)
        if (distance > this.interactionDistance) {
            return false
        }

        // Angle check (is the player looking at it?)
        const cameraDirection = new THREE.Vector3()
        camera.instance.getWorldDirection(cameraDirection)
        
        const objectDirection = new THREE.Vector3()
        objectDirection.subVectors(worldCenter, camera.instance.position).normalize()

        const dot = cameraDirection.dot(objectDirection)
        
        return dot > this.interactionAngle
    }
}
