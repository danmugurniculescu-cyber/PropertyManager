import { useSearchParams } from "react-router-dom";

const SITE_URL = "https://propertymanager-dnrentals.up.railway.app";

const CONTINUT = {
  ro: `POLITICA DE PRELUCRARE A DATELOR CU CARACTER PERSONAL
TERMENI ȘI CONDIȚII

OPERATOR

Operatorul de date cu caracter personal este Dan Mugur Niculescu, persoană fizică, proprietar al unităților de cazare turistică, denumit în continuare „Operatorul".

Prin completarea prezentei fișe de înregistrare, turiștii furnizează datele lor personale Operatorului, în vederea îndeplinirii obligațiilor legale privind evidența turiștilor.

SCOPUL PRELUCRĂRII DATELOR

Datele cu caracter personal sunt colectate exclusiv în vederea respectării obligației legale prevăzute de Anexa Normei privind accesul, evidența și protecția turiștilor în structuri de primire turistice din 08.02.2001, parte integrantă din Hotărârea de Guvern nr. 237/2001.

Nu utilizăm datele dumneavoastră în scopuri de marketing, nu le transmitem unor terți în afara cazurilor prevăzute de lege și nu le folosim în alte scopuri decât cel descris mai sus.

DATE COLECTATE

În vederea îndeplinirii obligației legale, sunt colectate următoarele date:
- Nume și prenume
- Sex și data nașterii
- Cetățenie
- Tip document de identitate, serie și număr
- Țara emitentă a documentului
- Adresa de domiciliu
- Semnătura
- Data sosirii și data plecării
- Numărul rezervării

TEMEIUL LEGAL AL PRELUCRĂRII

Prelucrarea datelor se realizează în baza:
- Obligației legale (art. 6 alin. 1 lit. c din Regulamentul GDPR): Hotărârea de Guvern nr. 237/2001 privind evidența turiștilor în structuri de primire turistice
- Consimțământului explicit exprimat prin bifarea căsuței de acord de pe formularul de înregistrare

PERIOADA DE STOCARE

Datele personale se păstrează pe o perioadă de 5 ani de la data înregistrării, conform cerințelor legale în vigoare. La expirarea acestui termen, datele sunt șterse definitiv.

DREPTURILE DUMNEAVOASTRĂ (GDPR)

În calitate de persoană vizată, aveți următoarele drepturi:

Dreptul de acces — puteți solicita o copie a datelor personale pe care le deținem despre dumneavoastră.

Dreptul de rectificare — puteți solicita corectarea datelor inexacte sau incomplete.

Dreptul la ștergere — puteți solicita ștergerea datelor, în limitele permise de obligațiile legale de stocare.

Dreptul la restricționarea prelucrării — puteți solicita limitarea prelucrării datelor dumneavoastră în anumite condiții.

Dreptul de opoziție — puteți vă opune prelucrării datelor pentru motive legate de situația dumneavoastră particulară, în limitele prevăzute de lege.

Dreptul la portabilitatea datelor — puteți solicita datele dumneavoastră într-un format structurat și lizibil automat.

EXERCITAREA DREPTURILOR

Pentru orice solicitare privind datele dumneavoastră personale, ne puteți contacta la adresa de email: danmugur.niculescu@gmail.com

De asemenea, aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP):
- Adresă: B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, cod poștal 010336, București, România
- Website: www.dataprotection.ro

SECURITATEA DATELOR

Datele dumneavoastră sunt stocate în condiții de securitate, pe servere protejate, cu acces restricționat exclusiv proprietarului. Nu sunt accesate de terți neautorizați.

MODIFICĂRI ALE POLITICII

Operatorul își rezervă dreptul de a modifica prezenta politică. Versiunea actualizată va fi disponibilă la adresa ${SITE_URL}/termeni.`,

  en: `PERSONAL DATA PROCESSING POLICY
TERMS AND CONDITIONS

DATA CONTROLLER

The data controller is Dan Mugur Niculescu, private individual, owner of tourist accommodation units, hereinafter referred to as the "Controller".

By completing this registration form, guests provide their personal data to the Controller in order to fulfil legal obligations regarding tourist records.

PURPOSE OF DATA PROCESSING

Personal data is collected exclusively to comply with the legal obligation set out in the Annex to the Norm on the access, records and protection of tourists in tourist reception structures of 08.02.2001, an integral part of Government Decision no. 237/2001.

We do not use your data for marketing purposes, do not share it with third parties except as required by law, and do not use it for any purpose other than described above.

DATA COLLECTED

In order to fulfil the legal obligation, the following data is collected:
- Full name (first and last name)
- Gender and date of birth
- Nationality
- Type of identity document, series and number
- Country of document issuance
- Home address
- Signature
- Arrival and departure date
- Booking reference number

LEGAL BASIS FOR PROCESSING

Data processing is carried out on the basis of:
- Legal obligation (Art. 6(1)(c) GDPR): Government Decision no. 237/2001 on tourist records in accommodation facilities
- Explicit consent expressed by ticking the agreement checkbox on the registration form

STORAGE PERIOD

Personal data is retained for a period of 5 years from the date of registration, in accordance with applicable legal requirements. Upon expiry of this period, data is permanently deleted.

YOUR RIGHTS (GDPR)

As a data subject, you have the following rights:

Right of access — you may request a copy of the personal data we hold about you.

Right to rectification — you may request the correction of inaccurate or incomplete data.

Right to erasure — you may request deletion of your data, within the limits permitted by legal storage obligations.

Right to restriction of processing — you may request limitation of the processing of your data under certain conditions.

Right to object — you may object to the processing of your data for reasons related to your particular situation, within the limits provided by law.

Right to data portability — you may request your data in a structured, machine-readable format.

EXERCISING YOUR RIGHTS

For any request regarding your personal data, you may contact us at: danmugur.niculescu@gmail.com

You also have the right to lodge a complaint with the National Supervisory Authority for Personal Data Processing (ANSPDCP):
- Address: B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, postal code 010336, Bucharest, Romania
- Website: www.dataprotection.ro

DATA SECURITY

Your data is stored securely on protected servers, with access restricted exclusively to the property owner. It is not accessed by unauthorized third parties.

POLICY CHANGES

The Controller reserves the right to modify this policy. The updated version will be available at ${SITE_URL}/termeni.`,
};

export default function TermeniConditii() {
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "ro";
  const text = CONTINUT[lang];
  const title = lang === "ro" ? "Termeni și Condiții" : "Terms and Conditions";

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", padding: "24px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a3a6b" }}>🏠 Property Management</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["ro", "en"].map((l) => (
              <a
                key={l}
                href={`/termeni?lang=${l}`}
                style={{
                  padding: "4px 12px", borderRadius: 6, border: "1.5px solid",
                  borderColor: lang === l ? "#1a3a6b" : "#d1d9ee",
                  background: lang === l ? "#1a3a6b" : "#fff",
                  color: lang === l ? "#fff" : "#374151",
                  fontWeight: 600, cursor: "pointer", fontSize: 12,
                  textDecoration: "none",
                }}
              >
                {l === "ro" ? "🇷🇴 RO" : "🇬🇧 EN"}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 14,
          boxShadow: "0 4px 24px rgba(26,58,107,0.10)",
          overflow: "hidden",
        }}>
          {/* Banner */}
          <div style={{ background: "#1a3a6b", padding: "20px 28px", color: "#fff" }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{title}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{SITE_URL}</div>
          </div>

          {/* Conținut */}
          <div style={{ padding: "28px 32px" }}>
            {text.split("\n\n").map((paragraf, i) => {
              const isHeading = paragraf.length < 80 && paragraf === paragraf.toUpperCase() && !paragraf.startsWith("-") && !paragraf.startsWith("(");
              if (isHeading) {
                return (
                  <div key={i} style={{
                    fontWeight: 700, fontSize: 14, color: "#1a3a6b",
                    margin: "24px 0 8px",
                    paddingBottom: 6, borderBottom: "2px solid #e0e7ff",
                  }}>
                    {paragraf}
                  </div>
                );
              }
              // Bullet list
              if (paragraf.includes("\n-")) {
                const [intro, ...items] = paragraf.split("\n-");
                return (
                  <div key={i} style={{ marginBottom: 14 }}>
                    {intro && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: "0 0 6px" }}>{intro}</p>}
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {items.map((item, j) => (
                        <li key={j} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 3 }}>
                          {item.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return (
                <p key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, marginBottom: 14, whiteSpace: "pre-line" }}>
                  {paragraf}
                </p>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
          Property Management · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
