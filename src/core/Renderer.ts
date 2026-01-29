import * as THREE from 'three'
import Experience from './Experience'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js'

export default class Renderer {
    experience: Experience
    canvas: HTMLCanvasElement
    sizes: any
    scene: THREE.Scene
    camera: any
    instance!: THREE.WebGLRenderer
    composer!: EffectComposer

    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas as HTMLCanvasElement
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera

        this.setInstance()
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false
        })
        
        // Tone mapping
        this.instance.toneMapping = THREE.CineonToneMapping
        this.instance.toneMappingExposure = 1.75
        
        // Shadows
        this.instance.shadowMap.enabled = false
        // this.instance.shadowMap.type = THREE.PCFSoftShadowMap

        this.instance.setClearColor('#211d20')
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)

        // Post Processing - PS1 Style
        this.composer = new EffectComposer(this.instance)
        const renderPixelatedPass = new RenderPixelatedPass(4, this.scene, this.camera.instance, {
            normalEdgeStrength: 0.3,
            depthEdgeStrength: 0.0
        })
        this.composer.addPass(renderPixelatedPass)

        // const glitchPass = new GlitchPass();
        // glitchPass.goWild = true;
        // this.composer.addPass(glitchPass)
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
        this.composer.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.composer.render()
    }
}
