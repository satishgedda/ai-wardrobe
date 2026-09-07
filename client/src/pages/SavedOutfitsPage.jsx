import { useEffect, useState } from 'react'
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import { deleteOutfit, fetchSavedOutfits, unsaveOutfit } from '../lib/outfit-api'

function SavedOutfitsPage() {
  const [outfits, setOutfits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  async function load() {
    setIsLoading(true); setError('')
    try { setOutfits(await fetchSavedOutfits()) } catch (requestError) { setError(getApiError(requestError, 'We could not load your saved outfits.')) } finally { setIsLoading(false) }
  }
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { load() }, [])

  async function remove(outfit, permanently = false) {
    if (!window.confirm(permanently ? 'Delete this outfit permanently?' : 'Remove this outfit from saved outfits?')) return
    setBusyId(outfit._id)
    try { if (permanently) await deleteOutfit(outfit._id); else await unsaveOutfit(outfit._id); setOutfits((current) => current.filter((item) => item._id !== outfit._id)) } catch (requestError) { setError(getApiError(requestError, 'We could not update that outfit.')) } finally { setBusyId('') }
  }

  return <main className="saved-page"><header className="saved-header"><div><Link className="back-link" to="/"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">Your personal edit</p><h1>Saved outfits</h1><p>Looks worth remembering, built from your own collection.</p></div><Bookmark size={30} /></header>{error && <p className="page-error" role="alert">{error}</p>}{isLoading && <div className="wardrobe-loading"><span className="loading-line" /><span className="loading-line" /><span className="loading-line" /></div>}{!isLoading && !error && !outfits.length && <div className="empty-wardrobe saved-empty"><div className="empty-mark"><Bookmark size={27} /></div><p className="eyebrow">Nothing saved yet</p><h2>Keep the looks that feel like you.</h2><p>Generate an outfit and save it here for an easy morning decision.</p><Link className="primary-button" to="/recommendations">Create an outfit</Link></div>}{!isLoading && outfits.length > 0 && <section className="saved-grid">{outfits.map((outfit) => <article className="saved-card" key={outfit._id}><div className="saved-card-images">{outfit.clothingItemIds.slice(0, 4).map((item) => <img key={item._id} src={item.imageUrl} alt={item.category || 'Wardrobe item'} />)}</div><div className="saved-card-copy"><div><p className="eyebrow">{outfit.generatedBy === 'recommendation' ? 'Weather-aware edit' : 'Saved look'}</p><h2>{outfit.name}</h2></div><p>{outfit.aiExplanation || outfit.stylingNotes || 'A look from your wardrobe.'}</p><div className="saved-card-actions"><button className="outline-button" type="button" disabled={busyId === outfit._id} onClick={() => remove(outfit)}><Bookmark size={15} /> Remove saved</button><button className="icon-button" type="button" aria-label="Delete outfit" disabled={busyId === outfit._id} onClick={() => remove(outfit, true)}><Trash2 size={16} /></button></div></div></article>)}</section>}</main>
}

export default SavedOutfitsPage
