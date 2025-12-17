import Link from "next/link";
import { LandingHeader, Footer } from "@/components/landing";

export const metadata = {
  title: "Privacybeleid - Treni",
  description: "Lees hoe Treni omgaat met je persoonlijke gegevens en privacy.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />
      
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Privacybeleid
            </h1>
            <p className="text-muted-foreground">
              Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="lead text-lg text-muted-foreground">
              Bij Treni hechten we veel waarde aan je privacy. Dit privacybeleid beschrijft 
              hoe wij je persoonlijke gegevens verzamelen, gebruiken en beschermen wanneer je 
              onze diensten gebruikt.
            </p>

            <h2>1. Welke gegevens verzamelen wij?</h2>
            
            <h3>Accountgegevens</h3>
            <p>
              Wanneer je een account aanmaakt, verzamelen wij:
            </p>
            <ul>
              <li>Naam en e-mailadres</li>
              <li>Profielfoto (indien je deze uploadt of via Google inlogt)</li>
              <li>Wachtwoord (versleuteld opgeslagen)</li>
              <li>Taalvoorkeur</li>
            </ul>

            <h3>Trainingsgegevens</h3>
            <p>
              Om gepersonaliseerde trainingsschema&apos;s te maken, verzamelen wij:
            </p>
            <ul>
              <li>Ervaringsniveau en trainingsdoelen</li>
              <li>Beschikbare trainingsuren en voorkeursdagen</li>
              <li>Voltooide trainingen en activiteiten</li>
              <li>Prestatiemetingen zoals afstand, tempo, hartslag en hoogteverschil</li>
              <li>GPS-routes (indien beschikbaar)</li>
            </ul>

            <h3>Integraties met derden</h3>
            <p>
              Als je ervoor kiest om externe diensten te koppelen, kunnen wij gegevens ontvangen van:
            </p>
            <ul>
              <li>
                <strong>Garmin Connect:</strong> Trainingsgegevens, activiteiten en 
                prestatiestatistieken die je synchroniseert
              </li>
              <li>
                <strong>Google Account:</strong> Naam, e-mailadres en profielfoto wanneer 
                je inlogt met Google
              </li>
            </ul>

            <h2>2. Waarvoor gebruiken wij je gegevens?</h2>
            <p>Wij gebruiken je gegevens voor de volgende doeleinden:</p>
            <ul>
              <li>
                <strong>Dienstverlening:</strong> Het aanmaken en beheren van je account, 
                het genereren van gepersonaliseerde trainingsschema&apos;s
              </li>
              <li>
                <strong>Personalisatie:</strong> Het aanpassen van trainingen aan jouw 
                niveau, beschikbaarheid en doelen
              </li>
              <li>
                <strong>Voortgang bijhouden:</strong> Het tonen van statistieken en 
                voortgang richting je doelen
              </li>
              <li>
                <strong>Communicatie:</strong> Het versturen van trainingsherinneringen 
                en belangrijke accountmeldingen (indien ingeschakeld)
              </li>
              <li>
                <strong>Verbetering:</strong> Het analyseren van gebruikspatronen om 
                onze diensten te verbeteren
              </li>
            </ul>

            <h2>3. Hoe beschermen wij je gegevens?</h2>
            <p>
              Wij nemen de beveiliging van je gegevens serieus en hebben de volgende 
              maatregelen getroffen:
            </p>
            <ul>
              <li>Alle gegevens worden versleuteld verzonden via HTTPS</li>
              <li>Wachtwoorden worden gehasht opgeslagen met moderne algoritmes</li>
              <li>Onze database heeft Row Level Security (RLS) ingeschakeld</li>
              <li>Toegang tot gegevens is beperkt tot wat strikt noodzakelijk is</li>
              <li>Regelmatige beveiligingsaudits en updates</li>
            </ul>

            <h2>4. Met wie delen wij je gegevens?</h2>
            <p>
              Wij verkopen je gegevens nooit aan derden. Wij kunnen gegevens delen met:
            </p>
            <ul>
              <li>
                <strong>Dienstverleners:</strong> Partijen die ons helpen bij het 
                leveren van onze diensten (hosting, e-mail), onder strikte 
                vertrouwelijkheidsovereenkomsten
              </li>
              <li>
                <strong>Integratiepartners:</strong> Alleen de gegevens die nodig zijn 
                voor de door jou gekozen koppelingen (zoals Garmin)
              </li>
              <li>
                <strong>Wettelijke verplichtingen:</strong> Indien wij hiertoe verplicht 
                zijn door de wet
              </li>
            </ul>

            <h2>5. Je rechten</h2>
            <p>
              Onder de AVG (Algemene Verordening Gegevensbescherming) heb je de volgende rechten:
            </p>
            <ul>
              <li>
                <strong>Inzage:</strong> Je kunt opvragen welke gegevens wij van je hebben
              </li>
              <li>
                <strong>Correctie:</strong> Je kunt onjuiste gegevens laten aanpassen
              </li>
              <li>
                <strong>Verwijdering:</strong> Je kunt verzoeken om je gegevens te verwijderen
              </li>
              <li>
                <strong>Overdracht:</strong> Je kunt een kopie van je gegevens opvragen
              </li>
              <li>
                <strong>Bezwaar:</strong> Je kunt bezwaar maken tegen bepaald gebruik van 
                je gegevens
              </li>
            </ul>
            <p>
              Om deze rechten uit te oefenen, kun je contact met ons opnemen via het 
              e-mailadres onderaan deze pagina.
            </p>

            <h2>6. Cookies en tracking</h2>
            <p>
              Wij gebruiken alleen functionele cookies die noodzakelijk zijn voor het 
              functioneren van de website, zoals:
            </p>
            <ul>
              <li>Sessiecookies om je ingelogd te houden</li>
              <li>Taalvoorkeur cookie</li>
            </ul>
            <p>
              Wij gebruiken geen tracking cookies of analytics van derden die je 
              persoonlijk kunnen identificeren.
            </p>

            <h2>7. Bewaartermijnen</h2>
            <p>
              Wij bewaren je gegevens zolang je account actief is. Na het verwijderen 
              van je account worden je gegevens binnen 30 dagen definitief verwijderd, 
              tenzij wij wettelijk verplicht zijn deze langer te bewaren.
            </p>

            <h2>8. Wijzigingen in dit beleid</h2>
            <p>
              Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Bij belangrijke 
              wijzigingen zullen wij je hiervan op de hoogte stellen via e-mail of een 
              melding in de app. De datum bovenaan dit document geeft aan wanneer het 
              beleid voor het laatst is bijgewerkt.
            </p>

            <h2>9. Contact</h2>
            <p>
              Heb je vragen over dit privacybeleid of wil je je rechten uitoefenen? 
              Neem dan contact met ons op:
            </p>
            <ul>
              <li>
                <strong>E-mail:</strong>{" "}
                <a href="mailto:privacy@treni.app" className="text-primary hover:underline">
                  privacy@treni.app
                </a>
              </li>
            </ul>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                Door gebruik te maken van Treni ga je akkoord met dit privacybeleid. 
                Bekijk ook onze{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  algemene voorwaarden
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

