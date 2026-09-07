import { Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

function WardrobeCard({ item, onSelect, onDelete }) {
  function handleDelete(event) {
    event.stopPropagation()
    onDelete(item)
  }

  return (
    <motion.article className="wardrobe-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={() => onSelect(item)}>
      <div className="card-image-wrap"><img src={item.imageUrl} alt={item.category || 'Clothing item'} /><button className="card-delete" type="button" aria-label="Delete clothing item" onClick={handleDelete}><Trash2 size={16} /></button></div>
      <div className="card-copy"><strong>{item.category || 'Uncategorized'}</strong><span>{item.color || 'Details to come'}</span></div>
      {(item.styleTags?.length > 0 || item.season) && <div className="card-tags">{item.season && <span>{item.season}</span>}{item.styleTags?.slice(0, 1).map((tag) => <span key={tag}>{tag}</span>)}</div>}
    </motion.article>
  )
}

export default WardrobeCard