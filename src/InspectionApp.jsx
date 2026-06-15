import { useState, useEffect, useRef } from "react";
import { useB } from "./contexts/ThemeContext";
import { list as listVehicles } from "./api/vehicles";
import { fetchSections, submitInspection, uploadInspectionMedia, deleteInspectionMedia } from "./api/inspections";

// Map API vehicle shape to the shape used throughout this component
function mapVehicle(v) {
  return {
    id:    v.id,
    plate: v.plate,
    make:  v.make,
    model: v.model,
    type:  v.vehicle_type?.code ?? "",
  };
}

function CheckItem({ item, value, onChange, flagNote, onNoteChange }) {
  const B = useB();
  const passed  = value === "pass";
  const flagged = value === "flag";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: flagged ? "#b91c1c" : B.offWhite }}>
          {item.label}
        </span>
        <button onClick={() => onChange("pass")} style={{
          padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 18,
          background: passed ? B.green : B.navyLight, color: passed ? "#FFFFFF" : B.muted,
        }}>✓</button>
        <button onClick={() => onChange("flag")} style={{
          padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 18,
          background: flagged ? B.red : B.navyLight, color: flagged ? "#FFFFFF" : B.muted,
        }}>⚑</button>
      </div>
      {flagged && (
        <input
          value={flagNote || ""}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Describe the issue…"
          style={{
            width: "100%", borderRadius: 8, padding: "7px 10px", fontSize: 12, marginTop: 6,
            border: `1px solid ${B.statusRedBorder}`, background: B.statusRedBg,
            color: "#991b1b", outline: "none", boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

export default function InspectionApp() {
  const B = useB();

  // Navigation
  const [screen,  setScreen]  = useState("home");
  const [type,    setType]    = useState("pre");
  const [vehicle, setVehicle] = useState(null);

  // API data
  const [vehicles,        setVehicles]        = useState([]);
  const [sections,        setSections]        = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  // Vehicle search
  const [search, setSearch] = useState("");

  // Inspection form state
  const [checks,    setChecks]    = useState({});
  const [flagNotes, setFlagNotes] = useState({});
  const [leadman,   setLeadman]   = useState("");
  const [driver,    setDriver]    = useState("");
  const [tripKm,    setTripKm]    = useState("");
  const [tripHours, setTripHours] = useState("");
  const [notes,     setNotes]     = useState("");

  // Media attachments (before save)
  const [mediaFiles,   setMediaFiles]   = useState([]);
  const fileInputRef = useRef(null);

  // Submission
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  // Fetch active vehicles once on mount
  useEffect(() => {
    setLoadingVehicles(true);
    listVehicles({ status: "active", per_page: 100 })
      .then(res => setVehicles((res.data ?? []).map(mapVehicle)))
      .catch(console.error)
      .finally(() => setLoadingVehicles(false));
  }, []);

  // Fetch checklist sections whenever inspection type changes
  useEffect(() => {
    setLoadingSections(true);
    setSections([]);
    fetchSections(type)
      .then(res => setSections(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingSections(false));
  }, [type]);

  function startInspection(v) {
    setVehicle(v);
    setChecks({});
    setFlagNotes({});
    setLeadman(""); setDriver(""); setTripKm(""); setTripHours(""); setNotes("");
    setMediaFiles([]);
    setSubmitError(null);
    setScreen("form");
  }

  async function handleSaveReport() {
    const items = Object.entries(checks).map(([itemId, status]) => ({
      checklist_item_id: parseInt(itemId, 10),
      status,
      issue_description: status === "flag" ? (flagNotes[itemId] || null) : null,
    }));

    if (items.length === 0) {
      setSubmitError("Please check at least one item before saving.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitInspection({
        vehicle_id:      vehicle.id,
        inspection_type: type,
        driver:          driver    || null,
        leadman:         leadman   || null,
        trip_km:         tripKm    ? parseFloat(tripKm)    : null,
        hours:           tripHours ? parseFloat(tripHours) : null,
        notes:           notes     || null,
        items,
      });

      if (mediaFiles.length > 0) {
        await uploadInspectionMedia(result.data?.id, mediaFiles);
      }

      // Reset and return home
      setChecks({});
      setFlagNotes({});
      setLeadman(""); setDriver(""); setTripKm(""); setTripHours(""); setNotes("");
      setMediaFiles([]);
      setScreen("home");
    } catch (err) {
      setSubmitError(err.message || "Failed to save inspection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: 500,
    border: `1px solid ${B.navyBorder}`, background: B.navyMid, color: B.white,
    outline: "none", boxSizing: "border-box",
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={{ minHeight: "unset", background: B.navy, display: "flex", flexDirection: "column", padding: 20 }}>
        <h2 style={{ color: B.white, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Vehicle Inspection</h2>
        <p style={{ color: B.muted, fontSize: 13, marginBottom: 20 }}>Select inspection type to begin</p>

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[["pre", "Pre-Trip"], ["post", "Post-Trip"]].map(([k, label]) => (
            <button key={k} onClick={() => setType(k)} style={{
              flex: 1, padding: "14px 0", borderRadius: 12,
              border: `2px solid ${type === k ? B.blue : B.navyBorder}`,
              background: type === k ? B.blue : B.navyLight,
              color: type === k ? "#FFFFFF" : B.muted,
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search plate, make, driver…"
          style={{
            width: "100%", borderRadius: 12, padding: "12px 14px", fontSize: 13,
            border: `1px solid ${B.navyBorder}`, background: B.navyMid, color: B.white,
            outline: "none", boxSizing: "border-box", marginBottom: 16,
          }}
        />

        <h3 style={{ color: B.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
          SELECT VEHICLE
        </h3>

        {loadingVehicles ? (
          <div>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const sh = { background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
                return (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${B.navyBorder}`, background:B.navyMid }}>
                    <div style={{ ...sh, height:14, width:"60%", marginBottom:8 }} />
                    <div style={{ ...sh, height:11, width:"75%" }} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {vehicles.filter(v => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return v.plate.toLowerCase().includes(q)
                || v.make.toLowerCase().includes(q)
                || v.model.toLowerCase().includes(q);
            }).map(v => (
              <button key={v.id} onClick={() => startInspection(v)} style={{
                padding: "12px 14px", borderRadius: 12,
                border: `1px solid ${B.navyBorder}`,
                background: B.navyMid, cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ color: B.white, fontWeight: 700, fontSize: 14 }}>{v.plate}</div>
                <div style={{ color: B.muted, fontSize: 11, marginTop: 2 }}>
                  {v.make} {v.model} · {v.type}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (screen === "form") {
    const totalItems = sections.reduce((a, s) => a + s.items.length, 0);
    const done       = Object.values(checks).filter(v => v === "pass" || v === "flag").length;
    const flags      = Object.values(checks).filter(v => v === "flag").length;
    const progress   = totalItems > 0 ? Math.round((done / totalItems) * 100) : 0;

    return (
      <div style={{ minHeight: "unset", background: B.navy, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: B.navyMid, borderBottom: `1px solid ${B.navyBorder}`, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <button onClick={() => setScreen("home")} style={{
              background: "none", border: "none", color: B.muted, fontSize: 18, cursor: "pointer", padding: 0,
            }}>←</button>
            <div>
              <div style={{ color: B.white, fontWeight: 700, fontSize: 15 }}>
                {type === "pre" ? "Pre-Trip" : "Post-Trip"} — {vehicle.plate}
              </div>
              <div style={{ color: B.muted, fontSize: 11 }}>
                {vehicle.make} {vehicle.model} · {vehicle.type}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: B.navyLight, borderRadius: 3 }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: flags > 0 ? B.red : B.blue,
                borderRadius: 3, transition: "width .3s",
              }} />
            </div>
            <span style={{ color: B.muted, fontSize: 11, whiteSpace: "nowrap" }}>{done}/{totalItems}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* Trip Info */}
          <div style={{ background: B.navyMid, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${B.navyBorder}` }}>
            <div style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
              TRIP INFORMATION
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Leadman</div>
                <input value={leadman} onChange={e => setLeadman(e.target.value)} placeholder="Name" style={inputStyle} />
              </div>
              <div>
                <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Driver</div>
                <input value={driver} onChange={e => setDriver(e.target.value)} placeholder="Name" style={inputStyle} />
              </div>
              <div>
                <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Trip KM</div>
                <input value={tripKm} onChange={e => setTripKm(e.target.value)} placeholder="0" type="number" style={inputStyle} />
              </div>
              <div>
                <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Hours</div>
                <input value={tripHours} onChange={e => setTripHours(e.target.value)} placeholder="0" type="number" style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General notes…"
                rows={2} style={{ ...inputStyle, resize: "none" }} />
            </div>
          </div>

          {/* Media Attachments */}
          <div style={{ background: B.navyMid, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${B.navyBorder}` }}>
            <div style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
              ATTACH MEDIA
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              style={{ display: "none" }}
              onChange={e => {
                const added = Array.from(e.target.files || []);
                setMediaFiles(prev => {
                  const existing = new Set(prev.map(f => f.name + f.size));
                  return [...prev, ...added.filter(f => !existing.has(f.name + f.size))];
                });
                e.target.value = "";
              }}
            />
            {mediaFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {mediaFiles.map((file, i) => {
                  const isImage = file.type.startsWith("image/");
                  const preview = isImage ? URL.createObjectURL(file) : null;
                  return (
                    <div key={i} style={{
                      position: "relative", width: 72, height: 72, borderRadius: 8,
                      border: `1px solid ${B.navyBorder}`, overflow: "hidden",
                      background: B.navyLight, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isImage ? (
                        <img src={preview} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ textAlign: "center", padding: 6 }}>
                          <div style={{ fontSize: 22 }}>📄</div>
                          <div style={{ color: B.muted, fontSize: 9, marginTop: 2, wordBreak: "break-all", lineHeight: 1.2 }}>
                            {file.name.length > 14 ? file.name.slice(0, 11) + "…" : file.name}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setMediaFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{
                          position: "absolute", top: 2, right: 2, width: 18, height: 18,
                          borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none",
                          color: "#fff", fontSize: 10, cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", lineHeight: 1,
                        }}
                      >×</button>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                border: `1px dashed ${B.navyBorder}`, background: "transparent",
                color: B.muted, fontSize: 13, cursor: "pointer",
              }}
            >
              + Add Images or PDF
            </button>
            {mediaFiles.length > 0 && (
              <div style={{ color: B.muted, fontSize: 11, marginTop: 6, textAlign: "center" }}>
                {mediaFiles.length} file{mediaFiles.length > 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          {/* Checklist Sections */}
          {loadingSections ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => {
                const sh = { background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
                return (
                  <div key={i} style={{ background:B.navyMid, borderRadius:14, padding:16, marginBottom:12, border:`1px solid ${B.navyBorder}` }}>
                    <div style={{ ...sh, height:14, width:"35%", marginBottom:14 }} />
                    {Array.from({ length: 3 }).map((__, j) => (
                      <div key={j} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <div style={{ ...sh, height:20, width:20, borderRadius:4, flexShrink:0 }} />
                        <div style={{ ...sh, height:11, width:"65%" }} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : sections.map(section => {
            const sectionDone  = section.items.filter(i => checks[i.id] === "pass" || checks[i.id] === "flag").length;
            const sectionFlags = section.items.filter(i => checks[i.id] === "flag").length;
            return (
              <div key={section.id} style={{ background: B.navyMid, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${B.navyBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ color: B.white, fontWeight: 700, fontSize: 14 }}>{section.label}</span>
                  <span style={{ fontSize: 11, color: sectionFlags > 0 ? B.redLight : B.muted }}>
                    {sectionFlags > 0
                      ? `⚠ ${sectionFlags} issue${sectionFlags > 1 ? "s" : ""}`
                      : `${sectionDone}/${section.items.length} complete`}
                  </span>
                </div>
                {section.items.map(item => (
                  <CheckItem
                    key={item.id}
                    item={item}
                    value={checks[item.id]}
                    onChange={val => setChecks(prev => ({ ...prev, [item.id]: val }))}
                    flagNote={flagNotes[item.id]}
                    onNoteChange={val => setFlagNotes(prev => ({ ...prev, [item.id]: val }))}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${B.navyBorder}`, background: B.navyMid }}>
          <button onClick={() => setScreen("summary")} style={{
            width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: flags > 0 ? B.red : B.blue, color: "#FFFFFF", fontWeight: 700, fontSize: 15,
          }}>
            {flags > 0 ? `⚠ Submit with ${flags} Issue${flags > 1 ? "s" : ""}` : "✓ Submit Inspection"}
          </button>
        </div>
      </div>
    );
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const done  = Object.values(checks).filter(v => v === "pass" || v === "flag").length;
    const flags = Object.values(checks).filter(v => v === "flag").length;
    const flaggedItems = sections.flatMap(s =>
      s.items.filter(i => checks[i.id] === "flag").map(i => ({ ...i, sectionLabel: s.label }))
    );
    const stats = [
      ["Checked", done,  B.blue],
      ["Passed",  Object.values(checks).filter(v => v === "pass").length, B.greenLight],
      ["Flagged", flags, B.red],
    ];

    return (
      <div style={{ minHeight: "unset", background: B.navy, display: "flex", flexDirection: "column" }}>
        <div style={{ background: B.navyMid, borderBottom: `1px solid ${B.navyBorder}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setScreen("form")} style={{ background: "none", border: "none", color: B.muted, fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          <div>
            <div style={{ color: B.white, fontWeight: 700, fontSize: 15 }}>Inspection Summary</div>
            <div style={{ color: B.muted, fontSize: 11 }}>{vehicle.plate} · {type === "pre" ? "Pre-Trip" : "Post-Trip"}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* Stats */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {stats.map(([label, val, color]) => (
              <div key={label} style={{ flex: 1, background: B.navyMid, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${B.navyBorder}` }}>
                <div style={{ color, fontSize: 24, fontWeight: 800 }}>{val}</div>
                <div style={{ color: B.muted, fontSize: 11, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Trip Info Summary */}
          <div style={{ background: B.navyMid, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${B.navyBorder}` }}>
            <div style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>TRIP INFO</div>
            {[
              ["Vehicle",  `${vehicle.plate} — ${vehicle.make} ${vehicle.model}`],
              ["Driver",   driver    || "—"],
              ["Leadman",  leadman   || "—"],
              ["KM",       tripKm    || "—"],
              ["Hours",    tripHours || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: B.muted, fontSize: 12 }}>{k}</span>
                <span style={{ color: B.white, fontSize: 12, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {notes && (
              <div style={{ color: B.offWhite, fontSize: 12, marginTop: 6, padding: "8px 10px", background: B.navyLight, borderRadius: 8 }}>
                {notes}
              </div>
            )}
          </div>

          {/* Flagged Items */}
          {flags > 0 && (
            <div style={{ background: B.statusRedBg, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${B.statusRedBorder}` }}>
              <div style={{ color: B.redLight, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                ⚠ FLAGGED ISSUES ({flags})
              </div>
              {flaggedItems.map(item => (
                <div key={item.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${B.redBorder}` }}>
                  <div style={{ color: B.redLight, fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: B.muted, fontSize: 11, marginTop: 1 }}>{item.sectionLabel}</div>
                  {flagNotes[item.id] && (
                    <div style={{ color: B.redLight, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                      {flagNotes[item.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {flags === 0 && (
            <div style={{ background: B.statusGreenBg, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${B.statusGreenBorder}`, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>✓</div>
              <div style={{ color: B.greenLight, fontWeight: 700, fontSize: 14 }}>All items passed</div>
              <div style={{ color: B.muted, fontSize: 12, marginTop: 2 }}>
                Vehicle cleared for {type === "pre" ? "departure" : "parking"}
              </div>
            </div>
          )}

          {submitError && (
            <div style={{ background: B.statusRedBg, borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: `1px solid ${B.statusRedBorder}` }}>
              <span style={{ color: B.redLight, fontSize: 13 }}>{submitError}</span>
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${B.navyBorder}`, background: B.navyMid, display: "flex", gap: 10 }}>
          <button onClick={() => { setMediaFiles([]); setScreen("home"); }} disabled={submitting} style={{
            flex: 1, padding: "13px 0", borderRadius: 12, border: `1px solid ${B.navyBorder}`,
            background: "transparent", color: B.white, fontWeight: 700, fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1,
          }}>New Inspection</button>
          <button onClick={handleSaveReport} disabled={submitting} style={{
            flex: 2, padding: "13px 0", borderRadius: 12, border: "none",
            background: B.blue, color: B.white, fontWeight: 700, fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
          }}>
            {submitting ? "Saving…" : "Save Report"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
