import * as THREE from 'three'

const RESOLUTION = new THREE.Vector2(320, 240)

export function enablePS1Style(object: THREE.Object3D) {
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
                modifyMaterial(material);
                
                // Apply nearest filtering to all relevant maps for that sharp PS1 look
                const maps = ['map', 'alphaMap', 'normalMap', 'specularMap', 'emissiveMap', 'roughnessMap', 'metalnessMap'];
                maps.forEach(mapName => {
                    const map = (material as any)[mapName];
                    if (map && map instanceof THREE.Texture) {
                        map.minFilter = THREE.NearestFilter;
                        map.magFilter = THREE.NearestFilter;
                        map.needsUpdate = true;
                    }
                });
            });
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
