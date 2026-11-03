import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { formatSaveCount } from './save-label.js';
import './style.css';

const API = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:8787';

function App() {
  const channel = new URLSearchParams(location.search).get('channel') ?? 'demo';
  const [data, setData] = useState<any>({ items: [] });
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [safeSearch, setSafeSearch] = useState(true);
  const [nextPageToken, setNextPageToken] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);

  const accept = async (response: Response, sequence: number, append = false) => {
    if (!response.ok) throw new Error('Catalogue request failed');
    const next = await response.json();
    if (!Array.isArray(next.items)) throw new Error('Catalogue response was incomplete');
    if (sequence !== requestSequence.current) return;
    setData((current: any) => append ? { ...next, items: [...(current.items ?? []), ...next.items] } : next);
    setNextPageToken(typeof next.nextPageToken === 'string' ? next.nextPageToken : '');
    setError('');
  };

  useEffect(() => {
    const sequence = ++requestSequence.current;
    setSelectedBrand('');
    setQuery('');
    setActiveQuery('');
    setNextPageToken('');
    setLoadingMore(false);
    setData({ items: [] });
    fetch(`${API}/v1/catalogue/browse?channelId=${encodeURIComponent(channel)}&safeSearch=${safeSearch}`)
      .then((response) => accept(response, sequence))
      .catch(() => { if (sequence === requestSequence.current) setError('The catalogue could not load. Try again.'); });
    return () => { requestSequence.current++; };
  }, [channel, safeSearch]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) { setError('Enter at least 2 characters.'); return; }
    setSelectedBrand('');
    setActiveQuery(term);
    setData({ items: [] });
    setNextPageToken('');
    setLoadingMore(false);
    const sequence = ++requestSequence.current;
    await fetch(`${API}/v1/catalogue/search?q=${encodeURIComponent(term)}&channelId=${encodeURIComponent(channel)}&safeSearch=${safeSearch}`)
      .then((response) => accept(response, sequence))
      .catch(() => { if (sequence === requestSequence.current) setError('That search could not load. Try again.'); });
  }

  async function loadMore() {
    if (!nextPageToken || loadingMore) return;
    const sequence = requestSequence.current;
    const params = new URLSearchParams({ channelId: channel, safeSearch: String(safeSearch), pageToken: nextPageToken });
    const endpoint = activeQuery ? '/v1/catalogue/search' : '/v1/catalogue/browse';
    if (activeQuery) params.set('q', activeQuery);
    setLoadingMore(true);
    try {
      await accept(await fetch(`${API}${endpoint}?${params.toString()}`), sequence, true);
    } catch {
      if (sequence === requestSequence.current) setError('More items could not load. Try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const brands = useMemo(
    () => [...new Set<string>(items.flatMap((product: any) => product.brands?.length ? product.brands : product.brand ? [product.brand] : []))].sort(),
    [items],
  );
  const visibleItems = selectedBrand ? items.filter((product: any) => (product.brands ?? [product.brand]).includes(selectedBrand)) : items;
  const countLabel = `${String(visibleItems.length).padStart(2, '0')}${nextPageToken ? '+' : ''} finds`;

  return <div className="page-shell">
    <header className="topbar">
      <a className="brand" href="/"><span>SC</span> STREAMCART</a>
      <div><i/> Live catalogue <label className="safe-toggle"><input type="checkbox" checked={safeSearch} onChange={(event) => { requestSequence.current++; setData({ items: [] }); setQuery(''); setActiveQuery(''); setSelectedBrand(''); setNextPageToken(''); setLoadingMore(false); setSafeSearch(event.target.checked); }}/> SafeSearch</label></div>
    </header>
    <main>
      <section className="intro">
        <p className="eyebrow">CHANNEL / {channel}</p>
        <h1>The full<br/><em>catalogue.</em></h1>
        <p className="lede">The curated Twitch collection from Channel3: creator-relevant brands, live availability, and links returned directly by the API.</p>
        <form onSubmit={search}>
          <label><span>SEARCH THE TWITCH COLLECTION</span><input minLength={2} value={query} onChange={(event) => { setQuery(event.target.value); if (error) setError(''); }} placeholder="Try “streaming microphone”" aria-describedby="search-help"/></label>
          <button>Find gear →</button>
        </form>
        <p id="search-help" className={`search-help ${error ? 'error' : ''}`} aria-live="polite">{error || 'Enter 2 or more characters, or browse every find below.'}</p>
        <div className="trust"><span>01 <b>Channel3 links</b></span><span>02 <b>No viewer ad profiles</b></span><span>03 <b>Safety filtered</b></span></div>
        <p className="privacy-note">Product links may earn commission. Channel3 and retailers may process click data. <a href="https://connect.trychannel3.com/privacy" target="_blank" rel="noreferrer">Channel3 privacy policy ↗</a></p>
      </section>
      <section className="results">
        <div className="results-head">
          <div><span>TWITCH COLLECTION · CHANNEL3</span><h2>{data.topic || 'Curated catalogue'}</h2></div>
          <b>{countLabel}</b>
        </div>
        {brands.length > 0 && <div className="brand-filters" aria-label="Filter by brand">
          <button className={!selectedBrand ? 'active' : ''} onClick={() => setSelectedBrand('')}>All brands</button>
          {brands.map((brand) => <button key={brand} className={selectedBrand === brand ? 'active' : ''} onClick={() => setSelectedBrand(brand)}>{brand}</button>)}
        </div>}
        <div className="product-grid">{visibleItems.map((product: any, index: number) => <article key={product.id}>
          <div className="image-wrap"><img src={product.imageUrl} alt=""/><span>{String(index + 1).padStart(2, '0')}</span></div>
          <div className={`provenance ${product.provenance === 'creator_approved' ? 'approved' : ''}`}><i/>{product.provenance === 'creator_approved' ? 'Creator pick' : 'AI discovery'}</div>
          {product.brand && <p className="product-brand">{product.brand}</p>}
          <h3>{product.title}</h3>
          <div className="price-row"><b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}</b><small title="Aggregate save actions; small counts are hidden and larger totals are grouped for privacy.">{formatSaveCount(product.aggregateIntent?.save)}</small></div>
          <a href={product.productUrl} target="_blank" rel="noreferrer">View product <span>↗</span></a>
        </article>)}</div>
        {nextPageToken && <div className="load-more-wrap"><button type="button" className="load-more" onClick={loadMore} disabled={loadingMore} aria-busy={loadingMore}>{loadingMore ? 'Loading more…' : 'Load more items'}</button></div>}
      </section>
    </main>
    <footer className="page-footer"><span>STREAMCART / TWITCHCON 2026</span><p>Explicit intent. Aggregate signals. Creator control.</p></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App/>);
