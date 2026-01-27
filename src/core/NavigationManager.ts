import * as THREE from 'three'

export default class NavigationManager {
    navmesh: THREE.Mesh | null = null
    raycaster: THREE.Raycaster
    downVector: THREE.Vector3

    constructor() {
        this.raycaster = new THREE.Raycaster()
        this.downVector = new THREE.Vector3(0, -1, 0)
    }

    setLevel(level: THREE.Object3D) {
        level.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('navmesh')) {
                this.navmesh = child
                // Hide navmesh if desired, or keep it visible for debug
                child.visible = false 
                console.log('Navmesh found:', child.name)
            }
        })
        
        if (!this.navmesh) {
            console.warn('No navmesh found in level')
        }
    }

    isSafe(position: THREE.Vector3): boolean {
        if (!this.navmesh) return true

        // Raycast from slightly above the position downwards
        const origin = position.clone()
        origin.y += 1.0 // Start 1 unit above intended floor position

        this.raycaster.set(origin, this.downVector)
        // Only checking against the navmesh
        const intersects = this.raycaster.intersectObject(this.navmesh)

        return intersects.length > 0
    }
}
