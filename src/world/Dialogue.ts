import GameState from './GameState'
import Experience from '../core/Experience'

export default class Dialogue {
    experience: Experience
    gameState: GameState
    texts: any
    
    // UI Elements
    overlay: HTMLElement | null
    textElement: HTMLElement | null
    arrowElement: HTMLElement | null
    choicesElement: HTMLElement | null

    // State
    typingInterval: any
    isTyping: boolean
    currentId: string | null
    currentTextObject: any
    selectedChoiceIndex: number
    lastCloseTime: number

    constructor() {
        this.experience = new Experience()
        this.gameState = new GameState()
        this.texts = {}
        
        // UI
        this.overlay = document.getElementById('dialogue-container')
        this.textElement = document.getElementById('dialogue-text')
        this.arrowElement = document.getElementById('dialogue-arrow')
        this.choicesElement = document.getElementById('dialogue-choices')

        this.typingInterval = null
        this.isTyping = false
        this.currentId = null
        this.currentTextObject = null
        this.selectedChoiceIndex = 0
        this.lastCloseTime = 0

        // Input
        this.experience.controls.on('interact', () => {
            this.handleInteract()
        })
        
        this.experience.controls.on('navigateUp', () => {
            this.handleNavigate(-1)
        })

        this.experience.controls.on('navigateDown', () => {
            this.handleNavigate(1)
        })
    }

    setLanguage(json: any) {
        this.texts = json
    }

    show(id: string) {
        if (!this.texts[id] || !this.overlay || !this.textElement) return

        this.currentId = id
        this.currentTextObject = this.texts[id]

        // Handle Logic Nodes
        if (this.currentTextObject.type === 'logic') {
            const flagValue = this.gameState.getFlag(this.currentTextObject.condition)
            const nextId = flagValue ? this.currentTextObject.true : this.currentTextObject.false
            this.show(nextId)
            return
        }

        // Disable movement
        this.experience.controls.setEnabled(false)

        // Prepare UI
        this.overlay.classList.remove('hidden')
        this.overlay.style.pointerEvents = 'auto'
        if(this.arrowElement) this.arrowElement.classList.add('hidden')
        if(this.choicesElement) {
            this.choicesElement.classList.add('hidden')
            this.choicesElement.innerHTML = '' // Clear previous choices
        }

        this.typeText(this.currentTextObject.text)
    }

    typeText(text: string) {
        if (this.isTyping) {
            clearInterval(this.typingInterval)
        }

        this.isTyping = true
        this.textElement!.innerHTML = ''
        let index = 0

        this.typingInterval = setInterval(() => {
            const char = text.charAt(index)
            this.textElement!.innerHTML += char
            index++

            // Play mumble sound
            if (index % 2 === 0 && char !== ' ') {
                const voice = this.currentTextObject.voice || 'beep_mind'
                this.experience.audioManager.play(voice)
            }

            if (index >= text.length) {
                this.finishTyping()
            }
        }, 30)
    }

    finishTyping() {
        clearInterval(this.typingInterval)
        this.isTyping = false
        if (this.textElement && this.currentTextObject) {
            this.textElement.innerHTML = this.currentTextObject.text
        }

        // Show choices if available
        if (this.currentTextObject.choices) {
            this.showChoices()
        } 
        // Show arrow if there is a next step (or just an end)
        else if(this.arrowElement) {
            this.arrowElement.classList.remove('hidden')
        }
    }

    showChoices() {
        if (!this.choicesElement) return

        this.choicesElement.classList.remove('hidden')
        this.selectedChoiceIndex = 0 // Reset selection

        this.currentTextObject.choices.forEach((choice: any, index: number) => {
            const button = document.createElement('button')
            button.innerText = choice.text
            button.classList.add('choice-button')
            if (index === 0) button.classList.add('selected')
            
            button.addEventListener('click', () => {
                this.show(choice.next)
            })
            
            // Mouse hover support
            button.addEventListener('mouseenter', () => {
                this.selectedChoiceIndex = index
                this.updateChoiceSelection()
            })

            this.choicesElement!.appendChild(button)
        })
    }

    updateChoiceSelection() {
        if (!this.choicesElement) return
        const buttons = this.choicesElement.querySelectorAll('.choice-button')
        buttons.forEach((btn, index) => {
            if (index === this.selectedChoiceIndex) {
                btn.classList.add('selected')
            } else {
                btn.classList.remove('selected')
            }
        })
    }

    handleNavigate(direction: number) {
        if (!this.currentTextObject?.choices || this.isTyping || !this.choicesElement) return
        
        const count = this.currentTextObject.choices.length
        this.selectedChoiceIndex = (this.selectedChoiceIndex + direction + count) % count
        this.updateChoiceSelection()
    }

    handleInteract() {
        // If hidden, do nothing
        if (this.overlay?.classList.contains('hidden')) return

        if (this.isTyping) {
            this.finishTyping()
            return
        }

        this.experience.audioManager.play('ui_click')
        
        // Handle choice selection with interact key
        if (this.currentTextObject?.choices) {
            const nextId = this.currentTextObject.choices[this.selectedChoiceIndex].next
            this.show(nextId)
            return
        }

        this.progress()
    }

    progress() {
        if (this.currentTextObject && this.currentTextObject.next) {
            this.show(this.currentTextObject.next)
        } else {
            this.hide()
        }
    }

    hide() {
        if (!this.overlay || !this.textElement) return
        
        // Enable movement
        this.experience.controls.setEnabled(true)
        // Unlock camera target (stop lerping)
        this.experience.camera.unlock()

        this.overlay.classList.add('hidden')
        this.overlay.style.pointerEvents = 'none'
        this.textElement.innerHTML = ''
        if(this.arrowElement) this.arrowElement.classList.add('hidden')
        if(this.choicesElement) this.choicesElement.classList.add('hidden')
        
        clearInterval(this.typingInterval)
        this.isTyping = false
        this.currentId = null
        this.currentTextObject = null
        this.lastCloseTime = this.experience.time.current
    }
}
