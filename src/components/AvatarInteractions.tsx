import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Handshake, X } from 'lucide-react';
import { socketService } from '../socketService';
import { EMOTES, GIFTS, type ReactionKind, type RoomReaction } from '../../shared/social';
import './AvatarInteractions.css';

const LABELS: Record<ReactionKind, string> = { flower: '鲜花', coffee: '咖啡', egg: '鸡蛋', pan: '平底锅', giggle: '偷笑', handshake: '握手', cry: '大哭', angry: '发怒', bored: '无聊' };

export function ReactionArt({ kind, impact = false }: { kind: ReactionKind; impact?: boolean }) {
  if (kind === 'handshake') return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#e0f2e8" /><Handshake x="9" y="9" width="46" height="46" stroke="#327767" strokeWidth="1.8" /></svg>;
  return <svg viewBox="0 0 64 64" fill="none" stroke="#33454a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'flower' && <><path d="M20 27 30 53 43 27" stroke="#518668" strokeWidth="3" /><path d="M30 44q-18-1-16-13 11 0 16 13M31 40q17-7 17-16-14 2-17 16" fill="#7ea87a" /><path d="m17 37 13 20 15-20-14 5z" fill="#f4eee0" /><path d="m25 48 10-2 1 5-10 2z" fill="#dc778c" />{[[20,23],[43,21],[31,13]].map(([x,y],i) => <g key={i} transform={`translate(${x} ${y})`} fill={i === 1 ? '#efcf75' : '#ec91a5'}><path d="M0-5c-10-10-14 2-8 5-8 8 4 14 8 7 7 8 14-3 7-7 8-7-3-15-7-5Z" /><circle r="3" fill="#fff4b0" /></g>)}</>}
    {kind === 'coffee' && <><ellipse cx="31" cy="51" rx="24" ry="6" fill="#a5cfbf" /><path d="M45 28h7c9 0 7 14-7 14" strokeWidth="4" stroke="#508e80" /><path d="M12 24h34l-3 19q-2 8-14 8t-14-8z" fill="#f9f5e9" /><ellipse cx="29" cy="25" rx="17" ry="5" fill="#855e46" /><path d="M21 25q8-7 16 0-8 5-16 0" stroke="#f8dfb6" /><g className="reaction-steam" stroke="#8baaa5"><path d="M22 17q-5-4 0-9M32 15q5-4 0-10M40 17q-4-3 0-7" /></g></>}
    {kind === 'egg' && (impact ? <><path d="M7 38q-7-12 8-13-1-16 13-9 12-15 18-1 19-3 14 10 14 10-2 15 1 19-17 9-13 16-20 1-17 4-14-12Z" fill="#fffaf0" /><ellipse cx="33" cy="32" rx="12" ry="10" fill="#edbb45" /><path d="m12 51 4 5m35-43 4-6M5 19l-3-3" stroke="#e3ba58" strokeWidth="3" /></> : <><path d="M49 38c0 24-34 24-34 0 0-12 9-29 17-29s17 17 17 29Z" fill="#fff5df" /><path d="M23 34q0-10 7-16" stroke="white" strokeWidth="5" /></>)}
    {kind === 'pan' && <g transform={impact ? 'rotate(-30 32 32)' : 'rotate(30 32 32)'}><path d="M29 40h6v20h-6z" fill="#785d4f" /><circle cx="32" cy="24" r="20" fill="#829297" /><circle cx="32" cy="24" r="15" fill="#405559" /><path d="M23 18q5-7 13-4" stroke="#9fb7b8" strokeWidth="3" />{impact && <g stroke="#e5b944" strokeWidth="3"><path d="m6 6 5 7M49 5l-3 8M57 25l-6 1" /></g>}</g>}
    {EMOTES.includes(kind as any) && <><circle cx="32" cy="32" r="26" fill={kind === 'angry' ? '#f1a391' : '#f6d77e'} /><path d="M15 22q4-9 13-10" stroke="#fff1b9" strokeWidth="4" />
      {kind === 'giggle' && <><path d="m17 29 5-3 5 3m10 0 5-3 5 3M24 39q8 10 17 0" strokeWidth="2.5" /><ellipse cx="17" cy="36" rx="5" ry="3" fill="#e99c7a" stroke="none" /><path d="M34 48v-8q0-5 3-2v-2q2-3 4 1 3-3 5 1 3-1 3 3v6q-8 8-15 1" fill="#ffe4a0" /></>}
      {kind === 'cry' && <><path d="m17 26 10 2m10 0 10-2" strokeWidth="3" /><path d="M21 31v19m22-19v19" stroke="#6daed1" strokeWidth="7" /><ellipse cx="32" cy="43" rx="7" ry="9" fill="#67545a" /><path d="M28 48h8" stroke="#eeb0af" strokeWidth="3" /></>}
      {kind === 'angry' && <><path d="m17 23 10 5m10 0 10-5M24 44q8-6 16 0" strokeWidth="3" /><path d="M23 31v3m18-3v3" strokeWidth="4" /><path d="m45 12 4 4 4-4m-4 4 4 4m-4-4-4 4" stroke="#af4a40" strokeWidth="2.5" /></>}
      {kind === 'bored' && <><path d="M17 28h10m10 0h10M25 44h14" strokeWidth="2.5" /><path d="M23 29v4m18-4v4" strokeWidth="3" /><path d="m45 6 7-1-5 7 7-1" stroke="#6c9290" strokeWidth="2.5" /></>}
    </>}
  </svg>;
}

function anchor(id: string) {
  return [...document.querySelectorAll<HTMLElement>('[data-social-avatar]')].find(el => el.dataset.socialAvatar === id);
}
function point(id: string, fallback = false) {
  const rect = anchor(id)?.getBoundingClientRect();
  return rect && rect.width ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : fallback ? { x: innerWidth / 2, y: innerHeight - 50 } : null;
}
function AnimatedReaction({ event, done }: { event: RoomReaction; done: () => void }) {
  const element = useRef<HTMLDivElement>(null);
  const [impact, setImpact] = useState(false);
  const own = EMOTES.includes(event.kind as any);
  useEffect(() => {
    const target = point(event.targetId, own), source = point(event.actorId, true);
    if (!target || !source || !element.current) { done(); return; }
    const el = element.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rotated = !!anchor(event.targetId)?.closest('[data-portrait-rotated="true"]');
    const tx = Math.max(32, Math.min(innerWidth - 32, target.x - (own && rotated ? 38 : 0))), ty = Math.max(32, Math.min(innerHeight - 42, target.y + (own && !rotated ? 38 : 0)));
    el.style.left = `${tx - 28}px`; el.style.top = `${ty - 28}px`;
    const dx = source.x - tx, dy = source.y - ty;
    const flight = el.animate(own || reduced ? [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }] : [
      { transform: `translate(${dx}px, ${dy}px) scale(.5) rotate(-25deg)`, opacity: 0 },
      { transform: `translate(${dx * .5}px, ${dy * .5 - 65}px) scale(1.1) rotate(12deg)`, opacity: 1, offset: .55 },
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    ], { duration: own || reduced ? 180 : 850, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'forwards' });
    let linger: Animation | undefined;
    flight.onfinish = () => {
      setImpact(true);
      if (!reduced && event.kind === 'pan') anchor(event.targetId)?.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], { duration: 350 });
      linger = el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 1, transform: `scale(${own ? 1.05 : 1.2})`, offset: .7 }, { opacity: 0, transform: 'translateY(-8px) scale(.9)' }], { duration: own ? 2600 : 1500, fill: 'forwards' });
      linger.onfinish = done;
    };
    return () => { flight.onfinish = null; flight.cancel(); if (linger) { linger.onfinish = null; linger.cancel(); } };
  }, [event]);
  return <div ref={element} className={`catan-reaction-flight ${impact ? 'has-landed' : ''}`} data-reaction-kind={event.kind}><ReactionArt kind={event.kind} impact={impact} />{own && !anchor(event.targetId) && <span className="reaction-sender-name">{event.actorName}</span>}{impact && ['flower', 'coffee'].includes(event.kind) && <span className="reaction-sparkles" />}</div>;
}

export function AvatarInteractions({ roomId, selfId, spectator }: { roomId: string; selfId: string; spectator: boolean }) {
  const [menu, setMenu] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const [events, setEvents] = useState<RoomReaction[]>([]);
  const lastSent = useRef(0);
  const [cooldown, setCooldown] = useState(false);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const el = (event.target as Element)?.closest<HTMLElement>('[data-social-avatar]');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenu({ id: el.dataset.socialAvatar!, name: el.dataset.socialName || '我', x: Math.min(innerWidth - 164, Math.max(164, rect.left + rect.width / 2)), y: Math.max(8, Math.min(innerHeight - 150, rect.bottom + 8)) });
    };
    const dismiss = (event: Event) => { if (!(event.target as Element)?.closest('[data-social-avatar], [data-social-menu]')) setMenu(null); };
    const close = () => setMenu(null);
    document.addEventListener('click', click, true); document.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('resize', close);
    const off = socketService.onSocial('room_reaction', (event: RoomReaction) => {
      if (event.roomId === roomId && [...GIFTS, ...EMOTES].includes(event.kind)) setEvents(list => list.some(item => item.id === event.id) ? list : [...list.slice(-5), event]);
    });
    return () => { off(); document.removeEventListener('click', click, true); document.removeEventListener('pointerdown', dismiss, true); window.removeEventListener('resize', close); };
  }, [roomId]);
  useEffect(() => { if (!cooldown) return; const t = setTimeout(() => setCooldown(false), 1800); return () => clearTimeout(t); }, [cooldown]);
  return createPortal(<>
    {spectator && <button data-social-avatar={selfId} data-social-name="我" aria-label="我的观战表情" title="我的观战表情" className="catan-spectator-avatar"><Eye size={19} /></button>}
    {menu && <div data-social-menu role="dialog" aria-label="头像互动" className="catan-reaction-menu" style={{ left: menu.x, top: menu.y }}><div className="reaction-menu-heading"><span>{menu.id === selfId ? '我的表情' : menu.name}</span><button onClick={() => setMenu(null)} aria-label="关闭互动" title="关闭互动"><X size={15} /></button></div><div className="reaction-menu-options">{(menu.id === selfId ? EMOTES : GIFTS).map(kind => <button key={kind} title={LABELS[kind]} aria-label={LABELS[kind]} disabled={cooldown} onClick={() => {
      if (Date.now() - lastSent.current < 1800) return;
      lastSent.current = Date.now(); setCooldown(true); socketService.sendReaction(roomId, menu.id, kind); setMenu(null);
    }}><ReactionArt kind={kind} /><span>{LABELS[kind]}</span></button>)}</div></div>}
    <div className="catan-reaction-layer" aria-hidden="true">{events.map(event => <AnimatedReaction key={event.id} event={event} done={() => setEvents(list => list.filter(item => item.id !== event.id))} />)}</div>
  </>, document.body);
}
