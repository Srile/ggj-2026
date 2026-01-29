import { EventEmitter } from '../utils/EventEmitter'

export default class VideoManager extends EventEmitter {
    videos: { [key: string]: HTMLVideoElement }

    constructor() {
        super()

        this.videos = {}

        const videoIds = ['facerip-video', 'facewear-video']

        videoIds.forEach(id => {
            const video = document.getElementById(id) as HTMLVideoElement
            if (video) {
                this.videos[id] = video
                
                // Ensure hidden and paused
                video.style.display = 'none'
                video.pause()
                video.currentTime = 0

                // Event listener
                video.addEventListener('ended', () => {
                    this.onVideoEnded(id)
                })
            } else {
                console.warn(`Video element with id '${id}' not found.`)
            }
        })
    }

    play(id: string) {
        const video = this.videos[id]
        if (video) {
            video.style.display = 'block'
            video.currentTime = 0
            
            video.play().catch((error) => {
                console.error(`Error playing video ${id}:`, error)
                // If play fails, maybe we should still end it to avoid stuck state?
                // For now, let's just log.
            })
        }
    }

    onVideoEnded(id: string) {
        const video = this.videos[id]
        if (video) {
            video.style.display = 'none'
            video.pause() // Just in case
        }
        this.trigger('videoEnded', [id])
    }
}
