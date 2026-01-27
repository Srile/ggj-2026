import * as THREE from 'three'
import Experience from '../core/Experience'
import { enablePS1Style } from '../utils/ps1'
import Dialogue from './Dialogue'

export default class World {
    experience: Experience
    scene: THREE.Scene
    resources: any
    kitchen: any
    dialogue: Dialogue

    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.dialogue = new Dialogue()

        // Wait for resources
        this.resources.on('ready', () => {
            this.setKitchen()
            this.dialogue.setLanguage(this.resources.items.dialogue)
            // Test dialogue
            this.dialogue.show('welcome')
        })
        
        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
        this.scene.add(ambientLight)
    }

    setKitchen() {
        this.kitchen = this.resources.items.kitchen
        enablePS1Style(this.kitchen.scene)
        this.scene.add(this.kitchen.scene)
        this.kitchen.scene.scale.set(8, 8, 8)
    }

    update() {
        // Update logic for world objects here
    }
}
