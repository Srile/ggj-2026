import './style.css'
import Experience from './core/Experience.ts'

const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement
new Experience(canvas)
