import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:8787';
const CATALOGUE = import.meta.env.VITE_CATALOGUE_ORIGIN ?? 'http://localhost:5174';
type TwitchAuth = { channelId: string; token: string; userId: string };
declare global { interface Window { Twitch?: { ext?: { onAuthorized: (callback: (auth: TwitchAuth) => void) => void } } } }

function twitchRole(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return '';
    const encoded = payload.replace(/-/g, '+').replace(/_/g, '/');
    return String(JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))).role ?? '');
  } catch { return ''; }
}

function App() {
  const parameters = new URLSearchParams(location.search);
  const panelMode = parameters.get('mode') === 'panel' || window.self !== window.top;
  const fallbackChannel = parameters.get('channel') ?? 'demo';
  const [channel, setChannel] = useState(fallbackChannel);
  const [token, setToken] = useState('');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>({ items: [] });
  const [intentState, setIntentState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isBroadcaster, setIsBroadcaster] = useState(parameters.get('creator') === 'true');
  const [approvalState, setApprovalState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLElement>(null);
  const dragRef = useRef<null | { x: number; y: number; position: { x: number; y: number }; rect: DOMRect }>(null);
  const movedRef = useRef(false);

  useEffect(() => { window.Twitch?.ext?.onAuthorized((auth) => { setChannel(auth.channelId); setToken(auth.token); setIsBroadcaster(twitchRole(auth.token) === 'broadcaster'); }); }, []);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch(`${API}/v1/channels/${encodeURIComponent(channel)}/discovery`).then((response) => response.json()).then((next) => { if (active) setData(next); });
    refresh(); const timer = setInterval(refresh, 5_000);
    return () => { active = false; clearInterval(timer); };
  }, [channel]);

  const product = data.items[0];
  const saveActions = product?.aggregateIntent?.save;
  const saveSummary = Number.isFinite(saveActions) && saveActions > 0 ? `${saveActions}+ save actions` : 'Save count hidden for privacy';
  async function record(action: 'view' | 'save') {
    if (!product) return;
    if (action === 'save') setIntentState('saving');
    const response = await fetch(`${API}/v1/viewer/intent`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { 'x-extension-jwt': token } : {}) }, body: JSON.stringify({ channelId: channel, productId: product.id, action }) });
    if (action === 'save') setIntentState(response.ok ? 'saved' : 'error');
  }
  async function toggleApproval() {
    if (!product) return;
    setApprovalState('saving');
    const approved = product.provenance === 'creator_approved';
    const response = await fetch(approved ? `${API}/v1/creator/products/${encodeURIComponent(product.id)}?channelId=${encodeURIComponent(channel)}` : `${API}/v1/creator/products`, {
      method: approved ? 'DELETE' : 'POST',
      headers: { ...(approved ? {} : { 'content-type': 'application/json' }), ...(token ? { 'x-extension-jwt': token } : {}) },
      ...(approved ? {} : { body: JSON.stringify({ channelId: channel, productId: product.id }) }),
    });
    if (!response.ok) return setApprovalState('error');
    setData((current: any) => ({ ...current, items: current.items.map((item: any) => item.id === product.id ? { ...item, provenance: approved ? 'ai_discovered' : 'creator_approved' } : item) }));
    setApprovalState('idle');
  }
  function moveWithinViewport(deltaX: number, deltaY: number, rect = overlayRef.current?.getBoundingClientRect()) {
    if (!rect) return;
    const left = Math.min(Math.max(8, rect.left + deltaX), Math.max(8, window.innerWidth - rect.width - 8));
    const top = Math.min(Math.max(8, rect.top + deltaY), Math.max(8, window.innerHeight - rect.height - 8));
    setPosition((current) => ({ x: current.x + left - rect.left, y: current.y + top - rect.top }));
  }
  function startDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect || panelMode) return;
    movedRef.current = false;
    dragRef.current = { x: event.clientX, y: event.clientY, position, rect };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function drag(event: React.PointerEvent<HTMLButtonElement>) {
    const active = dragRef.current;
    if (!active || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const deltaX = event.clientX - active.x, deltaY = event.clientY - active.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) movedRef.current = true;
    const left = Math.min(Math.max(8, active.rect.left + deltaX), Math.max(8, window.innerWidth - active.rect.width - 8));
    const top = Math.min(Math.max(8, active.rect.top + deltaY), Math.max(8, window.innerHeight - active.rect.height - 8));
    setPosition({ x: active.position.x + left - active.rect.left, y: active.position.y + top - active.rect.top });
  }
  const catalogueUrl = `${CATALOGUE}?channel=${encodeURIComponent(channel)}`;
  const placeholderProduct = product && (() => { try { return new URL(product.productUrl).hostname === 'example.com'; } catch { return true; } })();
  const productDestination = product && (placeholderProduct ? catalogueUrl : product.productUrl);
  const recordProductView = () => { if (!placeholderProduct) void record('view'); };
  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => { dragRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  const nudge = (event: React.KeyboardEvent<HTMLButtonElement>) => { const directions: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }; const movement = directions[event.key]; if (movement) { event.preventDefault(); moveWithinViewport(...movement); } };
  return <main ref={overlayRef} className={`overlay ${panelMode ? 'panel-mode' : ''}`} style={panelMode ? undefined : { transform: `translate3d(${position.x}px,${position.y}px,0)` }}>
    {!panelMode && <button className="tab" aria-expanded={open} aria-label="Move or open stream finds" title="Drag to move · Arrow keys to nudge · Double-click to reset" onPointerDown={startDrag} onPointerMove={drag} onPointerUp={finishDrag} onDoubleClick={() => setPosition({ x: 0, y: 0 })} onKeyDown={nudge} onClick={() => { if (movedRef.current) { movedRef.current = false; return; } setOpen(!open); }}><span>SC</span> Stream finds <i>{open ? '×' : '+'}</i></button>}
    {panelMode && !open && <button className="panel-capsule" aria-expanded="false" onClick={() => setOpen(true)}><span>SC</span><b>Finds from the stream</b><i>+</i></button>}
    {open && <section className="find-card">
      {!panelMode && <button className="drag-bar" aria-label="Move recommendation panel" title="Drag to move · Arrow keys to nudge · Double-click to reset" onPointerDown={startDrag} onPointerMove={drag} onPointerUp={finishDrag} onDoubleClick={() => setPosition({ x: 0, y: 0 })} onKeyDown={nudge}><span>MOVE PANEL</span><i aria-hidden="true">••••••</i></button>}
      <header><div><b>NOW IN FRAME</b><small>{data.topic || 'Waiting for stream context'}</small></div><span className="live-dot">CATALOGUE</span>{panelMode && <button className="panel-collapse" aria-label="Collapse finds" onClick={() => setOpen(false)}>−</button>}</header>
      {product ? <>
        <a className="product-primary" href={productDestination} target="_blank" rel="noreferrer" onClick={recordProductView} aria-label={`${placeholderProduct ? 'Open in catalogue' : 'View product'}: ${product.title}`}>
          <div className="product-media"><img src={product.imageUrl} alt=""/><span>{product.provenance === 'creator_approved' ? 'CREATOR PICK' : 'AI DISCOVERY'}</span></div>
          <div className="product-copy"><div>{product.brand && <small>{product.brand}</small>}<h2>{product.title}</h2></div><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}</strong></div>
        </a>
        <div className={`signal ${product.provenance === 'creator_approved' ? 'approved' : 'discovered'}`}><i/>{product.provenance === 'creator_approved' ? 'Approved by this creator' : 'Matched to the live topic'}</div>
        {isBroadcaster && <button className="creator-control" disabled={approvalState === 'saving'} onClick={() => void toggleApproval()}><span>BROADCASTER CONTROL</span>{approvalState === 'saving' ? 'Saving…' : approvalState === 'error' ? 'Try again' : product.provenance === 'creator_approved' ? 'Remove approval' : 'Approve this find'}</button>}
        <small className="social-proof" title="Aggregate save actions; small counts are hidden and larger totals are grouped for privacy.">{saveSummary}</small>
        <div className="actions"><a href={productDestination} target="_blank" rel="noreferrer" onClick={recordProductView}>{placeholderProduct ? 'View catalogue ↗' : 'View product ↗'}</a><button disabled={intentState === 'saving' || intentState === 'saved'} onClick={() => void record('save')}>{intentState === 'saving' ? 'Saving…' : intentState === 'saved' ? 'Saved ✓' : intentState === 'error' ? 'Try again' : 'Save interest'}</button></div>
      </> : <p className="empty">No find yet. The creator can set the topic from chat.</p>}
      <footer><span>No personal tracking</span><a href={catalogueUrl} target="_blank" rel="noreferrer">Open catalogue →</a></footer>
    </section>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
