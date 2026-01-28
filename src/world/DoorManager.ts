import * as THREE from 'three'
import Experience from '../core/Experience'
import RoomManager from './RoomManager'

export default class DoorManager {
    experience: Experience
    scene: THREE.Scene
    roomManager: RoomManager
    
    doors: THREE.Object3D | null = null
    entrances: Map<string, THREE.Mesh> = new Map()
    
    // Bounds for collision detection
    box3: THREE.Box3 = new THREE.Box3()
    playerBox: THREE.Box3 = new THREE.Box3()
    
    // State
    lastTriggeredEntrance: THREE.Mesh | null = null
    isTransitioning = false

    constructor(roomManager: RoomManager) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.roomManager = roomManager
    }

    setLevel(levelModel: THREE.Object3D) {
        // Find Doors container
        const doorsNode = levelModel.getObjectByName('Doors')
        if (doorsNode) {
            this.doors = doorsNode
            
            // Find all entrances
            this.doors.traverse((child) => {
                if (child.name.startsWith('Entrance_') && child instanceof THREE.Mesh) {
                    this.entrances.set(child.name, child)
                    child.visible = false // Hide triggers
                    child.updateMatrixWorld(true)
                }
            })
            console.log(`DoorManager: Found ${this.entrances.size} entrances`)
        } else {
            console.warn('DoorManager: "Doors" node not found in level')
        }
    }

    update() {
        if (!this.experience.camera.instance) return
        if (this.isTransitioning) return
        
        // Define player bounds (approximate point or small box around camera)
        const playerPos = this.experience.camera.instance.position
        this.playerBox.setFromCenterAndSize(playerPos, new THREE.Vector3(0.5, 2, 0.5))

        let inAnyEntrance = false

        for (const [name, entrance] of this.entrances) {
            // Check intersection using Box3
            if (!entrance.geometry.boundingBox) entrance.geometry.computeBoundingBox()
            
            this.box3.copy(entrance.geometry.boundingBox!).applyMatrix4(entrance.matrixWorld)
            
            if (this.box3.intersectsBox(this.playerBox)) {
                inAnyEntrance = true
                
                if (this.lastTriggeredEntrance === entrance) {
                    // Still inside the entrance we just arrived at/triggered
                    continue
                }

                // New trigger!
                this.triggerEntrance(name, entrance)
                break 
            }
        }

        if (!inAnyEntrance) {
            this.lastTriggeredEntrance = null
        }
    }

    async triggerEntrance(name: string, _entrance: THREE.Mesh) {
        console.log(`Triggered ${name}`)
        
        // Parse name: Entrance_Source_Target (e.g. Entrance_0_1)
        const parts = name.split('_') // ["Entrance", "0", "1"]
        if (parts.length < 3) return

        const sourceId = parts[1]
        const targetId = parts[2]
        
        // Find sibling: Entrance_Target_Source (e.g. Entrance_1_0)
        const siblingName = `Entrance_${targetId}_${sourceId}`
        const sibling = this.entrances.get(siblingName)

        if (sibling) {
            // Disable Player Controls
            this.experience.camera.controls.enabled = false
            this.isTransitioning = true
            
            // Fade Out
            const overlay = document.getElementById('transition-overlay')
            if (overlay) overlay.classList.add('active')
            
            // Wait for fade
            await new Promise(resolve => setTimeout(resolve, 500))

            // Teleport Player
            const targetPos = new THREE.Vector3()
            sibling.getWorldPosition(targetPos) 
            
            this.experience.camera.teleport(targetPos)
            
            // Switch Room
            this.roomManager.setRoom(`Room_${targetId}`)
            
            // Set State
            this.lastTriggeredEntrance = sibling
            
            console.log(`Teleported to ${siblingName} (Room_${targetId})`)

            // Wait a frame or small delay to let things settle?
            await new Promise(resolve => setTimeout(resolve, 100))

            // Fade In
            if (overlay) overlay.classList.remove('active')
            
            // Enable Player Controls
            this.experience.camera.controls.enabled = true
            this.isTransitioning = false
            
        } else {
            console.warn(`Sibling entrance ${siblingName} not found!`)
        }
    }
}
