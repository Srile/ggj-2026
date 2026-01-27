import * as THREE from 'three'
import Experience from '../core/Experience'
import { enablePS1Style } from '../utils/ps1'

export default class World {
    experience: Experience
    scene: THREE.Scene
    resources: any
    kitchen: any

    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {
            this.setKitchen()
        })
        
        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
        directionalLight.position.set(5, 5, 5)
        this.scene.add(directionalLight)
    }

    setKitchen() {
        this.kitchen = this.resources.items.kitchen
        enablePS1Style(this.kitchen.scene)
        this.scene.add(this.kitchen.scene)
    }

    update() {
        // Update logic for world objects here
    }
}
