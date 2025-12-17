"use client"

import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import Glow from '@/components/ui/glow'
import { Badge } from '@/components/ui/badge'

export default function PrivacyPage() {
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
                Datenschutzerklärung
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
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Verantwortlicher</h2>
                  <p>
                    Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                  </p>
                  <p className="mt-2">
                    <strong>{siteConfig.name}</strong><br />
                    E-Mail: support@ing.ai
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Erhebung und Speicherung personenbezogener Daten</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Beim Besuch der Website</h3>
                  <p>
                    Beim Aufruf unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser 
                    automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden 
                    temporär in einem sogenannten Logfile gespeichert. Folgende Informationen werden dabei ohne 
                    Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>IP-Adresse des anfragenden Rechners</li>
                    <li>Datum und Uhrzeit des Zugriffs</li>
                    <li>Name und URL der abgerufenen Datei</li>
                    <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                    <li>verwendeter Browser und ggf. das Betriebssystem Ihres Rechners sowie der Name Ihres Access-Providers</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.2 Bei Registrierung</h3>
                  <p>
                    Wenn Sie sich für ein Konto registrieren, erheben wir folgende Daten:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>E-Mail-Adresse</li>
                    <li>Passwort (verschlüsselt gespeichert)</li>
                    <li>Name (optional)</li>
                    <li>Registrierungsdatum</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Nutzung Ihrer Daten</h2>
                  <p>
                    Wir verwenden die von Ihnen zur Verfügung gestellten personenbezogenen Daten für folgende Zwecke:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Bereitstellung und Verbesserung unserer Dienste</li>
                    <li>Kommunikation mit Ihnen bezüglich unserer Dienste</li>
                    <li>Erfüllung unserer vertraglichen Verpflichtungen</li>
                    <li>Erfüllung gesetzlicher Aufbewahrungspflichten</li>
                    <li>Gewährleistung der Sicherheit und Stabilität unserer Systeme</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Weitergabe von Daten</h2>
                  <p>
                    Eine Übermittlung Ihrer persönlichen Daten an Dritte erfolgt grundsätzlich nicht, außer:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Sie haben ausdrücklich eingewilligt</li>
                    <li>die Weitergabe zur Erfüllung vertraglicher Verpflichtungen erforderlich ist</li>
                    <li>die Weitergabe zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist</li>
                    <li>die Weitergabe zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Cookies</h2>
                  <p>
                    Wir setzen auf unserer Seite Cookies ein. Hierbei handelt es sich um kleine Dateien, die Ihr 
                    Browser automatisch erstellt und die auf Ihrem Endgerät (Laptop, Tablet, Smartphone o.ä.) 
                    gespeichert werden, wenn Sie unsere Seite besuchen. Cookies richten auf Ihrem Endgerät keinen 
                    Schaden an, enthalten keine Viren, Trojaner oder sonstige Schadsoftware.
                  </p>
                  <p className="mt-2">
                    Wir setzen Cookies ein, um unsere Website nutzerfreundlicher zu gestalten. Einige Funktionen 
                    unserer Internetseite können ohne den Einsatz von Cookies nicht angeboten werden.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Ihre Rechte</h2>
                  <p>Sie haben das Recht:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten</li>
                    <li>Berichtigung unrichtiger Daten zu verlangen</li>
                    <li>Löschung Ihrer bei uns gespeicherten Daten zu verlangen</li>
                    <li>Einschränkung der Datenverarbeitung zu verlangen</li>
                    <li>Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten einzulegen</li>
                    <li>Datenübertragbarkeit zu verlangen</li>
                    <li>Beschwerde bei einer Aufsichtsbehörde einzulegen</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Datensicherheit</h2>
                  <p>
                    Wir verwenden moderne Sicherheitstechnologien, um Ihre Daten zu schützen. Die Übertragung 
                    von Daten erfolgt verschlüsselt über SSL/TLS. Ihre Passwörter werden mit modernen 
                    Verschlüsselungsverfahren gespeichert.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Speicherdauer</h2>
                  <p>
                    Personenbezogene Daten werden gelöscht, sobald der Zweck der Speicherung entfällt oder Sie 
                    die Löschung verlangen, es sei denn, gesetzliche Aufbewahrungspflichten stehen einer Löschung 
                    entgegen.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Änderungen dieser Datenschutzerklärung</h2>
                  <p>
                    Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen 
                    rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der 
                    Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue 
                    Datenschutzerklärung.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Kontakt</h2>
                  <p>
                    Bei Fragen zum Datenschutz können Sie sich jederzeit an uns wenden:
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

