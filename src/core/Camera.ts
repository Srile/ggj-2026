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

    isLocked = false
    targetPosition: THREE.Vector3 | null = null
    targetLookAt: THREE.Vector3 | null = null

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
        this.instance.position.set(-1.5, 1.6, 1) 
        this.instance.rotation.order = 'YXZ'
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

    lockToTarget(target: THREE.Object3D, offset: THREE.Vector3) {
        this.isLocked = true
        // Position to stand at
        this.targetPosition = target.position.clone().add(offset)
        // Ensure Y is correct (standing height)
        this.targetPosition.y = 1.6 
        
        // Where to look at (the target object)
        this.targetLookAt = target.position.clone()
        // Maybe look at eye level
        this.targetLookAt.y = 1.5 
    }

    unlock() {
        this.isLocked = false
        this.targetPosition = null
        this.targetLookAt = null

        // Force update the rotation from quaternion to synchronize with PointerLockControls
        this.instance.rotation.setFromQuaternion(this.instance.quaternion)
    }

    update() {
        if (this.isLocked && this.targetPosition && this.targetLookAt) {
            const delta = this.experience.time.delta / 1000
            
            // Lerp Position
            this.instance.position.lerp(this.targetPosition, 5 * delta)
            
            // Lerp Rotation (via lookAt)
            // Ideally we'd slerp the quaternion, but repeatedly calling lookAt with lerped target might work
            // Or create a dummy target vector that lerps towards the real target
            
            // Simple approach: look at the target directly each frame (which changes as user moves)
            // But user is moving.
            
            // Better approach for smooth rotation:
            const targetQuaternion = new THREE.Quaternion()
            const currentQuaternion = this.instance.quaternion.clone()
            
            this.instance.lookAt(this.targetLookAt)
            targetQuaternion.copy(this.instance.quaternion)
            
            // Revert to current for slerp
            this.instance.quaternion.copy(currentQuaternion)
            this.instance.quaternion.slerp(targetQuaternion, 5 * delta)

            return
        }

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

            const oldPosition = this.instance.position.clone()

            this.controls.moveRight(-this.velocity.x * delta)
            this.controls.moveForward(-this.velocity.z * delta)
            
            // Check if potential new position is on navmesh
            if (this.experience.world && this.experience.world.navigationManager) {
                if (!this.experience.world.navigationManager.isSafe(this.instance.position)) {
                    // blocked
                    this.instance.position.copy(oldPosition)
                    this.velocity.x = 0
                    this.velocity.z = 0
                }
            }
            
            // Force Y to stay constant (standing height)
            // Note: PointerLockControls.moveForward/moveRight usually move on the XZ plane if the camera is upright,
            // but we ensure it here if needed. Actually moveForward in three.js PLC uses the camera's local forward vector
            // projects onto the XZ plane.
        }
    }
}

