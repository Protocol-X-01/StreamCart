import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:8787';
function App() {
  const channel = new URLSearchParams(location.search).get('channel') ?? 'demo';
  const [data, setData] = useState<any>({ items: [] });
  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [error, setError] = useState('');
  const accept = async (response: Response) => {
    if (!response.ok) throw new Error('Catalogue request failed');
    const next = await response.json();
    if (!Array.isArray(next.items)) throw new Error('Catalogue response was incomplete');
    setData(next); setError('');
  };
  useEffect(() => { fetch(`${API}/v1/catalogue/browse?channelId=${encodeURIComponent(channel)}`).then(accept).catch(() => setError('The catalogue could not load. Try again.')); }, [channel]);
  async function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) { setError('Enter at least 2 characters.'); return; }
    setSelectedBrand('');
    await fetch(`${API}/v1/catalogue/search?q=${encodeURIComponent(term)}&channelId=${encodeURIComponent(channel)}`).then(accept).catch(() => setError('That search could not load. Try again.'));
  }
  const items = Array.isArray(data.items) ? data.items : [];
  const brands = useMemo(() => [...new Set<string>(items.flatMap((product: any) => product.brands?.length ? product.brands : product.brand ? [product.brand] : []))].sort(), [items]);
  const visibleItems = selectedBrand ? items.filter((product: any) => (product.brands ?? [product.brand]).includes(selectedBrand)) : items;
  return <div className="page-shell">
    <header className="topbar"><a className="brand" href="/"><span>SC</span> STREAMCART</a><div><i/> Live catalogue <small>US · SafeSearch on</small></div></header>
    <main>
      <section className="intro"><p className="eyebrow">CHANNEL / {channel}</p><h1>The full<br/><em>catalogue.</em></h1><p className="lede">The curated Twitch collection from Channel3: creator-relevant brands, live availability, and links returned directly by the API.</p><form onSubmit={search}><label><span>SEARCH THE TWITCH COLLECTION</span><input minLength={2} value={query} onChange={(event) => { setQuery(event.target.value); if (error) setError(''); }} placeholder="Try “streaming microphone”" aria-describedby="search-help"/></label><button>Find gear →</button></form><p id="search-help" className={`search-help ${error ? 'error' : ''}`} aria-live="polite">{error || 'Enter 2 or more characters, or browse every find below.'}</p><div className="trust"><span>01 <b>Channel3 links</b></span><span>02 <b>No personal tracking</b></span><span>03 <b>Safety filtered</b></span></div></section>
      <section className="results"><div className="results-head"><div><span>TWITCH COLLECTION · CHANNEL3</span><h2>{data.topic || 'Curated catalogue'}</h2></div><b>{String(visibleItems.length).padStart(2, '0')} finds</b></div>{brands.length > 0 && <div className="brand-filters" aria-label="Filter by brand"><button className={!selectedBrand ? 'active' : ''} onClick={() => setSelectedBrand('')}>All brands</button>{brands.map((brand) => <button key={brand} className={selectedBrand === brand ? 'active' : ''} onClick={() => setSelectedBrand(brand)}>{brand}</button>)}</div>}<div className="product-grid">{visibleItems.map((product: any, index: number) => <article key={product.id}>
        <div className="image-wrap"><img src={product.imageUrl} alt=""/><span>{String(index + 1).padStart(2, '0')}</span></div>
        <div className={`provenance ${product.provenance === 'creator_approved' ? 'approved' : ''}`}><i/>{product.provenance === 'creator_approved' ? 'Creator pick' : 'AI discovery'}</div>
        {product.brand && <p className="product-brand">{product.brand}</p>}<h3>{product.title}</h3><div className="price-row"><b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}</b><small>{product.aggregateIntent?.save ?? 0} saves</small></div>
        <a href={product.productUrl} target="_blank" rel="noreferrer">View product <span>↗</span></a>
      </article>)}</div></section>
    </main>
    <footer className="page-footer"><span>STREAMCART / TWITCHCON 2026</span><p>Explicit intent. Aggregate signals. Creator control.</p></footer>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
