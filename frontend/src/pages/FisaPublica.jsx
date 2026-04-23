import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a3a6b";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
        {label}
      </label>
      <div style={{ position: "relative", border: "1.5px solid #d1d9ee", borderRadius: 8, background: "#fafafa", overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          width={520} height={120}
          style={{ display: "block", width: "100%", height: 120, touchAction: "none", cursor: "crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {!value && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", color: "#9ca3af", fontSize: 13,
          }}>
            ✍️ Semnați aici
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button type="button" onClick={clear}
          style={{ fontSize: 11, color: "#6b7fa8", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>
          🗑 Șterge semnătura
        </button>
      </div>
    </div>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  return iso.split("-").reverse().join(".");
}

const LABEL = {
  ro: {
    titlu: "Fișă de înregistrare turist",
    subtitlu: "Vă rugăm să completați datele înainte de sosire",
    sec1: "1. Identitate",
    prenume: "Prenume *",
    nume: "Nume *",
    sex: "Sex *",
    barbat: "Bărbat",
    femeie: "Femeie",
    data_nasterii: "Data nașterii *",
    cetatenie: "Cetățenie *",
    sec2: "2. Document de identitate",
    tip_document: "Tip document *",
    ci: "Carte de identitate (CI)",
    pasaport: "Pașaport",
    serie_numar: "Serie și număr *",
    tara_emitenta: "Țara emitentă *",
    sec3: "3. Domiciliu",
    domiciliu: "Adresă completă (stradă, număr, oraș, țară) *",
    sec4: "4. Date ședere",
    check_in: "Data sosirii",
    check_out: "Data plecării",
    sec5: "5. Confirmare",
    semnatura: "Semnătură *",
    confirmare: "Declar că datele furnizate sunt corecte și complete.",
    confirmare_tc: "Am luat la cunoștință și sunt de acord cu Politica de prelucrare a datelor cu caracter personal",
    link_tc: "Termeni și condiții",
    trimite: "Trimite fișa",
    succes_titlu: "Fișă trimisă cu succes!",
    succes_text: "Vă mulțumim. Datele au fost înregistrate. Ne vedem la check-in!",
    eroare_trimis: "A apărut o eroare. Vă rugăm să încercați din nou.",
    camp_obligatoriu: "Completați toate câmpurile obligatorii (*) și bifați confirmarea.",
    invalid: "Link invalid sau fișa nu mai este disponibilă.",
    deja_completat: "Această fișă a fost deja completată. Vă mulțumim!",
    rezervare: "Nr. rezervare",
  },
  en: {
    titlu: "Guest Registration Form",
    subtitlu: "Please fill in your details before arrival",
    sec1: "1. Identity",
    prenume: "First name *",
    nume: "Last name *",
    sex: "Gender *",
    barbat: "Male",
    femeie: "Female",
    data_nasterii: "Date of birth *",
    cetatenie: "Nationality *",
    sec2: "2. Identity document",
    tip_document: "Document type *",
    ci: "Identity card (ID)",
    pasaport: "Passport",
    serie_numar: "Series and number *",
    tara_emitenta: "Issuing country *",
    sec3: "3. Home address",
    domiciliu: "Full address (street, number, city, country) *",
    sec4: "4. Stay details",
    check_in: "Arrival date",
    check_out: "Departure date",
    sec5: "5. Confirmation",
    semnatura: "Signature *",
    confirmare: "I declare that the information provided is correct and complete.",
    confirmare_tc: "I have read and agree with the Personal Data Processing Policy",
    link_tc: "Terms and conditions",
    trimite: "Submit form",
    succes_titlu: "Form submitted successfully!",
    succes_text: "Thank you. Your details have been recorded. See you at check-in!",
    eroare_trimis: "An error occurred. Please try again.",
    camp_obligatoriu: "Please fill in all required fields (*) and check the confirmation box.",
    invalid: "Invalid link or form is no longer available.",
    deja_completat: "This form has already been completed. Thank you!",
    rezervare: "Booking number",
  },
};

const inputStyle = {
  width: "100%", padding: "8px 10px", border: "1.5px solid #d1d9ee",
  borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", background: "#fff",
};

export default function FisaPublica() {
  const { token } = useParams();
  const [fisa, setFisa] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [dejaCompletat, setDejaCompletat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [succes, setSucces] = useState(false);
  const [eroare, setEroare] = useState(null);
  const [validationErr, setValidationErr] = useState(false);

  const [limba, setLimba] = useState("ro");
  const L = LABEL[limba];

  const [form, setForm] = useState({
    prenume: "", sex: "", data_nasterii: "", cetatenie: "",
    tip_document: "", serie_numar: "", tara_emitenta: "",
    domiciliu: "", semnatura_img: null, confirmare_date: false,
    confirmare_tc: false,
  });

  useEffect(() => {
    fetch(`/api/fisa/${token}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.status === "completat") { setDejaCompletat(true); setLoading(false); return; }
        setFisa(d);
        const parts = (d.nume_turist || "").trim().split(" ");
        const prenume = d.prenume || (parts.length > 1 ? parts[0] : "");
        const numeFamilie = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
        setFisa({ ...d, _nume: numeFamilie });
        setForm((f) => ({
          ...f,
          prenume,
          cetatenie: d.cetatenie || "",
        }));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
    setValidationErr(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const required = ["sex", "data_nasterii", "cetatenie",
                      "tip_document", "serie_numar", "tara_emitenta", "domiciliu"];
    if (required.some((k) => !form[k]?.trim()) || !form.semnatura_img || !form.confirmare_date || !form.confirmare_tc) {
      setValidationErr(true);
      return;
    }
    setSubmitting(true);
    setEroare(null);
    try {
      const body = {
        ...form,
        nume: fisa.nume_turist,
      };
      const res = await fetch(`/api/fisa/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setEroare(L.eroare_trimis); return; }
      setSucces(true);
    } catch { setEroare(L.eroare_trimis); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6b7fa8" }}>⏳ Se încarcă...</div>
    </div>
  );

  if (notFound) return <PageMsg icon="❌" text={LABEL[limba].invalid} limba={limba} setLimba={setLimba} />;
  if (dejaCompletat) return <PageMsg icon="✅" text={LABEL[limba].deja_completat} limba={limba} setLimba={setLimba} />;
  if (succes) return <PageMsg icon="🎉" text={L.succes_titlu} sub={L.succes_text} limba={limba} setLimba={setLimba} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a3a6b" }}>🏠 Property Management</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["ro", "en"].map((l) => (
              <button key={l} onClick={() => setLimba(l)} style={{
                padding: "4px 12px", borderRadius: 6, border: "1.5px solid",
                borderColor: limba === l ? "#1a3a6b" : "#d1d9ee",
                background: limba === l ? "#1a3a6b" : "#fff",
                color: limba === l ? "#fff" : "#374151",
                fontWeight: 600, cursor: "pointer", fontSize: 12,
              }}>{l === "ro" ? "🇷🇴 RO" : "🇬🇧 EN"}</button>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 24px rgba(26,58,107,0.10)", overflow: "hidden" }}>
          {/* Banner */}
          <div style={{ background: "#1a3a6b", padding: "20px 24px", color: "#fff" }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{L.titlu}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{L.subtitlu}</div>
            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
              {L.rezervare}: <strong>{fisa.booking_id}</strong>
              {" · "} {fmt(fisa.check_in)} → {fmt(fisa.check_out)}
              {fisa.nume_turist && <>{" · "} {fisa.nume_turist}</>}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>

            {/* Secțiunea 1 */}
            <Section title={L.sec1} />
            <Row>
              <Field label={L.prenume}>
                <input style={{ ...inputStyle, background: "#f9fafb" }} value={form.prenume} disabled />
              </Field>
              <Field label={L.nume}>
                <input style={{ ...inputStyle, background: "#f9fafb" }} value={fisa._nume || fisa.nume_turist || ""} disabled />
              </Field>
            </Row>
            <Row>
              <Field label={L.sex}>
                <select style={inputStyle} value={form.sex} onChange={(e) => set("sex", e.target.value)}>
                  <option value="">—</option>
                  <option value="M">{L.barbat}</option>
                  <option value="F">{L.femeie}</option>
                </select>
              </Field>
              <Field label={L.data_nasterii}>
                <input style={inputStyle} type="date" value={form.data_nasterii} onChange={(e) => set("data_nasterii", e.target.value)} />
              </Field>
            </Row>
            <Field label={L.cetatenie}>
              <input style={inputStyle} value={form.cetatenie} onChange={(e) => set("cetatenie", e.target.value)} />
            </Field>

            {/* Secțiunea 2 */}
            <Section title={L.sec2} />
            <Field label={L.tip_document}>
              <select style={inputStyle} value={form.tip_document} onChange={(e) => set("tip_document", e.target.value)}>
                <option value="">—</option>
                <option value="CI">{L.ci}</option>
                <option value="pasaport">{L.pasaport}</option>
              </select>
            </Field>
            <Row>
              <Field label={L.serie_numar}>
                <input style={inputStyle} value={form.serie_numar} onChange={(e) => set("serie_numar", e.target.value)} />
              </Field>
              <Field label={L.tara_emitenta}>
                <input style={inputStyle} value={form.tara_emitenta} onChange={(e) => set("tara_emitenta", e.target.value)} />
              </Field>
            </Row>

            {/* Secțiunea 3 */}
            <Section title={L.sec3} />
            <Field label={L.domiciliu}>
              <textarea style={{ ...inputStyle, resize: "vertical" }} value={form.domiciliu} onChange={(e) => set("domiciliu", e.target.value)} rows={2} />
            </Field>

            {/* Secțiunea 4 */}
            <Section title={L.sec4} />
            <Row>
              <Field label={L.check_in}>
                <input style={{ ...inputStyle, background: "#f9fafb" }} value={fmt(fisa.check_in)} disabled />
              </Field>
              <Field label={L.check_out}>
                <input style={{ ...inputStyle, background: "#f9fafb" }} value={fmt(fisa.check_out)} disabled />
              </Field>
            </Row>

            {/* Secțiunea 5 */}
            <Section title={L.sec5} />
            <SignaturePad
              value={form.semnatura_img}
              onChange={(img) => { setForm((f) => ({ ...f, semnatura_img: img })); setValidationErr(false); }}
              label={L.semnatura}
            />
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={form.confirmare_date}
                onChange={(e) => set("confirmare_date", e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151" }}>{L.confirmare}</span>
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.confirmare_tc}
                onChange={(e) => set("confirmare_tc", e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151" }}>
                {L.confirmare_tc}
              </span>
            </label>
            <div style={{ marginTop: 6, marginLeft: 26 }}>
              <a
                href={`/termeni?lang=${limba}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: "#1a3a6b", fontWeight: 600, textDecoration: "underline" }}
              >
                {L.link_tc}
              </a>
            </div>

            {validationErr && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2",
                border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
                ⚠️ {L.camp_obligatoriu}
              </div>
            )}
            {eroare && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2",
                border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
                ❌ {eroare}
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              marginTop: 20, width: "100%", padding: "13px", borderRadius: 8,
              background: "#1a3a6b", color: "#fff", fontWeight: 700, fontSize: 15,
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? "⏳ Se trimite..." : L.trimite}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
          Property Management · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

function Section({ title }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a3a6b", margin: "18px 0 10px",
      paddingBottom: 6, borderBottom: "2px solid #e0e7ff" }}>{title}</div>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", gap: 12 }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div style={{ flex: 1, marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function PageMsg({ icon, text, sub, limba, setLimba }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: "#1a3a6b", marginBottom: 8 }}>{text}</div>
        {sub && <div style={{ fontSize: 14, color: "#6b7fa8" }}>{sub}</div>}
        <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center" }}>
          {["ro", "en"].map((l) => (
            <button key={l} onClick={() => setLimba(l)} style={{
              padding: "4px 12px", borderRadius: 6, border: "1.5px solid",
              borderColor: limba === l ? "#1a3a6b" : "#d1d9ee",
              background: limba === l ? "#1a3a6b" : "#fff",
              color: limba === l ? "#fff" : "#374151",
              fontWeight: 600, cursor: "pointer", fontSize: 12,
            }}>{l === "ro" ? "🇷🇴 RO" : "🇬🇧 EN"}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
