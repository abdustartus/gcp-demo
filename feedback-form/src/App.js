import { useState } from "react";

const questions = [
  {
    id: "experience",
    type: "rating",
    label: "Overall Experience",
    sublabel: "How was your booking experience today?"
  },
  {
    id: "completed",
    type: "yesno",
    label: "Booking Completed?",
    sublabel: "Were you able to successfully complete your booking?"
  },
  {
    id: "errors",
    type: "yesno",
    label: "Any Errors Encountered?",
    sublabel: "Did you face any errors or timeouts during the process?"
  },
  {
    id: "errorDetail",
    type: "text",
    label: "Describe the Error",
    sublabel: "If yes, briefly describe what happened.",
    conditional: { id: "errors", value: "yes" }
  },
  {
    id: "comments",
    type: "text",
    label: "Additional Comments",
    sublabel: "Anything else you would like to share?"
  }
];

const ratingLabels = ["Terrible", "Poor", "Okay", "Good", "Excellent"];
const ratingColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export default function App() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [current, setCurrent] = useState(0);

  const visibleQuestions = questions.filter(q => {
    if (!q.conditional) return true;
    return answers[q.conditional.id] === q.conditional.value;
  });

  const currentQ = visibleQuestions[current];
  const isLast = current === visibleQuestions.length - 1;
  const progress = ((current + 1) / visibleQuestions.length) * 100;

  const handleAnswer = (id, value) =>
    setAnswers(prev => ({ ...prev, [id]: value }));

  const handleNext = () =>
    isLast ? setSubmitted(true) : setCurrent(c => c + 1);

  const handleBack = () => setCurrent(c => c - 1);

  const canProceed = () =>
    currentQ && currentQ.type === "text" ? true : !!(answers[currentQ && currentQ.id]);

  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.successCircle}>
            <span style={styles.checkmark}>&#10003;</span>
          </div>
          <h2 style={styles.successTitle}>Thank you!</h2>
          <p style={styles.successText}>
            Your feedback helps us improve the platform for everyone,
            especially during high-traffic events.
          </p>
          <div style={styles.summaryBox}>
            <p style={styles.summaryHeading}>Your Responses</p>
            {visibleQuestions.map(q => (
              <div key={q.id} style={styles.summaryRow}>
                <span style={styles.summaryLabel}>{q.label}</span>
                <span style={styles.summaryValue}>
                  {q.id === "experience" && answers[q.id]
                    ? answers[q.id] + "/5 — " + ratingLabels[answers[q.id] - 1]
                    : answers[q.id] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoEmoji}>&#127915;</span>
            <span style={styles.logoText}>BookMyShow</span>
          </div>
          <p style={styles.headerSub}>Post-Event Feedback</p>
        </div>

        <div style={styles.progressTrack}>
          <div style={Object.assign({}, styles.progressFill, { width: progress + "%" })} />
        </div>
        <p style={styles.progressLabel}>
          Question {current + 1} of {visibleQuestions.length}
        </p>

        {currentQ && (
          <div style={styles.questionBlock}>
            <h3 style={styles.questionLabel}>{currentQ.label}</h3>
            <p style={styles.questionSub}>{currentQ.sublabel}</p>

            {currentQ.type === "rating" && (
              <div style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => handleAnswer(currentQ.id, n)}
                    style={Object.assign({}, styles.ratingBtn, {
                      background: answers[currentQ.id] === n ? ratingColors[n - 1] : "#1e293b",
                      border: "2px solid " + (answers[currentQ.id] === n ? ratingColors[n - 1] : "#334155"),
                      color: answers[currentQ.id] === n ? "#ffffff" : "#94a3b8",
                      transform: answers[currentQ.id] === n ? "scale(1.15)" : "scale(1)"
                    })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === "rating" && answers[currentQ.id] && (
              <p style={Object.assign({}, styles.ratingHint, {
                color: ratingColors[answers[currentQ.id] - 1]
              })}>
                {ratingLabels[answers[currentQ.id] - 1]}
              </p>
            )}

            {currentQ.type === "yesno" && (
              <div style={styles.yesnoRow}>
                {["yes", "no"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(currentQ.id, opt)}
                    style={Object.assign({}, styles.yesnoBtn, {
                      background: answers[currentQ.id] === opt ? "#e11d48" : "#1e293b",
                      border: "2px solid " + (answers[currentQ.id] === opt ? "#e11d48" : "#334155"),
                      color: answers[currentQ.id] === opt ? "#ffffff" : "#94a3b8"
                    })}
                  >
                    {opt === "yes" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === "text" && (
              <textarea
                style={styles.textarea}
                placeholder="Type here..."
                value={answers[currentQ.id] || ""}
                onChange={e => handleAnswer(currentQ.id, e.target.value)}
                rows={4}
              />
            )}
          </div>
        )}

        <div style={styles.navRow}>
          {current > 0 && (
            <button onClick={handleBack} style={styles.backBtn}>
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            style={Object.assign({}, styles.nextBtn, {
              opacity: canProceed() ? 1 : 0.4,
              cursor: canProceed() ? "pointer" : "not-allowed",
              marginLeft: current === 0 ? "auto" : "0"
            })}
          >
            {isLast ? "Submit Feedback" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Georgia, serif",
    padding: "24px"
  },
  card: {
    background: "#111827",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "520px",
    border: "1px solid #1e293b",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
  },
  header: { marginBottom: "28px" },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  logoEmoji: { fontSize: "22px" },
  logoText: { fontSize: "20px", fontWeight: "bold", color: "#f8fafc", letterSpacing: "-0.5px" },
  headerSub: { color: "#64748b", fontSize: "13px", margin: "4px 0 0 32px", textTransform: "uppercase", letterSpacing: "0.05em" },
  progressTrack: { height: "3px", background: "#1e293b", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" },
  progressFill: { height: "100%", background: "#e11d48", borderRadius: "2px", transition: "width 0.4s ease" },
  progressLabel: { color: "#475569", fontSize: "12px", textAlign: "right", marginBottom: "32px" },
  questionBlock: { marginBottom: "32px" },
  questionLabel: { color: "#f1f5f9", fontSize: "22px", fontWeight: "normal", margin: "0 0 8px 0", lineHeight: "1.3" },
  questionSub: { color: "#64748b", fontSize: "14px", margin: "0 0 24px 0" },
  ratingRow: { display: "flex", gap: "12px", justifyContent: "center", margin: "8px 0" },
  ratingBtn: { width: "52px", height: "52px", borderRadius: "50%", fontSize: "18px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s ease" },
  ratingHint: { textAlign: "center", fontSize: "14px", marginTop: "12px", fontStyle: "italic" },
  yesnoRow: { display: "flex", gap: "16px" },
  yesnoBtn: { flex: "1", padding: "14px", borderRadius: "10px", fontSize: "16px", cursor: "pointer", fontFamily: "Georgia, serif" },
  textarea: { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#f1f5f9", fontSize: "15px", padding: "14px", resize: "vertical", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box" },
  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
  backBtn: { background: "transparent", border: "1px solid #334155", color: "#64748b", padding: "12px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia, serif" },
  nextBtn: { background: "#e11d48", border: "none", color: "#ffffff", padding: "12px 28px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia, serif", transition: "opacity 0.2s" },
  successCircle: { width: "64px", height: "64px", background: "#022c22", border: "2px solid #22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  checkmark: { color: "#22c55e", fontSize: "28px" },
  successTitle: { color: "#f1f5f9", textAlign: "center", fontSize: "26px", fontWeight: "normal", margin: "0 0 12px" },
  successText: { color: "#64748b", textAlign: "center", fontSize: "14px", lineHeight: "1.6", margin: "0 0 28px" },
  summaryBox: { background: "#1e293b", borderRadius: "10px", padding: "16px" },
  summaryHeading: { color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px 0" },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" },
  summaryLabel: { color: "#64748b" },
  summaryValue: { color: "#f1f5f9", fontStyle: "italic" }
};
