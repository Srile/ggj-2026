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
    
    // Temporary helper vectors to avoid GC in update loop
    private _startPos = new THREE.Vector3()
    private _endPos = new THREE.Vector3()
    private _moveDelta = new THREE.Vector3()
    private _validDelta = new THREE.Vector3()
    private _candidatePos = new THREE.Vector3()
    private _finalDelta = new THREE.Vector3()
    private _scaledDelta = new THREE.Vector3()
    private _candidateScaled = new THREE.Vector3()

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

        this.controls.enabled = false;
    }

    unlock() {
        this.isLocked = false
        this.targetPosition = null
        this.targetLookAt = null

        this.controls.enabled = true;

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
            this.velocity.x -= this.velocity.x * 15.0 * delta
            this.velocity.z -= this.velocity.z * 15.0 * delta

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
            this.direction.normalize()

            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * 40.0 * delta
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * 40.0 * delta
            }

            this._startPos.copy(this.instance.position)

            // Apply movement to get potential new position
            this.controls.moveRight(-this.velocity.x * delta)
            this.controls.moveForward(-this.velocity.z * delta)
            
            // Calculate world-space delta
            this._endPos.copy(this.instance.position)
            this._moveDelta.subVectors(this._endPos, this._startPos)
            
            // Revert to start
            this.instance.position.copy(this._startPos)

            // Validation with sliding
            if (this.experience.world && this.experience.world.navigationManager) {
                const intendedDist = this._moveDelta.length()
                this._validDelta.set(0, 0, 0)

                // Try X movement
                this._candidatePos.copy(this.instance.position)
                this._candidatePos.x += this._moveDelta.x
                if (this.experience.world.navigationManager.isSafe(this._candidatePos)) {
                    this._validDelta.x = this._moveDelta.x
                }

                // Try Z movement (from potentially new X position or original if X blocked)
                this._candidatePos.copy(this.instance.position)
                this._candidatePos.x += this._validDelta.x // Apply valid X change if any
                this._candidatePos.z += this._moveDelta.z
                if (this.experience.world.navigationManager.isSafe(this._candidatePos)) {
                    this._validDelta.z = this._moveDelta.z
                }

                // Apply valid movement
                this._finalDelta.copy(this._validDelta)
                const validDist = this._finalDelta.length()

                // Speed Normalization: If we are sliding (one axis blocked) and still moving, 
                // try to maintain original speed
                if (validDist > 0 && validDist < intendedDist) {
                    this._scaledDelta.copy(this._finalDelta).normalize().multiplyScalar(intendedDist)
                    // Verify scaled position is safe
                    this._candidateScaled.copy(this.instance.position).add(this._scaledDelta)
                    if (this.experience.world.navigationManager.isSafe(this._candidateScaled)) {
                        this._finalDelta.copy(this._scaledDelta)
                    }
                }

                this.instance.position.add(this._finalDelta)
                
                // Note: We don't zero velocity here anymore because it interferes with sliding smoothness
                // The velocity damping in the next frame handles deceleration naturally
            } else {
                // If no navigation manager, just allow movement
                this.instance.position.copy(this._endPos)
            }
            
            // Force Y to stay constant (standing height)
            // Note: PointerLockControls.moveForward/moveRight usually move on the XZ plane if the camera is upright,
            // but we ensure it here if needed. Actually moveForward in three.js PLC uses the camera's local forward vector
            // projects onto the XZ plane.
        }
    }

    teleport(position: THREE.Vector3) {
        this.instance.position.copy(position)
        this._startPos.copy(position)
        this._endPos.copy(position)
        this.velocity.set(0, 0, 0)
    }
}

