// He visto los tutoriales de Bruno Simon y estoy usando su repositorio: https://github.com/brunosimon/my-room-in-3d

import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const canvas = document.querySelector('.webgl')
const scene = new THREE.Scene()
const textureLoader = new THREE.TextureLoader()
let composer

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const params = {
    exposure: 1,
    bloomStrength: .4,
    bloomThreshold: .1,
    bloomRadius: 1
}

// Base camera
const camera = new THREE.PerspectiveCamera(10, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 18
camera.position.y = 8
camera.position.z = 20
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = true
controls.enablePan = true
controls.minDistance = 15
controls.maxDistance = 30
controls.minPolarAngle = Math.PI / 5
controls.maxPolarAngle = Math.PI / 2

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    // preserveDrawingBuffer: true, 
    // logarithmicDepthBuffer: true
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding


// Materials
const bakedTexture = textureLoader.load('/baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture,
    side: THREE.DoubleSide,
})

const candle = [ 'Sphere001', 'Sphere002', 'Sphere003']
const bubbles = ['Vela_Flama', 'Vela_Flama002', 'Vela_Flama003', 'Vela_Flama004', 'Vela_Flama005', 'Vela_Flama006', 'Vela_Flama007', 'Vela_Flama008', 'Vela_Flama009', 'Vela_Flama010', 'Vela_Flama018', 'Vela_Flama019', 'Vela_Flama020', 'Vela_Flama021', 'Vela_Flama022', 'Vela_Flama023', 'Vela_Flama024']


const candleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1.0 }, 
        delay: { value: 1.0 }, 
        colorSpeed: { value: 5.0 }, 
        baseColor: { value: new THREE.Color(0xFFD7BC) }
    },
    vertexShader: document.getElementById( 'vertexshaderCandle' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshaderCandle' ).textContent,
})


const bubbleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
    },
    vertexShader: document.getElementById( 'vertexshaderBubble' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshaderBubble' ).textContent,
})

const doorMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 10.0 },
        resolution: { value: new THREE.Vector2() },
      },
    vertexShader: document.getElementById( 'vertexshaderDoor' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshaderDoor' ).textContent,
})


//  Original code: https://codepen.io/aderaaij/details/BapYONL
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++) {
    new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() * 2) * 1,
        (Math.random() - 0.5) * 4
    ).toArray(positionArray, i * 3)

    scaleArray[i] = Math.random()
    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute("aScale", new THREE.BufferAttribute(scaleArray, 1))

const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 15 }
    },
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)


//Loader
new GLTFLoader().load( '/model.glb',
(gltf) => {
    const model = gltf.scene
        model.traverse( child => {
            child.material = bakedMaterial
            if (candle.includes(child.name)) child.material = candleMaterial 
            if (bubbles.includes(child.name)) child.material = bubbleMaterial
            if (child.name === 'Foto') child.material = doorMaterial
        })
        scene.add(model)
    },
    ( xhr ) => console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
)

composer = new EffectComposer( renderer)
const renderScene = new RenderPass( scene, camera )
composer.addPass( renderScene )

const bloomPass = new UnrealBloomPass( new THREE.Vector2( sizes.width, sizes.height ), 1.6, .1, .1 )
bloomPass.threshold = params.bloomThreshold
bloomPass.strength = params.bloomStrength
bloomPass.radius = params.bloomRadius
composer.addPass( bloomPass )

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(sizes.width, sizes.height)
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)

})


const clock = new THREE.Clock()

// Animation
const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    candleMaterial.uniforms.time.value += 0.075
    doorMaterial.uniforms.time.value += 0.1
    bubbleMaterial.uniforms.time.value += 0.035
    firefliesMaterial.uniforms.uTime.value = elapsedTime

    controls.update()
    // renderer.render(scene, camera)
    composer.render()
    window.requestAnimationFrame(tick)
}

tick()
