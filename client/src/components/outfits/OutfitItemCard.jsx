function OutfitItemCard({ item }) {
  return <div className="outfit-item-card"><div className="outfit-item-image"><img src={item.imageUrl} alt={item.category || 'Wardrobe item'} /></div><div><strong>{item.category || 'Uncategorized'}</strong><span>{item.color || 'No color added'}</span></div></div>
}

export default OutfitItemCard