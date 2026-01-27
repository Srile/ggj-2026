import * as THREE from 'three'
import Experience from '../core/Experience'
import { enablePS1Style } from '../utils/ps1'
import Dialogue from './Dialogue'
import Lobotomite from './Lobotomite'
import Interactable from './Interactable'
import InteractionBubble from './InteractionBubble'
import NavigationManager from '../core/NavigationManager'

export default class World {
    experience: Experience
    scene: THREE.Scene
    resources: any
    kitchen: any
    lobotomite?: Lobotomite
    dialogue: Dialogue
    interactables: Interactable[]
    navigationManager: NavigationManager

    interactionBubble: InteractionBubble

    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.dialogue = new Dialogue()
        this.interactables = []

        // Wait for resources
        this.resources.on('ready', () => {
            this.setKitchen()
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

        this.navigationManager = new NavigationManager()
    }

    setKitchen() {
        this.kitchen = this.resources.items.kitchen
        enablePS1Style(this.kitchen.scene)
        this.scene.add(this.kitchen.scene)
        // this.kitchen.scene.scale.set(8, 8, 8)
        
        this.navigationManager.setLevel(this.kitchen.scene)
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
