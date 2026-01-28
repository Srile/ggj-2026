import Experience from '../core/Experience'

export default class Inventory {
    experience: Experience
    
    // UI Elements
    container: HTMLElement | null
    inventoryPanel: HTMLElement | null
    facePreview: HTMLElement | null
    inventoryGrid: HTMLElement | null
    closeBtn: HTMLElement | null
    tabs: NodeListOf<Element>

    // Face Layers
    eyesLayer: HTMLImageElement | null
    noseLayer: HTMLImageElement | null
    mouthLayer: HTMLImageElement | null

    // State
    isOpen: boolean = false
    currentCategory: 'eyes' | 'nose' | 'mouth' = 'eyes'
    
    items: any = {
        eyes: [
            'ui_eyes_black.webp',
            'ui_eyes_blue.webp',
            'ui_eyes_gold.webp'
        ],
        nose: [
            'ui_nose_crooked.webp',
            'ui_nose_one-nostril.webp',
            'ui_nose_perfect.webp'
        ],
        mouth: [
            'ui_mouth_big.webp',
            'ui_mouth_charismatic.webp',
            'ui_mouth_goth.webp'
        ]
    }

    constructor() {
        this.experience = new Experience()

        // Get Elements
        this.container = document.getElementById('face-swapper-container')
        this.inventoryPanel = document.getElementById('inventory-panel')
        this.facePreview = document.getElementById('face-preview')
        this.inventoryGrid = document.getElementById('inventory-grid')
        // this.toggleBtn = document.getElementById('toggle-face-swapper') // Removed
        this.closeBtn = document.getElementById('close-inventory-btn')
        this.tabs = document.querySelectorAll('.tab-btn')

        this.eyesLayer = document.getElementById('face-eyes') as HTMLImageElement
        this.noseLayer = document.getElementById('face-nose') as HTMLImageElement
        this.mouthLayer = document.getElementById('face-mouth') as HTMLImageElement

        // Setup Listeners
        if (this.container) {
            this.container.addEventListener('click', (_) => {
                // If closed, open it. 
                // Don't close if clicking inside while open, unless it's close button (handled separately)
                if (this.container?.classList.contains('closed')) {
                    this.open()
                }
            })
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation() // Prevent bubbling to container click
                this.close()
            })
        }

        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = (e.target as HTMLElement).dataset.category as 'eyes' | 'nose' | 'mouth'
                this.setCategory(category)
            })
        })

        // Initial setup
        this.setCategory('eyes')
        this.setupDragAndDrop()
    }

    open() {
        if (this.isOpen) return
        this.isOpen = true
        this.container?.classList.remove('closed')
        this.experience.controls.setEnabled(false)
    }

    close() {
        this.isOpen = false
        this.container?.classList.add('closed')
        this.experience.controls.setEnabled(true)
    }

    setCategory(category: 'eyes' | 'nose' | 'mouth') {
        this.currentCategory = category
        
        // Update tabs
        this.tabs.forEach(tab => {
            if ((tab as HTMLElement).dataset.category === category) {
                tab.classList.add('active')
            } else {
                tab.classList.remove('active')
            }
        })

        // Populate Grid
        if (this.inventoryGrid) {
            this.inventoryGrid.innerHTML = ''
            this.items[category].forEach((item: string) => {
                const itemEl = document.createElement('div')
                itemEl.classList.add('inventory-item')
                itemEl.draggable = true
                
                const img = document.createElement('img')
                img.src = `/face/${item}`
                itemEl.appendChild(img)

                // Drag Events
                itemEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer?.setData('text/plain', JSON.stringify({ category, item }))
                })
                
                // Click to equip
                itemEl.addEventListener('click', () => {
                   this.equip(category, item)
                })

                this.inventoryGrid?.appendChild(itemEl)
            })
        }
    }

    setupDragAndDrop() {
        if (!this.facePreview) return

        this.facePreview.addEventListener('dragover', (e) => {
            e.preventDefault() 
        })

        this.facePreview.addEventListener('drop', (e) => {
            e.preventDefault()
            const data = e.dataTransfer?.getData('text/plain')
            if (data) {
                const { category, item } = JSON.parse(data)
                this.equip(category, item)
            }
        })
    }

    equip(category: 'eyes' | 'nose' | 'mouth', item: string) {
        let layer: HTMLImageElement | null = null

        switch (category) {
            case 'eyes':
                layer = this.eyesLayer
                break
            case 'nose':
                layer = this.noseLayer
                break
            case 'mouth':
                layer = this.mouthLayer
                break
        }

        if (layer) {
            layer.src = `/face/${item}`
            layer.classList.remove('hidden')
        }
    }
}
