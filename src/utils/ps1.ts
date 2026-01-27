import * as THREE from 'three'

const RESOLUTION = new THREE.Vector2(320, 240)

export function enablePS1Style(scene: THREE.Scene) {
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            modifyMaterial(object.material)
        }
    })
}

function modifyMaterial(material: THREE.Material) {
    if (Array.isArray(material)) {
        material.forEach(modifyMaterial)
        return
    }

    // Clone to ensure we don't mess up shared materials if used elsewhere purely
    // But here we probably want to apply to everything.
    
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uResolution = { value: RESOLUTION }
        
        // Inject Vertex Jitter
        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            #include <project_vertex>
            
            // PS1 Style Jitter
            gl_Position.xyz /= gl_Position.w;
            gl_Position.xy = floor(gl_Position.xy * vec2(320.0, 240.0)) / vec2(320.0, 240.0);
            gl_Position.xyz *= gl_Position.w;
            `
        )
    }
    
    material.needsUpdate = true
}
