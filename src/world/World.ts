import * as THREE from 'three'
import Experience from '../core/Experience'
import Dialogue from './Dialogue'
import Lobotomite from './Lobotomite'
import Interactable from './Interactable'
import InteractionBubble from './InteractionBubble'
import NavigationManager from '../core/NavigationManager'
import RoomManager from './RoomManager'
import DoorManager from './DoorManager'

export default class World {
    experience: Experience
    scene: THREE.Scene
    resources: any
    levels: any
    lobotomite?: Lobotomite
    dialogue: Dialogue
    interactables: Interactable[]
    navigationManager: NavigationManager
    roomManager: RoomManager
    doorManager: DoorManager

    interactionBubble: InteractionBubble

    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.dialogue = new Dialogue()
        this.interactables = []
        this.navigationManager = new NavigationManager()
        this.roomManager = new RoomManager(this.navigationManager)
        this.doorManager = new DoorManager(this.roomManager)

        // Wait for resources
        this.resources.on('ready', () => {
            this.setLevels()
            this.dialogue.setLanguage(this.resources.items.dialogue)
            // Test dialogue
            // this.dialogue.show('welcome') // Removed auto-show for test
            this.setCharacter()
        })
        
        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
        this.scene.add(ambientLight)

        // Listen for interaction
        this.experience.controls.on('interact', () => {
            this.handleInteract()
        })

        // Interaction Bubble
        this.interactionBubble = new InteractionBubble()
        this.scene.add(this.interactionBubble)
    }

    setLevels() {
        this.levels = this.resources.items.levels
        // Add the whole scene but room manager will hide/show parts
        this.scene.add(this.levels.scene)
        
        // Setup Managers
        this.roomManager.setLevel(this.levels.scene)
        this.doorManager.setLevel(this.levels.scene)
        
        // Start in Room 0
        this.roomManager.setRoom('Room_0')
    }

    setCharacter() {
        const resource = this.resources.items.lobotomite
        this.lobotomite = new Lobotomite(resource)
        this.scene.add(this.lobotomite.object)
        this.lobotomite.object.position.set(-1.5, 0, -3)

        this.interactables.push(this.lobotomite)
    }

    handleInteract() {
        // If dialogue is open, don't trigger new interactions (let dialogue handle it)
        if (!this.dialogue.overlay?.classList.contains('hidden')) return

        // Interaction Cooldown (prevent re-opening immediately after closing)
        if (this.experience.time.current - this.dialogue.lastCloseTime < 500) return

        for (const interactable of this.interactables) {
            if (interactable.canInteract(this.experience.camera)) {
                interactable.interact()
                break // Interact with one at a time
            }
        }
    }

    update() {
        if (this.lobotomite)
            this.lobotomite.update()
        
        if (this.doorManager)
            this.doorManager.update()

        // Check for interactables to show bubble
        if (this.dialogue.overlay && !this.dialogue.overlay.classList.contains('hidden')) {
             this.interactionBubble.visible = false
             return
        }

        let closestInteractable = null
        for (const interactable of this.interactables) {
            if (interactable.canInteract(this.experience.camera)) {
                closestInteractable = interactable
                break
            }
        }

        if (closestInteractable) {
            this.interactionBubble.visible = true
            // Position above the interactable's center
            const worldCenter = closestInteractable.localCenter.clone().applyMatrix4(closestInteractable.object.matrixWorld)
            this.interactionBubble.position.copy(worldCenter)
            this.interactionBubble.position.y += 1.2 // Offset
            
            // Make bubble face camera
            this.interactionBubble.lookAt(this.experience.camera.instance.position)

            this.interactionBubble.update(this.experience.time.elapsed / 1000)
        } else {
            this.interactionBubble.visible = false
        }
    }
}
