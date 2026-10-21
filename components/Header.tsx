'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { business, navigation } from '@/lib/business';
export function Header() {
 const [open, setOpen] = useState(false); const [scrolled, setScrolled] = useState(false);
 useEffect(() => { const update = () => setScrolled(window.scrollY > 20); update(); window.addEventListener('scroll', update, { passive: true }); const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); document.getElementById('menu-toggle')?.focus(); } }; window.addEventListener('keydown', close); return () => { window.removeEventListener('scroll', update); window.removeEventListener('keydown', close); }; }, []);
 return <header className={`header ${scrolled ? 'scrolled' : ''}`}><div className="nav-wrap"><Link className="brand" href="/#home" aria-label={`${business.tradeName} home`} onClick={() => setOpen(false)}><Image src="/images/agro-logo.png" width={58} height={58} unoptimized alt="Agro Engineering Solutions logo" priority/><span>AGRO<span>ENGINEERING SOLUTIONS</span></span></Link><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([label,id]) => <Link key={id} href={`/#${id}`}>{label}</Link>)}</nav><Link className="button nav-cta" href="/#contact">Get in Touch <ArrowUpRight size={16}/></Link><button id="menu-toggle" className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div><nav id="mobile-nav" aria-label="Mobile navigation" className="mobile-nav" hidden={!open}>{navigation.map(([label,id]) => <Link key={id} href={`/#${id}`} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16}/></Link>)}</nav></header>;
}
