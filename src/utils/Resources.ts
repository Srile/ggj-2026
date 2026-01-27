import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EventEmitter } from './EventEmitter'
import { Howl } from 'howler'

export default class Resources extends EventEmitter {
    sources: any[]
    items: { [key: string]: any }
    toLoad: number
    loaded: number
    loaders: any

    constructor(sources: any[]) {
        super()

        this.sources = sources
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        this.setLoaders()
        this.startLoading()
    }

    setLoaders() {
        this.loaders = {}
        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
        this.loaders.fileLoader = new THREE.FileLoader()
    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file: any) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file: any) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file: any) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'json') {
                this.loaders.fileLoader.load(
                    source.path,
                    (file: string) => {
                        this.sourceLoaded(source, JSON.parse(file))
                    }
                )
            } else if (source.type === 'audio') {
                const sound = new Howl({
                    src: [source.path],
                    preload: true,
                    onload: () => {
                        this.sourceLoaded(source, sound)
                    },
                    onloaderror: (id, error) => {
                        console.warn(`Failed to load sound ${source.path}:`, error)
                        this.sourceLoaded(source, sound)
                    }
                })
            } else if (source.type === 'audioSequence') {
                const sounds: Howl[] = []
                let loadedCount = 0
                const total = source.count
                
                // We'll increment global loaded only once the entire sequence is ready
                // Or easier: treat the sequence as one item in 'this.items', 
                // but we need to wait for all inner sounds to load.

                for (let i = 0; i <= total; i++) {
                    const sound = new Howl({
                        src: [`${source.path}${i}.${source.extension}`],
                        preload: true,
                        onload: () => {
                            loadedCount++
                            if (loadedCount === total) {
                                this.sourceLoaded(source, sounds)
                            }
                        },
                        onloaderror: (id, error) => {
                            console.warn(`Failed to load sound ${source.path}${i}.${source.extension}:`, error)
                            loadedCount++
                            if (loadedCount === total) {
                                this.sourceLoaded(source, sounds)
                            }
                        }
                    })
                    sounds.push(sound)
                }
            }
        }
    }

    sourceLoaded(source: any, file: any) {
        this.items[source.name] = file
        this.loaded++

        if (this.loaded === this.toLoad) {
            this.trigger('ready')
        }
    }
}
