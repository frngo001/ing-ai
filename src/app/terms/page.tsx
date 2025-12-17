"use client"

import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import Glow from '@/components/ui/glow'
import { Badge } from '@/components/ui/badge'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Glow variant="top" className="opacity-30" />
          </div>
          <div className="container px-4 mx-auto">
            <ScrollReveal className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-[10px] uppercase tracking-wider">
                Rechtliches
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Allgemeine Geschäftsbedingungen
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 border-y border-border/50">
          <div className="container px-4 mx-auto max-w-4xl">
            <ScrollReveal className="prose prose-lg dark:prose-invert max-w-none">
              <div className="space-y-8 text-muted-foreground">
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Geltungsbereich</h2>
                  <p>
                    Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der von {siteConfig.name} 
                    angebotenen Dienste, insbesondere der KI-gestützten Schreibassistenz-Plattform. 
                    Abweichende, entgegenstehende oder ergänzende AGB des Nutzers werden nicht Vertragsbestandteil, 
                    es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Vertragsgegenstand</h2>
                  <p>
                    {siteConfig.name} bietet eine KI-gestützte Plattform für akademisches Schreiben, Recherche 
                    und Veröffentlichung an. Die Plattform umfasst unter anderem:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>KI-Autocomplete-Funktionen</li>
                    <li>Zitations- und Quellenverwaltung</li>
                    <li>PDF-Verarbeitung und -Analyse</li>
                    <li>Forschungsbibliothek</li>
                    <li>Plagiatsprüfung</li>
                    <li>Mehrsprachige Unterstützung</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Registrierung und Konto</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">3.1 Registrierung</h3>
                  <p>
                    Für die Nutzung der Dienste ist eine Registrierung erforderlich. Der Nutzer verpflichtet 
                    sich, bei der Registrierung wahrheitsgemäße, vollständige und aktuelle Angaben zu machen.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">3.2 Kontoverantwortung</h3>
                  <p>
                    Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und Dritten keinen Zugang 
                    zu seinem Konto zu gewähren. Der Nutzer haftet für alle Aktivitäten, die unter seinem Konto 
                    erfolgen.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Nutzungsrechte</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">4.1 Gewährte Rechte</h3>
                  <p>
                    {siteConfig.name} gewährt dem Nutzer ein nicht-exklusives, nicht-übertragbares, widerrufliches 
                    Recht zur Nutzung der Plattform entsprechend den vereinbarten Nutzungsbedingungen.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">4.2 Nutzungsbeschränkungen</h3>
                  <p>Der Nutzer ist nicht berechtigt:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>die Plattform für illegale Zwecke zu nutzen</li>
                    <li>die Plattform zu kopieren, zu modifizieren oder zu reverse-engineern</li>
                    <li>automatisierte Systeme zur Nutzung der Plattform einzusetzen (außer mit ausdrücklicher Genehmigung)</li>
                    <li>die Plattform zu stören oder die Sicherheit zu gefährden</li>
                    <li>Inhalte zu veröffentlichen, die gegen geltendes Recht verstoßen</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Nutzerinhalte</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">5.1 Eigentum</h3>
                  <p>
                    Der Nutzer behält das vollständige Eigentum an allen Inhalten, die er auf der Plattform 
                    erstellt oder hochlädt. {siteConfig.name} erwirbt keine Eigentumsrechte an Nutzerinhalten.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">5.2 Nutzungslizenz</h3>
                  <p>
                    Durch das Hochladen von Inhalten gewährt der Nutzer {siteConfig.name} eine nicht-exklusive, 
                    weltweite, gebührenfreie Lizenz zur Nutzung, Speicherung und Verarbeitung dieser Inhalte 
                    zum Zweck der Bereitstellung der Dienste.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">5.3 Verantwortlichkeit</h3>
                  <p>
                    Der Nutzer ist allein verantwortlich für die Inhalte, die er erstellt oder hochlädt. 
                    Der Nutzer stellt sicher, dass er alle notwendigen Rechte besitzt und dass die Inhalte 
                    nicht gegen geltendes Recht verstoßen.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Preise und Zahlung</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">6.1 Preise</h3>
                  <p>
                    Die Preise für die Nutzung der Plattform sind auf der Website angegeben. Alle Preise 
                    verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">6.2 Zahlungsbedingungen</h3>
                  <p>
                    Zahlungen sind im Voraus zu leisten, sofern nicht anders vereinbart. Bei Zahlungsverzug 
                    behält sich {siteConfig.name} vor, den Zugang zum Konto zu sperren.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">6.3 Rückerstattung</h3>
                  <p>
                    Eine Rückerstattung ist nur in gesetzlich vorgeschriebenen Fällen oder bei ausdrücklicher 
                    Vereinbarung möglich.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Verfügbarkeit und Wartung</h2>
                  <p>
                    {siteConfig.name} bemüht sich um eine hohe Verfügbarkeit der Plattform. Geplante Wartungsarbeiten 
                    werden nach Möglichkeit im Voraus angekündigt. Ein Anspruch auf Verfügbarkeit besteht nicht.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Haftung</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">8.1 Haftungsbeschränkung</h3>
                  <p>
                    {siteConfig.name} haftet nur für Vorsatz und grobe Fahrlässigkeit. Die Haftung für leichte 
                    Fahrlässigkeit ist ausgeschlossen, es sei denn, es handelt sich um die Verletzung einer 
                    wesentlichen Vertragspflicht.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">8.2 Datenverlust</h3>
                  <p>
                    Der Nutzer ist verpflichtet, regelmäßig Sicherungskopien seiner Daten zu erstellen. 
                    {siteConfig.name} haftet nicht für den Verlust von Daten, es sei denn, der Verlust ist 
                    auf Vorsatz oder grobe Fahrlässigkeit zurückzuführen.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Kündigung</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">9.1 Kündigung durch den Nutzer</h3>
                  <p>
                    Der Nutzer kann sein Konto jederzeit kündigen. Die Kündigung erfolgt über die 
                    Kontoeinstellungen oder per E-Mail an support@ing.ai.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">9.2 Kündigung durch {siteConfig.name}</h3>
                  <p>
                    {siteConfig.name} kann das Konto mit einer Frist von 14 Tagen kündigen. Das Recht zur 
                    außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">9.3 Folgen der Kündigung</h3>
                  <p>
                    Nach Kündigung wird der Zugang zum Konto gesperrt. Der Nutzer kann seine Daten innerhalb 
                    von 30 Tagen nach Kündigung exportieren. Danach werden die Daten gelöscht.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Änderungen der AGB</h2>
                  <p>
                    {siteConfig.name} behält sich vor, diese AGB zu ändern. Änderungen werden dem Nutzer 
                    per E-Mail oder über die Plattform mitgeteilt. Widerspricht der Nutzer nicht innerhalb 
                    von 14 Tagen, gelten die geänderten AGB als genehmigt.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Datenschutz</h2>
                  <p>
                    Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Informationen zur Verarbeitung 
                    Ihrer Daten finden Sie in unserer{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Datenschutzerklärung
                    </a>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Schlussbestimmungen</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">12.1 Anwendbares Recht</h3>
                  <p>
                    Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">12.2 Salvatorische Klausel</h3>
                  <p>
                    Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit 
                    der übrigen Bestimmungen unberührt.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground mt-4">12.3 Kontakt</h3>
                  <p>
                    Bei Fragen zu diesen AGB können Sie sich jederzeit an uns wenden:
                  </p>
                  <p className="mt-2">
                    <strong>{siteConfig.name}</strong><br />
                    E-Mail: support@ing.ai
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

