import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="page-content-container">
      <h1>{t("legal.privacyTitle")}</h1>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung ist der Betreiber dieser Webanwendung. Die
          Kontaktdaten finden Sie im Impressum der Hauptseite.
        </p>
      </section>

      <section>
        <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>

        <h3>2.1 Bei der Registrierung</h3>
        <p>Bei der Registrierung werden folgende Daten erhoben:</p>
        <ul>
          <li>E-Mail-Adresse (zur Authentifizierung und Kommunikation)</li>
          <li>Zeitpunkt der Registrierung</li>
        </ul>
        <p>
          Es wird kein Passwort gespeichert. Die Anmeldung erfolgt über einen "Magic Link", der an
          Ihre E-Mail-Adresse gesendet wird.
        </p>

        <h3>2.2 Bei der Nutzung der Anwendung</h3>
        <p>Bei der Nutzung werden folgende Daten gespeichert:</p>
        <ul>
          <li>Systemdaten Ihrer Wärmepumpe (Modell, Baujahr, technische Daten)</li>
          <li>Messwerte und Verbrauchsdaten</li>
          <li>Datum und Uhrzeit der Dateneingabe</li>
        </ul>
        <p>
          <strong>Wichtig:</strong> Diese Daten sind öffentlich einsehbar und werden mit Ihrer
          Nutzer-ID verknüpft. Ihre E-Mail-Adresse wird dabei nicht veröffentlicht.
        </p>
      </section>

      <section>
        <h2>3. Zweck der Datenverarbeitung</h2>
        <p>Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:</p>
        <ul>
          <li>Bereitstellung und Verwaltung Ihres Benutzerkontos</li>
          <li>Authentifizierung über Magic Link</li>
          <li>Speicherung und Darstellung Ihrer Wärmepumpendaten</li>
          <li>Ermöglichung von Vergleichen und Analysen zwischen verschiedenen Systemen</li>
          <li>Verbesserung der Anwendung</li>
        </ul>
      </section>

      <section>
        <h2>4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a
          DSGVO. Sie haben ausdrücklich zugestimmt, dass Ihre Systemdaten öffentlich zugänglich
          gemacht werden.
        </p>
      </section>

      <section>
        <h2>5. Weitergabe von Daten</h2>
        <p>
          Ihre E-Mail-Adresse wird nicht an Dritte weitergegeben. Die von Ihnen eingegebenen
          Systemdaten und Messwerte sind öffentlich einsehbar und können von anderen Nutzern
          abgerufen werden. Dies ist der Hauptzweck der Anwendung.
        </p>

        <h3>5.1 Backend und Datenbankdienst</h3>
        <p>
          Als Backend- und Datenbankdienst nutzen wir Supabase, einen Dienst der Supabase Inc., 970
          Toa Payoh North #07-04, Singapore 318992. Supabase speichert und verarbeitet Ihre
          Benutzerdaten (E-Mail-Adresse) sowie alle von Ihnen eingegebenen Systemdaten und
          Messwerte. Die Daten werden in Rechenzentren innerhalb der Europäischen Union gespeichert.
          Supabase verarbeitet diese Daten als Auftragsverarbeiter gemäß Art. 28 DSGVO.
        </p>
        <p>
          Weitere Informationen zum Datenschutz bei Supabase finden Sie unter:{" "}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
            Supabase Privacy Policy
          </a>
        </p>

        <h3>5.2 Website-Hosting</h3>
        <p>
          Die Webanwendung wird auf GitHub Pages gehostet, einem Dienst der GitHub Inc., 88 Colin P
          Kelly Jr Street, San Francisco, CA 94107, USA. GitHub Pages kann beim Aufruf der Website
          technische Informationen wie Ihre IP-Adresse, Browsertyp und Zugriffszeitpunkt in
          Serverprotokollen speichern. GitHub ist nach dem EU-US Data Privacy Framework zertifiziert
          und hat sich zur Einhaltung der DSGVO verpflichtet.
        </p>
        <p>
          Weitere Informationen zum Datenschutz bei GitHub finden Sie unter:{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Privacy Statement
          </a>
        </p>

        <h3>5.3 E-Mail-Versand</h3>
        <p>
          Für den Versand von Authentifizierungs-E-Mails (Magic Links) nutzen wir Google Mail
          (Gmail), einen Dienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4,
          Irland. Ihre E-Mail-Adresse wird an Google übermittelt, um Ihnen den Anmeldelink
          zuzustellen. Google verarbeitet diese Daten als Auftragsverarbeiter gemäß Art. 28 DSGVO.
        </p>
        <p>
          Weitere Informationen zum Datenschutz bei Google finden Sie unter:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google Datenschutzerklärung
          </a>
        </p>
      </section>

      <section>
        <h2>6. Speicherdauer</h2>
        <p>
          Ihre Daten werden gespeichert, solange Ihr Benutzerkonto besteht. Sie können Ihr Konto
          jederzeit selbstständig löschen (siehe Punkt 8).
        </p>
      </section>

      <section>
        <h2>7. Cookies und Tracking</h2>
        <p>
          Die Anwendung verwendet ausschließlich technisch notwendige Cookies für die Verwaltung
          Ihrer Sitzung. Es werden keine Tracking- oder Analyse-Cookies eingesetzt. Wir verwenden
          Cloudflare Web Analytics ohne Cookies.
        </p>
      </section>

      <section>
        <h2>8. Ihre Rechte</h2>
        <p>Sie haben folgende Rechte:</p>
        <ul>
          <li>
            <strong>Auskunft (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten
            Daten verlangen
          </li>
          <li>
            <strong>Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger
            Daten verlangen
          </li>
          <li>
            <strong>Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen
          </li>
          <li>
            <strong>Widerruf (Art. 7 Abs. 3 DSGVO):</strong> Sie können Ihre Einwilligung jederzeit
            widerrufen
          </li>
          <li>
            <strong>Beschwerde (Art. 77 DSGVO):</strong> Sie können sich bei einer Aufsichtsbehörde
            beschweren
          </li>
        </ul>

        <h3>8.1 Datenlöschung</h3>
        <p>
          Sie können Ihr Benutzerkonto jederzeit selbstständig über die Kontoverwaltung ("Mein
          Konto") löschen. Mit der Löschung werden automatisch gelöscht:
        </p>
        <ul>
          <li>Ihre E-Mail-Adresse und Kontodaten</li>
          <li>Alle von Ihnen erfassten Systemdaten</li>
          <li>Alle von Ihnen erfassten Messwerte (täglich, monatlich, jährlich)</li>
        </ul>
        <p>Die Löschung erfolgt unwiderruflich und kann nicht rückgängig gemacht werden.</p>
      </section>

      <section>
        <h2>9. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen
          zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder gegen den Zugriff
          unberechtigter Personen zu schützen. Die Übertragung erfolgt verschlüsselt über HTTPS.
        </p>
      </section>

      <section>
        <h2>10. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
          Rechtslage oder Änderungen der Anwendung anzupassen. Nutzer werden über wesentliche
          Änderungen per E-Mail informiert.
        </p>
      </section>

      <p className="page-footer-date">Stand: 17.12.2025</p>
    </div>
  );
}
