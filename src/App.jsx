import { useState } from "react";

const EXAMPLES = [
  {
    name: "Redwood Building Supply",
    hint: "established supplier",
    text: `Talked to Redwood Building Supply about opening a trade account. They've been in business since 2009, based in Oregon, sell lumber and building materials wholesale. Gave two references — Cascade Contractors (worked with them 6 years, always paid on time) and one other I couldn't reach. They mentioned annual revenue "around $4M" but didn't share documentation. Have a state contractor license number but I haven't verified it yet. Want net-30 terms on ~$50k initial order.`,
  },
  {
    name: "Meridian Freight",
    hint: "thin file",
    text: `Meridian Freight LLC reached out wanting to buy packaging supplies on credit. Started sometime last year I think. Owner says they work with "a bunch of big brands" but didn't name any references when I asked. Couldn't find a website. No EIN or license info shared yet. They want net-60 on a $30k first order and seemed in a hurry to close this week.`,
  },
];

function fileRef(seq) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `TF-${y}${m}${day}-${String(seq).padStart(2, "0")}`;
}

function fileDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function App() {
  const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seq, setSeq] = useState(1);

  const canSubmit = notes.trim().length > 0 && !loading;

  async function structureProfile() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: notes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || "Something went wrong. Try again.");
      }
      setProfile({ ...data, ref: fileRef(seq), date: fileDate() });
      setSeq((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setProfile(null);
    setNotes("");
    setError(null);
  }

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-inner">
          <div>
            <h1 className="wordmark">Trade Onboarding Assistant</h1>
            <p className="tagline">
              Turn messy onboarding info into a clean trust profile in seconds.
            </p>
          </div>
          <p className="masthead-note">
            Structures &amp; flags —<br />
            does not decide
          </p>
        </div>
      </header>

      <main className="workspace">
        <section className="intake" aria-labelledby="intake-label">
          <p className="eyebrow" id="intake-label">
            Intake notes
          </p>
          <div className="pad">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste business onboarding details, trade references, notes…"
              rows={13}
              disabled={loading}
              aria-label="Business onboarding notes"
            />
            <div className="pad-foot">
              <div className="examples">
                <span className="examples-label">Try an example</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    className="chip"
                    disabled={loading}
                    onClick={() => {
                      setNotes(ex.text);
                      setError(null);
                    }}
                  >
                    {ex.name}
                    <span className="chip-hint">{ex.hint}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="submit"
                onClick={structureProfile}
                disabled={!canSubmit}
              >
                {loading ? "Structuring…" : "Structure profile"}
              </button>
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="file" aria-labelledby="file-label" aria-busy={loading}>
          <p className="eyebrow" id="file-label">
            Structured file
          </p>

          {loading ? (
            <div className="sheet sheet-loading">
              <div className="loading-rule" />
              <p className="loading-text">Structuring the trust profile…</p>
              <p className="loading-sub">Reading notes, sorting signals from gaps.</p>
            </div>
          ) : profile ? (
            <article className="sheet memo">
              <div className="memo-head">
                <div>
                  <p className="memo-kicker">Trust profile</p>
                  <h2 className="memo-name">{profile.businessIdentity.name}</h2>
                  <p className="memo-meta">
                    {profile.ref} · {profile.date}
                  </p>
                </div>
                <p className="stamp" aria-label="For review — not a credit decision">
                  For review
                  <span>not a credit decision</span>
                </p>
              </div>

              {profile.summary && <p className="memo-summary">{profile.summary}</p>}

              <section className="memo-section">
                <h3 className="memo-label">Business identity</h3>
                <dl className="identity">
                  <dt>Name</dt>
                  <dd>{profile.businessIdentity.name}</dd>
                  <dt>Industry</dt>
                  <dd>{profile.businessIdentity.industry}</dd>
                  <dt>Years operating</dt>
                  <dd>{profile.businessIdentity.yearsOperating}</dd>
                  <dt>Type</dt>
                  <dd>{profile.businessIdentity.type}</dd>
                </dl>
              </section>

              <section className="memo-section">
                <h3 className="memo-label">
                  Trust signals <span className="count">{profile.trustSignals.length}</span>
                </h3>
                {profile.trustSignals.length ? (
                  <ul className="signal-list">
                    {profile.trustSignals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="none">No positive indicators found in the notes.</p>
                )}
              </section>

              <section className="memo-section">
                <h3 className="memo-label">
                  Items to review <span className="count">{profile.itemsToReview.length}</span>
                </h3>
                {profile.itemsToReview.length ? (
                  <ul className="review-list">
                    {profile.itemsToReview.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="none">Nothing flagged.</p>
                )}
              </section>

              <section className="memo-section">
                <h3 className="memo-label">Suggested next steps</h3>
                {profile.suggestedNextSteps.length ? (
                  <ul className="steps-list">
                    {profile.suggestedNextSteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="none">No follow-ups suggested.</p>
                )}
              </section>

              <div className="memo-foot">
                <button type="button" className="ghost" onClick={reset}>
                  Structure another
                </button>
              </div>
            </article>
          ) : (
            <div className="sheet sheet-empty">
              <p className="empty-title">No file yet</p>
              <p className="empty-sub">
                Paste intake notes on the left — or load an example — and the
                structured trust profile will appear here.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="colophon">
        <p>
          A small demo built for Nuvo. It organizes the information a reviewer
          provides and flags what to verify — it does not score, approve, or
          make credit decisions.
        </p>
      </footer>
    </div>
  );
}
