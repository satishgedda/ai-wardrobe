import { useRef, useState } from 'react'
import { Check, FileImage, LoaderCircle, RotateCcw, Trash2, UploadCloud, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { getApiError } from '../../lib/api-client'
import { useWardrobeStore } from '../../store/wardrobe-store'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function createQueueItem(file) {
  return { id: `${file.name}-${file.lastModified}-${Math.random()}`, file, status: 'ready', progress: 0, error: '' }
}

function WardrobeUploader() {
  const [queue, setQueue] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)
  const uploadItem = useWardrobeStore((state) => state.uploadItem)

  function addFiles(fileList) {
    const incoming = Array.from(fileList).map((file) => {
      if (!ACCEPTED_TYPES.has(file.type)) return { ...createQueueItem(file), status: 'error', error: 'Use JPG, JPEG, PNG, or WEBP.' }
      if (file.size > MAX_FILE_SIZE) return { ...createQueueItem(file), status: 'error', error: 'Images must be 10 MB or smaller.' }
      return createQueueItem(file)
    })
    setQueue((currentQueue) => [...currentQueue, ...incoming])
  }

  function updateQueueItem(id, updates) {
    setQueue((currentQueue) => currentQueue.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  async function uploadQueueItem(item) {
    updateQueueItem(item.id, { status: 'uploading', progress: 0, error: '' })
    try {
      await uploadItem(item.file, (progress) => updateQueueItem(item.id, { progress }))
      updateQueueItem(item.id, { status: 'success', progress: 100 })
    } catch (error) {
      updateQueueItem(item.id, { status: 'error', error: getApiError(error, 'Upload failed. Try again.') })
    }
  }

  function uploadReadyItems() {
    queue.filter((item) => item.status === 'ready').forEach(uploadQueueItem)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  return (
    <section className="upload-section" aria-label="Upload clothing">
      <div
        className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <UploadCloud size={27} strokeWidth={1.5} />
        <strong>Drop your clothes here</strong>
        <span>or choose images from your device</span>
        <button className="outline-button" type="button" onClick={() => inputRef.current?.click()}>
          Add clothes
        </button>
        <input ref={inputRef} hidden type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
        <small>JPG, JPEG, PNG, WEBP · up to 10 MB each</small>
      </div>

      {queue.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <div><strong>Upload queue</strong><span>{queue.length} {queue.length === 1 ? 'image' : 'images'}</span></div>
            {queue.some((item) => item.status === 'ready') && <button className="primary-button compact-button" type="button" onClick={uploadReadyItems}>Upload all</button>}
          </div>
          <div className="queue-list">
            {queue.map((item) => (
              <motion.div layout key={item.id} className="queue-item">
                <FileImage size={18} />
                <div className="queue-file"><strong>{item.file.name}</strong><span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span></div>
                {item.status === 'uploading' && <div className="queue-progress"><span style={{ width: `${item.progress}%` }} /></div>}
                {item.status === 'ready' && <button className="icon-button" type="button" aria-label={`Remove ${item.file.name}`} onClick={() => setQueue(queue.filter((queueItem) => queueItem.id !== item.id))}><X size={17} /></button>}
                {item.status === 'uploading' && <LoaderCircle className="spin" size={18} />}
                {item.status === 'success' && <Check className="success-icon" size={18} />}
                {item.status === 'error' && <><span className="queue-error">{item.error}</span><button className="icon-button" type="button" aria-label={`Retry ${item.file.name}`} onClick={() => uploadQueueItem(item)}><RotateCcw size={16} /></button><button className="icon-button" type="button" aria-label={`Remove ${item.file.name}`} onClick={() => setQueue(queue.filter((queueItem) => queueItem.id !== item.id))}><Trash2 size={16} /></button></>}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default WardrobeUploader