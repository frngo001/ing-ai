"use client"

import * as React from "react"
import { useEffect, useState } from "react"

interface BlogTableOfContentsProps {
  content: string
}

interface TocItem {
  id: string
  text: string
  level: number
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

export function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")

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

  if (tocItems.length === 0) {
    return null
  }

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

  return (
    <aside className="hidden xl:block fixed right-8 top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="sticky top-8">
        <h2 className="text-sm font-semibold mb-4 text-foreground">Inhaltsverzeichnis</h2>
        <nav className="space-y-1">
          {tocItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`block text-sm py-1 transition-colors ${
                item.level === 2
                  ? "font-medium pl-0"
                  : item.level === 3
                  ? "pl-4 text-muted-foreground"
                  : "pl-8 text-muted-foreground text-xs"
              } ${
                activeId === item.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

