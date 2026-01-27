import * as THREE from 'three'

export default class InteractionBubble extends THREE.Object3D {
    bubble: THREE.Mesh
    dots: THREE.Mesh[]

    constructor() {
        super()

        // Main bubble (White box)
        const bubbleGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.1)
        const bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
        this.bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial)
        this.add(this.bubble)

        // Dots (3 small black boxes)
        this.dots = []
        const dotGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.06) // Slightly thicker to protrude
        const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true })

        for (let i = 0; i < 3; i++) {
            const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone()) // Clone material for individual opacity
            dot.position.set((i - 1) * 0.1, 0, 0.03) // Position relative to bubble center
            this.bubble.add(dot)
            this.dots.push(dot)
        }

        // Initially hidden
        this.visible = false
    }

    update(time: number) {
        if (!this.visible) return

        // Animate dots fading in and out in sequence
        const speed = 5
        this.dots.forEach((dot, index) => {
            const offset = index * 0.5
            // Sine wave for opacity: 0.2 to 1.0
            const alpha = 0.6 + 0.4 * Math.sin(time * speed + offset)
            if (dot.material instanceof THREE.MeshBasicMaterial) {
                dot.material.opacity = alpha
            }
        })

        // Float effect for the whole bubble
        this.bubble.position.y = Math.sin(time * 2) * 0.05
    }
}
