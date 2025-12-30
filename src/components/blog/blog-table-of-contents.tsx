"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useLanguage } from '@/lib/i18n/use-language'

interface BlogTableOfContentsProps {
  content: string
}

interface TocItem {
  id: string
  text: string
  level: number
}

interface TocGroup {
  title: string
  items: TocItem[]
}

/**
 * Extrahiert Überschriften aus HTML-Content und erstellt ein Inhaltsverzeichnis
 */
function extractHeadings(htmlContent: string): TocItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, "text/html")
  const headings = doc.querySelectorAll("h2, h3, h4")
  
  const items: TocItem[] = []
  
  headings.forEach((heading) => {
    const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, "-") || ""
    const text = heading.textContent || ""
    const level = parseInt(heading.tagName.charAt(1)) // h2 = 2, h3 = 3, etc.
    
    if (id && text) {
      items.push({ id, text, level })
    }
  })
  
  return items
}

/**
 * Gruppiert Überschriften nach h2-Elementen
 * Wenn keine h2 vorhanden sind, werden alle Items als einzelne Gruppen behandelt
 */
function groupHeadings(items: TocItem[]): TocGroup[] {
  const groups: TocGroup[] = []
  let currentGroup: TocGroup | null = null

  // Prüfe, ob es h2-Überschriften gibt
  const hasH2 = items.some(item => item.level === 2)

  if (!hasH2) {
    // Wenn keine h2 vorhanden sind, erstelle für jedes Item eine eigene Gruppe
    return items.map(item => ({
      title: item.text,
      items: [item],
    }))
  }

  // Gruppiere nach h2-Elementen
  items.forEach((item) => {
    if (item.level === 2) {
      // Neue Hauptgruppe (h2)
      if (currentGroup) {
        groups.push(currentGroup)
      }
      currentGroup = {
        title: item.text,
        items: [item],
      }
    } else if (currentGroup) {
      // Unterüberschrift (h3, h4) zur aktuellen Gruppe hinzufügen
      currentGroup.items.push(item)
    }
  })

  if (currentGroup) {
    groups.push(currentGroup)
  }

  return groups
}

export function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [navbarHeight, setNavbarHeight] = useState(112)
  const { t, language } = useLanguage()

  const tocTitle = React.useMemo(() => t('pages.blog.toc.title'), [t, language])

  // Messen der tatsächlichen Navbar-Höhe
  useEffect(() => {
    const measureNavbar = () => {
      const navbar = document.querySelector('header')
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight)
      }
    }

    measureNavbar()
    window.addEventListener('resize', measureNavbar)
    
    return () => {
      window.removeEventListener('resize', measureNavbar)
    }
  }, [])

  useEffect(() => {
    const items = extractHeadings(content)
    setTocItems(items)
  }, [content])

  useEffect(() => {
    // Setze IDs für die Überschriften im Content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")
    const headings = doc.querySelectorAll("h2, h3, h4")
    
    headings.forEach((heading) => {
      if (!heading.id) {
        const id = heading.textContent?.toLowerCase().replace(/\s+/g, "-") || ""
        heading.id = id
      }
    })

    // Update DOM mit IDs
    const container = document.querySelector(".blog-content")
    if (container) {
      container.innerHTML = doc.body.innerHTML
    }
  }, [content])

  useEffect(() => {
    // Aktive Überschrift beim Scrollen erkennen
    const handleScroll = () => {
      const headings = document.querySelectorAll("h2[id], h3[id], h4[id]")
      let current = ""

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          current = heading.id
        }
      })

      if (current) {
        setActiveId(current)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [tocItems])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  if (tocItems.length === 0) {
    return null
  }

  const groups = groupHeadings(tocItems)

  return (
    <aside 
      className="hidden xl:flex w-[280px] flex-shrink-0 border-l bg-background"
      style={{
        height: `calc(100vh - ${navbarHeight}px)`,
        position: 'sticky',
        top: `${navbarHeight}px`,
        alignSelf: 'flex-start',
      }}
    >
      <div className="w-full h-full overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold mb-4 sticky top-0 bg-background pb-2 border-b z-10">
            {tocTitle}
          </h2>
          <nav className="space-y-1">
            {groups.map((group, groupIndex) => (
              <div key={`${group.title}-${groupIndex}`} className="mb-4">
                <a
                  href={`#${group.items[0]?.id || ''}`}
                  onClick={(e) => {
                    if (group.items[0]?.id) {
                      handleClick(e, group.items[0].id)
                    }
                  }}
                  className={`block text-sm font-medium py-1 transition-colors ${
                    activeId === group.items[0]?.id
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {group.title}
                </a>
                {group.items.length > 1 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {group.items.slice(1).map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => handleClick(e, item.id)}
                        className={`block text-sm py-1 transition-colors ${
                          activeId === item.id
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}
