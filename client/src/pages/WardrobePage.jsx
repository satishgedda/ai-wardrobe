import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Sparkles, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import WardrobeCard from '../components/wardrobe/WardrobeCard'
import WardrobeDetailModal from '../components/wardrobe/WardrobeDetailModal'
import WardrobeUploader from '../components/wardrobe/WardrobeUploader'
import { useWardrobeStore } from '../store/wardrobe-store'
import { useAuthStore } from '../store/auth-store'
import WeatherPanel from '../components/weather/WeatherPanel'

const filterFields = [
  { key: 'category', label: 'Category' },
  { key: 'color', label: 'Color' },
  { key: 'season', label: 'Season' },
  { key: 'occasion', label: 'Occasion' },
  { key: 'style', label: 'Style' },
]

function searchableValue(item, field) {
  if (field === 'occasion') return item.occasions || []
  if (field === 'style') return item.styleTags || []
  return item[field] || ''
}

function WardrobePage() {
  const { items, isLoading, error, fetchItems, deleteItem, updateItem } = useWardrobeStore()
  const user = useAuthStore((state) => state.user)
  const [filters, setFilters] = useState({ search: '', category: '', color: '', season: '', occasion: '', style: '' })
  const [selectedItem, setSelectedItem] = useState(null)
  const [showUploader, setShowUploader] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => { fetchItems().catch(() => {}) }, [fetchItems])

  const options = useMemo(() => Object.fromEntries(filterFields.map(({ key }) => {
    const values = items.flatMap((item) => {
      const value = searchableValue(item, key)
      return Array.isArray(value) ? value : [value]
    }).filter(Boolean)
    return [key, [...new Set(values)].sort()]
  })), [items])

  const filteredItems = useMemo(() => items.filter((item) => {
    const searchText = filters.search.toLowerCase().trim()
    const itemText = [item.category, item.subcategory, item.color, item.brand, item.notes, ...(item.styleTags || []), ...(item.occasions || [])].join(' ').toLowerCase()
    if (searchText && !itemText.includes(searchText)) return false
    return filterFields.every(({ key }) => !filters[key] || searchableValue(item, key).includes(filters[key]))
  }), [items, filters])

  async function handleDelete(item) {
    if (!window.confirm('Delete this clothing item?')) return
    setDeletingId(item._id)
    setDeleteError('')
    try {
      await deleteItem(item._id)
      setSelectedItem(null)
    } catch (requestError) {
      setDeleteError(getApiError(requestError, 'We could not delete that item.'))
    } finally {
      setDeletingId('')
    }
  }

  async function handleUpdateMetadata(item, metadata) {
    const updatedItem = await updateItem(item._id, metadata)
    setSelectedItem(updatedItem)
  }

  function clearFilters() {
    setFilters({ search: '', category: '', color: '', season: '', occasion: '', style: '' })
  }

  return (
    <main className="wardrobe-page">
      <header className="wardrobe-header">
        <div><Link className="back-link" to="/">AI Wardrobe</Link><p className="eyebrow">Your collection</p><h1>Wardrobe</h1><p className="wardrobe-subtitle">{user?.name ? `${user.name}'s considered collection` : 'Your considered collection'}</p></div>
        <button className="primary-button" type="button" onClick={() => setShowUploader(!showUploader)}><UploadCloud size={17} /> Add clothes</button>
      </header>

      <div className="wardrobe-feature-row"><WeatherPanel initialCity={user?.location || ''} /><Link className="today-outfit-link" to="/recommendations"><Sparkles size={19} /><span><strong>Today&apos;s Outfit</strong><small>Style the day from your collection</small></span><span className="feature-arrow">→</span></Link></div>

      {showUploader && <WardrobeUploader />}

      <div className="wardrobe-toolbar">
        <div className="wardrobe-count"><strong>{items.length}</strong> {items.length === 1 ? 'piece' : 'pieces'}</div>
        <div className="wardrobe-search"><Search size={17} /><input value={filters.search} placeholder="Search your wardrobe" aria-label="Search wardrobe" onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></div>
        <div className="filter-heading"><SlidersHorizontal size={16} /> Filter</div>
        {filterFields.map(({ key, label }) => <select key={key} value={filters[key]} aria-label={label} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}><option value="">{label}</option>{options[key].map((option) => <option key={option} value={option}>{option}</option>)}</select>)}
      </div>

      {deleteError && <p className="page-error" role="alert">{deleteError}</p>}
      {isLoading && <div className="wardrobe-loading"><span className="loading-line" /><span className="loading-line" /><span className="loading-line" /></div>}
      {!isLoading && error && <div className="state-panel"><h2>We could not open your wardrobe.</h2><p>{error}</p><button className="outline-button" type="button" onClick={() => fetchItems().catch(() => {})}>Try again</button></div>}
      {!isLoading && !error && items.length === 0 && <div className="empty-wardrobe"><div className="empty-mark"><UploadCloud size={28} /></div><p className="eyebrow">A collection in progress</p><h2>Build your digital wardrobe</h2><p>Give your clothes a place to begin. Add a few pieces and your wardrobe will start to take shape.</p><button className="primary-button" type="button" onClick={() => setShowUploader(true)}><UploadCloud size={17} /> Upload your first pieces</button></div>}
      {!isLoading && !error && items.length > 0 && filteredItems.length === 0 && <div className="state-panel"><h2>No pieces match those filters.</h2><button className="outline-button" type="button" onClick={clearFilters}>Clear filters</button></div>}
      {!isLoading && !error && filteredItems.length > 0 && <section className="wardrobe-grid" aria-label="Wardrobe items">{filteredItems.map((item) => <WardrobeCard key={item._id} item={item} onSelect={setSelectedItem} onDelete={handleDelete} />)}</section>}
      {deletingId && <div className="action-toast" role="status">Removing item...</div>}
      <WardrobeDetailModal key={selectedItem?._id} item={selectedItem} onClose={() => setSelectedItem(null)} onDelete={handleDelete} onUpdateMetadata={handleUpdateMetadata} />
    </main>
  )
}

export default WardrobePage
