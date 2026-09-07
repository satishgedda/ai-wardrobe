import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'

const wardrobeCategories = ['t-shirt', 'shirt', 'jeans', 'trousers', 'pants', 'shorts', 'jacket', 'hoodie', 'sweater', 'dress', 'skirt', 'shoes', 'accessories', 'other', 'top', 'bottom', 'outerwear', 'accessory']
const metadataOptions = {
  color: ['black', 'white', 'gray', 'blue', 'navy', 'red', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'beige', 'cream', 'khaki', 'multicolor'],
  season: ['spring', 'summer', 'autumn', 'winter', 'all-season'],
  occasions: ['casual', 'formal', 'business', 'party', 'active', 'travel'],
  styleTags: ['casual', 'formal', 'business', 'sporty', 'streetwear', 'minimalist', 'classic', 'bohemian', 'elegant'],
  material: ['cotton', 'denim', 'linen', 'wool', 'leather', 'synthetic', 'silk', 'knit'],
}

function DetailRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return <div className="detail-row"><dt>{label}</dt><dd>{Array.isArray(value) ? value.join(', ') : value}</dd></div>
}

function WardrobeDetailModal({ item, onClose, onDelete, onUpdateMetadata }) {
  const [category, setCategory] = useState(item?.category || '')
  const [metadata, setMetadata] = useState(() => ({
    color: item?.color || '', season: item?.season || '', material: item?.material || '',
    occasions: item?.occasions || [], styleTags: item?.styleTags || [],
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  if (!item) return null

  async function handleMetadataSave() {
    const payload = { category, ...metadata }
    setIsSaving(true)
    setSaveError('')
    try {
      await onUpdateMetadata(item, payload)
    } catch {
      setSaveError('We could not update these details.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="detail-modal" role="dialog" aria-modal="true" aria-label="Clothing details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button className="modal-close icon-button" type="button" aria-label="Close details" onClick={onClose}><X size={19} /></button>
        <div className="detail-image"><img src={item.imageUrl} alt={item.category || 'Clothing item'} /></div>
        <div className="detail-copy">
          <p className="eyebrow">Wardrobe item</p>
          <h2>{item.category || 'Uncategorized'}</h2>
          <div className="detail-row"><label htmlFor={`category-${item._id}`}>Category</label><select id={`category-${item._id}`} value={category} aria-label="Clothing category" onChange={(event) => setCategory(event.target.value)}><option value="">Choose a category</option>{wardrobeCategories.map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
          {Object.entries(metadataOptions).map(([field, values]) => <div className="detail-row" key={field}><label htmlFor={`${field}-${item._id}`}>{field === 'styleTags' ? 'Style' : field[0].toUpperCase() + field.slice(1)}</label><select id={`${field}-${item._id}`} aria-label={`Clothing ${field}`} multiple={Array.isArray(metadata[field])} value={metadata[field]} onChange={(event) => setMetadata((current) => ({ ...current, [field]: Array.isArray(current[field]) ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value }))}>{!Array.isArray(metadata[field]) && <option value="">Choose a value</option>}{values.map((value) => <option value={value} key={value}>{value}</option>)}</select></div>)}
          <button className="outline-button compact-button" type="button" disabled={!category || isSaving} onClick={handleMetadataSave}>{isSaving ? 'Saving...' : 'Save details'}</button>{saveError && <p className="form-error" role="alert">{saveError}</p>}
          <dl>
            <DetailRow label="Color" value={item.color} />
            <DetailRow label="Season" value={item.season} />
            <DetailRow label="Occasions" value={item.occasions} />
            <DetailRow label="Style" value={item.styleTags} />
            <DetailRow label="Brand" value={item.brand} />
            <DetailRow label="Notes" value={item.notes} />
          </dl>
          <button className="danger-button" type="button" onClick={() => onDelete(item)}><Trash2 size={16} /> Delete item</button>
        </div>
      </motion.section>
    </div>
  )
}

export default WardrobeDetailModal
