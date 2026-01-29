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
    hasChanged: boolean = false
    currentCategory: 'eyes' | 'nose' | 'mouth' = 'eyes'
    categories: ('eyes' | 'nose' | 'mouth')[] = ['eyes', 'nose', 'mouth']
    
    focusedArea: 'tabs' | 'grid' | 'close' = 'grid'
    focusedIndex: number = 0

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
                this.focusedArea = 'tabs' // If clicked, focus tabs
                this.updateSelection()
            })
        })

        // Initial setup
        this.setCategory('eyes')
        this.setupDragAndDrop()

        this.experience.controls.on('inventory', () => {
            if (this.isOpen) {
                this.close()
            } else {
                this.open()
            }
        })

        this.setupInput()
    }

    setupInput() {
        this.experience.controls.on('navigateUp', () => {
            if (!this.isOpen) return
            if (this.focusedArea === 'grid') {
                if (this.focusedIndex < 3) {
                    this.focusedArea = 'tabs'
                } else {
                    this.focusedIndex -= 3
                }
            } else if (this.focusedArea === 'close') {
                this.focusedArea = 'grid'
                // Ensure index is valid for current category
                const maxIndex = this.items[this.currentCategory].length - 1
                if (this.focusedIndex > maxIndex) {
                    this.focusedIndex = maxIndex
                }
            }
            this.updateSelection()
        })

        this.experience.controls.on('navigateDown', () => {
            if (!this.isOpen) return
            if (this.focusedArea === 'tabs') {
                this.focusedArea = 'grid'
                this.focusedIndex = 0
            } else if (this.focusedArea === 'grid') {
                const maxIndex = this.items[this.currentCategory].length - 1
                if (this.focusedIndex + 3 <= maxIndex) {
                    this.focusedIndex += 3
                } else {
                    // Navigate to close/confirm button if at bottom
                    this.focusedArea = 'close'
                }
            }
            this.updateSelection()
        })

        this.experience.controls.on('navigateLeft', () => {
            if (!this.isOpen) return
            if (this.focusedArea === 'tabs') {
                const currentIdx = this.categories.indexOf(this.currentCategory)
                const newIdx = (currentIdx - 1 + this.categories.length) % this.categories.length
                this.setCategory(this.categories[newIdx])
            } else if (this.focusedArea === 'grid') {
                if (this.focusedIndex % 3 !== 0) {
                    this.focusedIndex--
                }
            }
            this.updateSelection()
        })

        this.experience.controls.on('navigateRight', () => {
            if (!this.isOpen) return
            if (this.focusedArea === 'tabs') {
                const currentIdx = this.categories.indexOf(this.currentCategory)
                const newIdx = (currentIdx + 1) % this.categories.length
                this.setCategory(this.categories[newIdx])
            } else if (this.focusedArea === 'grid') {
                const maxIndex = this.items[this.currentCategory].length - 1
                if ((this.focusedIndex + 1) % 3 !== 0 && this.focusedIndex < maxIndex) {
                    this.focusedIndex++
                }
            }
            this.updateSelection()
        })

        this.experience.controls.on('interact', () => {
            if (!this.isOpen) return
            if (this.focusedArea === 'grid') {
                const item = this.items[this.currentCategory][this.focusedIndex]
                if (item) {
                    this.equip(this.currentCategory, item)
                }
            } else if (this.focusedArea === 'close') {
                this.close()
            }
        })
    }

    updateSelection() {
        // Clear styles
        this.tabs.forEach(tab => tab.classList.remove('focused'))
        if (this.inventoryGrid) {
            Array.from(this.inventoryGrid.children).forEach(child => child.classList.remove('selected'))
        }
        if (this.closeBtn) {
            this.closeBtn.classList.remove('focused')
        }

        if (this.focusedArea === 'tabs') {
            const currentTab = Array.from(this.tabs).find(t => (t as HTMLElement).dataset.category === this.currentCategory)
            if (currentTab) currentTab.classList.add('focused')
        } else if (this.focusedArea === 'grid') {
            if (this.inventoryGrid && this.inventoryGrid.children[this.focusedIndex]) {
                this.inventoryGrid.children[this.focusedIndex].classList.add('selected')
            }
        } else if (this.focusedArea === 'close') {
            if (this.closeBtn) {
                this.closeBtn.classList.add('focused')
            }
        }
    }

    open() {
        if (this.isOpen) return
        this.isOpen = true
        this.container?.classList.remove('closed')
        this.experience.controls.setEnabled(false)
        // Unlock pointer to stop camera movement and allow interactions
        this.experience.camera.controls.unlock()
        
        this.experience.audioManager.play('ui_whoosh')
        this.hasChanged = false
        
        // Reset selection
        this.focusedArea = 'grid'
        this.focusedIndex = 0
        this.updateSelection()
    }

    close() {
        this.isOpen = false
        this.container?.classList.add('closed')
        this.experience.controls.setEnabled(true)
        // Re-lock pointer
        this.experience.camera.controls.lock()

        this.experience.audioManager.play('ui_whoosh')
        if (this.hasChanged) {
            this.experience.videoManager.play('facewear-video')
        }
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

        this.experience.audioManager.play('ui_click')

        // Populate Grid
        if (this.inventoryGrid) {
            this.inventoryGrid.innerHTML = ''
            this.items[category].forEach((item: string, index: number) => {
                const itemEl = document.createElement('div')
                itemEl.classList.add('inventory-item')
                itemEl.draggable = true
                
                const img = document.createElement('img')
                img.src = `face/${item}`
                itemEl.appendChild(img)

                // Drag Events
                itemEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer?.setData('text/plain', JSON.stringify({ category, item }))
                })
                
                // Click to equip
                itemEl.addEventListener('click', () => {
                   this.focusedArea = 'grid'
                   this.focusedIndex = index
                   this.updateSelection()
                   this.equip(category, item)
                })

                this.inventoryGrid?.appendChild(itemEl)
            })
            // If we are in grid mode, we need to ensure selection checks range
            if (this.focusedArea === 'grid') {
                 if (this.focusedIndex >= this.items[category].length) {
                     this.focusedIndex = this.items[category].length - 1
                 }
                 this.updateSelection()
            }
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

        this.experience.audioManager.play('ui_meat')
        this.hasChanged = true

        if (layer) {
            if (layer.src.includes(item) && !layer.classList.contains('hidden')) {
                layer.classList.add('hidden')
            } else {
                layer.src = `face/${item}`
                layer.classList.remove('hidden')
            }
        }
    }
}

