import * as THREE from 'three'
import Experience from '../core/Experience'
import NavigationManager from '../core/NavigationManager'
import { enablePS1Style } from '../utils/ps1'

export default class RoomManager {
    experience: Experience
    scene: THREE.Scene
    navigationManager: NavigationManager
    
    rooms: Map<string, THREE.Object3D> = new Map()
    currentRoom: THREE.Object3D | null = null

    constructor(navigationManager: NavigationManager) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.navigationManager = navigationManager
    }

    setLevel(levelModel: THREE.Object3D) {
        // Find all rooms
        levelModel.traverse((child) => {
            if (child.name.startsWith('Room_')) {
                this.rooms.set(child.name, child)
                child.visible = false // Hide initially
                
                // Enable PS1 style for everything in the room
                enablePS1Style(child)
                
                // Ensure matrix world is updated for proper positioning
                child.updateMatrixWorld(true)
            }
        })

        if (this.rooms.size === 0) {
            console.warn('No rooms found starting with "Room_" in level model')
            // Fallback: treat entire model as one room if no specific structure
            this.rooms.set('default', levelModel)
        }

        console.log(`RoomManager: Found ${this.rooms.size} rooms`)
    }

    setRoom(roomName: string) {
        const room = this.rooms.get(roomName)
        if (!room) {
            console.error(`RoomManager: Room "${roomName}" not found`)
            return
        }

        if (this.currentRoom) {
            this.currentRoom.visible = false
        }

        this.currentRoom = room
        this.currentRoom.visible = true
        
        // Update Navmesh
        this.navigationManager.setLevel(this.currentRoom)
        
        console.log(`RoomManager: Switched to ${roomName}`)
    }
}
