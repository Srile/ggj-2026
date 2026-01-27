import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import Experience from './Experience'

export default class Camera {
    experience: Experience
    sizes: any
    scene: THREE.Scene
    canvas: HTMLCanvasElement
    instance!: THREE.PerspectiveCamera
    controls!: PointerLockControls
    
    // Movement
    moveForward = false
    moveBackward = false
    moveLeft = false
    moveRight = false
    velocity = new THREE.Vector3()
    direction = new THREE.Vector3()

    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas as HTMLCanvasElement

        this.setInstance()
        this.setControls()
        this.setEvents()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        )
        this.instance.position.set(-1.5, 1.7, 3) 
        this.instance.lookAt(0, 1, 0)
        this.scene.add(this.instance)
    }

    setControls() {
        this.controls = new PointerLockControls(this.instance, document.body)
    }

    setEvents() {
        this.experience.controls.on('input', (keys: any) => {
            this.moveForward = keys.forward
            this.moveBackward = keys.backward
            this.moveLeft = keys.left
            this.moveRight = keys.right
        })
        
        this.experience.controls.on('requestLock', () => {
            this.controls.lock()
        })
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        if (this.controls.isLocked) {
            const delta = this.experience.time.delta / 1000 // Convert to seconds
            
            // Damping (simulating friction)
            this.velocity.x -= this.velocity.x * 10.0 * delta
            this.velocity.z -= this.velocity.z * 10.0 * delta

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
            this.direction.normalize()

            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * 40.0 * delta
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * 40.0 * delta
            }

            this.controls.moveRight(-this.velocity.x * delta)
            this.controls.moveForward(-this.velocity.z * delta)
            
            // Force Y to stay constant (standing height)
            // Note: PointerLockControls.moveForward/moveRight usually move on the XZ plane if the camera is upright,
            // but we ensure it here if needed. Actually moveForward in three.js PLC uses the camera's local forward vector
            // projects onto the XZ plane.
        }
    }
}

