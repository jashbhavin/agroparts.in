"use client";

import { Children, useState, type ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';

export function ProductCollection({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children);
  const [expanded, setExpanded] = useState(false);
  return <>
    <div id="product-collection" className="product-grid">{expanded ? cards : cards.slice(0, 6)}</div>
    {cards.length > 6 && <div className="portfolio-more">
      <p role="status">Showing {expanded ? cards.length : 6} of {cards.length} products</p>
      <button type="button" className="portfolio-more-button" aria-controls="product-collection" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? 'View Fewer Products' : 'View More Products'} <ArrowDown size={18} aria-hidden="true" style={{ transform: expanded ? 'rotate(180deg)' : undefined }}/>
      </button>
    </div>}
  </>;
}
