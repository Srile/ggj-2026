import * as THREE from 'three'
import Sizes from '../utils/Sizes'
import Time from '../utils/Time'
import Camera from './Camera'
import Renderer from './Renderer'
import World from '../world/World'
import Resources from '../utils/Resources'
import sources from '../sources'

let instance: Experience | null = null

export default class Experience {
    canvas: HTMLCanvasElement | undefined
    sizes!: Sizes
    time!: Time
    scene!: THREE.Scene
    camera!: Camera
    renderer!: Renderer
    resources!: Resources
    world!: World
    
    constructor(canvas?: HTMLCanvasElement) {
        // Singleton
        if (instance) {
            return instance
        }
        
        instance = this
        
        // Options
        this.canvas = canvas

        // Setup
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources(sources)
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.world = new World()

        // Sizes resize event
        this.sizes.on('resize', () => {
            this.resize()
        })

        // Time tick event
        this.time.on('tick', () => {
            this.update()
        })
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
    }

    update() {
        this.camera.update()
        this.world.update()
        this.renderer.update()
    }
}
