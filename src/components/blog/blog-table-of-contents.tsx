'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type TocItem = {
  id: string;
  text: string;
  level: number;
};

type BlogTableOfContentsProps = {
  content: string;
  className?: string;
};

export function BlogTableOfContents({ content, className }: BlogTableOfContentsProps) {
  const [items, setItems] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  // Stelle sicher, dass wir nur auf dem Client rendern und erstelle Portal-Container
  React.useEffect(() => {
    setMounted(true);
    
    // Erstelle einen Container außerhalb des body, um den filter-Effekt zu umgehen
    if (typeof document !== 'undefined') {
      let container = document.getElementById('blog-toc-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'blog-toc-portal';
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; pointer-events: none; z-index: 30;';
        // Rendere in documentElement (html) statt body, um filter-Effekt zu umgehen
        document.documentElement.appendChild(container);
      }
      setPortalContainer(container);
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        const container = document.getElementById('blog-toc-portal');
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    };
  }, []);

  // Extrahiere Überschriften aus dem HTML-Content
  React.useEffect(() => {
    if (!content) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const tocItems: TocItem[] = [];
    const usedIds = new Set<string>();
    
    headings.forEach((heading, index) => {
      let id = heading.id;
      const text = heading.textContent?.trim() || '';
      const level = parseInt(heading.tagName.charAt(1));

      if (!text) return;

      // Generiere ID falls nicht vorhanden
      if (!id) {
        id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `heading-${index}`;
      }

      // Stelle sicher, dass die ID eindeutig ist
      let uniqueId = id;
      let counter = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${id}-${counter}`;
        counter++;
      }
      usedIds.add(uniqueId);
      id = uniqueId;

      tocItems.push({ id, text, level });
    });

    setItems(tocItems);
  }, [content]);

  // Scroll-Tracking: Finde die aktive Sektion basierend auf Scroll-Position
  React.useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset für Navbar

      // Finde die letzte Überschrift, die noch über dem Viewport ist
      let currentId: string | null = null;

      for (let i = items.length - 1; i >= 0; i--) {
        const element = document.getElementById(items[i].id);
        if (element) {
          const elementTop = element.getBoundingClientRect().top + window.scrollY;
          if (elementTop <= scrollPosition) {
            currentId = items[i].id;
            break;
          }
        }
      }

      // Falls keine Überschrift gefunden wurde, nimm die erste
      if (!currentId && items.length > 0) {
        const firstElement = document.getElementById(items[0].id);
        if (firstElement) {
          const firstElementTop = firstElement.getBoundingClientRect().top + window.scrollY;
          if (firstElementTop <= scrollPosition) {
            currentId = items[0].id;
          }
        }
      }

      setActiveId(currentId);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  // Stelle sicher, dass alle Überschriften im gerenderten HTML IDs haben
  React.useEffect(() => {
    if (items.length === 0) return;

    // Warte kurz, damit der Content gerendert ist
    const timeout = setTimeout(() => {
      const blogContent = document.querySelector('.blog-content');
      if (!blogContent) return;

      const headings = Array.from(blogContent.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      
      // Setze IDs basierend auf der Reihenfolge und dem Text
      items.forEach((item, index) => {
        // Finde das entsprechende Heading-Element
        const heading = headings[index];
        if (heading && heading.textContent?.trim() === item.text) {
          heading.id = item.id;
        } else {
          // Fallback: Suche nach Text-Match
          const matchingHeading = headings.find(
            (h) => h.textContent?.trim() === item.text && !h.id
          );
          if (matchingHeading) {
            matchingHeading.id = item.id;
          }
        }
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [items]);

  const handleNavigate = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Setze activeId nach kurzer Verzögerung, damit der Scroll-Handler es nicht überschreibt
      setTimeout(() => {
        setActiveId(id);
      }, 100);
    }
  };

  if (items.length === 0 || !mounted || !portalContainer) return null;

  const tocContent = (
    <aside
      className={cn(
        'hidden xl:block',
        'fixed right-4 top-32',
        'min-w-[200px] max-w-[240px]',
        'rounded-lg backdrop-blur-sm',
        'px-4 py-4 z-30',
        'max-h-[calc(100vh-120px)] flex flex-col',
        className
      )}
      style={{ 
        position: 'fixed',
        right: '1rem',
        top: '8rem',
        pointerEvents: 'auto'
      }}
    >
      <div className="mb-3 text-sm font-semibold text-foreground flex-shrink-0">
        Inhaltsverzeichnis
      </div>

      <nav className="flex flex-col gap-1 text-sm flex-1 overflow-y-auto pr-2 min-h-0">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={cn(
                'text-left text-muted-foreground hover:text-foreground',
                'rounded-md px-3 py-1.5 transition-all duration-200',
                'hover:bg-muted/50',
                item.level === 1 && 'font-semibold text-foreground',
                item.level === 2 && 'pl-4 text-sm',
                item.level >= 3 && 'pl-6 text-xs',
                isActive && 'text-foreground bg-muted font-medium'
              )}
            >
              <span className="leading-relaxed">{item.text}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  // Rendere in einen Container im documentElement (html), um den filter-Effekt auf body zu umgehen
  return createPortal(tocContent, portalContainer);
}

