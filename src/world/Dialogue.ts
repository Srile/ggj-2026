
export default class Dialogue {
    texts: any
    overlay: HTMLElement | null
    textElement: HTMLElement | null
    typingInterval: any
    isTyping: boolean

    constructor() {
        this.texts = {}
        this.overlay = document.getElementById('dialogue-container')
        this.textElement = document.getElementById('dialogue-text')
        this.typingInterval = null
        this.isTyping = false
    }

    setLanguage(json: any) {
        this.texts = json
    }

    show(id: string) {
        if (!this.texts[id] || !this.overlay || !this.textElement) return

        const text = this.texts[id]
        this.overlay.classList.remove('hidden')
        this.overlay.style.pointerEvents = 'auto' // Make sure it can be interacted with if needed
        this.typeText(text)
    }

    typeText(text: string) {
        if (this.isTyping) {
            clearInterval(this.typingInterval)
        }

        this.isTyping = true
        this.textElement!.innerHTML = ''
        let index = 0

        this.typingInterval = setInterval(() => {
            this.textElement!.innerHTML += text.charAt(index)
            index++

            if (index >= text.length) {
                clearInterval(this.typingInterval)
                this.isTyping = false
            }
        }, 50) // Typing speed
    }

    hide() {
        if (!this.overlay || !this.textElement) return
        
        this.overlay.classList.add('hidden')
        this.overlay.style.pointerEvents = 'none'
        this.textElement.innerHTML = ''
        clearInterval(this.typingInterval)
        this.isTyping = false
    }
}
