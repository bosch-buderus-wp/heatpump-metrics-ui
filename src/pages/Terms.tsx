import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", textAlign: "left" }}>
      <h1>{t("legal.termsTitle")}</h1>

      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Nutzungsbedingungen gelten für die Nutzung der Heatpump Metrics Webanwendung
          (nachfolgend "Anwendung"). Mit der Registrierung und Nutzung der Anwendung erklären Sie
          sich mit diesen Bedingungen einverstanden.
        </p>
      </section>

      <section>
        <h2>2. Beschreibung des Dienstes</h2>
        <p>
          Die Anwendung ermöglicht es Nutzern, Daten zu Wärmepumpen zu erfassen, zu verwalten und zu
          analysieren. Die erfassten Daten werden öffentlich zugänglich gemacht und können von
          anderen Nutzern eingesehen werden.
        </p>
      </section>

      <section>
        <h2>3. Registrierung und Nutzerkonto</h2>
        <p>
          Für die Nutzung der Anwendung ist eine Registrierung mit einer gültigen E-Mail-Adresse
          erforderlich. Sie sind verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu
          machen. Die Zugangsdaten sind vertraulich zu behandeln und dürfen nicht an Dritte
          weitergegeben werden.
        </p>
      </section>

      <section>
        <h2>4. Öffentliche Daten</h2>
        <p>
          <strong>Wichtig:</strong> Alle von Ihnen eingegebenen Systemdaten und Messwerte sind
          öffentlich einsehbar. Geben Sie keine personenbezogenen oder vertraulichen Informationen
          in die Systemfelder ein. Ihre E-Mail-Adresse bleibt privat und wird nicht veröffentlicht.
        </p>
      </section>

      <section>
        <h2>5. Nutzerpflichten</h2>
        <p>Der Nutzer verpflichtet sich:</p>
        <ul>
          <li>Die Anwendung nur für legale Zwecke zu nutzen</li>
          <li>Keine falschen oder irreführenden Daten einzugeben</li>
          <li>Die Rechte Dritter nicht zu verletzen</li>
          <li>Keine schädlichen Inhalte (Viren, Malware etc.) zu übertragen</li>
        </ul>
      </section>

      <section>
        <h2>6. Datenlöschung</h2>
        <p>
          Sie können Ihr Benutzerkonto jederzeit selbstständig löschen. Dies erfolgt über die
          Kontoverwaltung ("Mein Konto"). Mit der Löschung Ihres Kontos werden alle Ihre
          persönlichen Daten sowie alle von Ihnen erfassten Systemdaten und Messwerte unwiderruflich
          gelöscht.
        </p>
      </section>

      <section>
        <h2>7. Haftungsausschluss</h2>
        <p>
          Die Anwendung wird "wie besehen" zur Verfügung gestellt. Wir übernehmen keine Gewähr für
          die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Daten. Die Nutzung
          erfolgt auf eigenes Risiko. Wir haften nicht für Schäden, die durch die Nutzung oder
          Nicht-Nutzung der Anwendung entstehen, es sei denn, diese beruhen auf Vorsatz oder grober
          Fahrlässigkeit unsererseits.
        </p>
      </section>

      <section>
        <h2>8. Änderungen der Nutzungsbedingungen</h2>
        <p>
          Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Nutzer werden über
          wesentliche Änderungen per E-Mail informiert. Die Fortsetzung der Nutzung nach einer
          Änderung gilt als Zustimmung zu den geänderten Bedingungen.
        </p>
      </section>

      <section>
        <h2>9. Beendigung</h2>
        <p>
          Wir behalten uns das Recht vor, Nutzerkonten bei Verstößen gegen diese Nutzungsbedingungen
          ohne Vorankündigung zu sperren oder zu löschen.
        </p>
      </section>

      <section>
        <h2>10. Anwendbares Recht</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts
          (CISG).
        </p>
      </section>

      <p style={{ marginTop: "40px", fontSize: "0.9em", color: "#666" }}>Stand: 17.12.2025</p>
    </div>
  );
}
