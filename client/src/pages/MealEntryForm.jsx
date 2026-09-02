import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/UI/Card";
import { Button } from "../components/UI/Button";
import { Badge } from "../components/UI/Badge";
import { LoadingSpinner } from "../components/UI/LoadingSpinner";
import { parseBulkMealText } from "../utils/bulkParser";

export function MealEntryForm() {
  const { entryId } = useParams();
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  // Fast Entry (FAST) is default unless editing existing single entry
  const [mode, setMode] = useState(entryId ? "SIMPLE" : "FAST");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);

    return localDate.toISOString().split("T")[0];
  };

  const [entryDate, setEntryDate] = useState(getToday());
  const [mealType, setMealType] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "MORNING" : "NIGHT";
  });
  const [defaultPrice, setDefaultPrice] = useState(40);
  const [notes, setNotes] = useState("");

  const [friends, setFriends] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});

  // Fast Entry state
  const [bulkText, setBulkText] = useState();
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear());
  const [parsedBulk, setParsedBulk] = useState([]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const initData = async () => {
      setLoading(true);
      try {
        const settings = await apiFetch(
          `/workspaces/${activeWorkspaceId}/settings`,
        );
        const initialPrice =
          mealType === "NIGHT"
            ? settings.nightDefaultRate
            : settings.morningDefaultRate;
        setDefaultPrice(initialPrice);

        const activeFriends = await apiFetch(
          `/workspaces/${activeWorkspaceId}/friends?includeInactive=false`,
        );
        setFriends(activeFriends);

        const initialMap = {};
        activeFriends.forEach((f) => {
          initialMap[f.id] = {
            selected: false,
            quantity: 1,
            unitPrice: initialPrice,
          };
        });

        if (entryId) {
          const entries = await apiFetch(
            `/workspaces/${activeWorkspaceId}/entries`,
          );
          const existing = entries.find((e) => e.id === entryId);
          if (existing) {
            setEntryDate(
              new Date(existing.entryDate).toISOString().split("T")[0],
            );
            setMealType(existing.mealType);
            setDefaultPrice(existing.defaultPrice);
            setNotes(existing.notes || "");
            setMode("SIMPLE");

            existing.items.forEach((item) => {
              initialMap[item.friendId] = {
                selected: true,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              };
            });
          }
        }

        setSelectedItems(initialMap);
      } catch (err) {
        console.error("Failed to init meal form:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [activeWorkspaceId, entryId]);

  useEffect(() => {
    if (mode === "FAST") {
      const results = parseBulkMealText(bulkText, friends, defaultYear, {
        morning: defaultPrice,
        night: defaultPrice,
      });
      setParsedBulk(results);
    }
  }, [bulkText, friends, defaultYear, defaultPrice, mode]);

  const handleMealTypeChange = (newType) => {
    setMealType(newType);
    apiFetch(`/workspaces/${activeWorkspaceId}/settings`).then((settings) => {
      const p =
        newType === "NIGHT"
          ? settings.nightDefaultRate
          : settings.morningDefaultRate;
      setDefaultPrice(p);

      setSelectedItems((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((fId) => {
          next[fId] = { ...next[fId], unitPrice: p };
        });
        return next;
      });
    });
  };

  const toggleFriend = (friendId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [friendId]: {
        ...prev[friendId],
        selected: !prev[friendId]?.selected,
        quantity: prev[friendId]?.quantity || 1,
        unitPrice: prev[friendId]?.unitPrice || defaultPrice,
      },
    }));
  };

  const updateQuantity = (friendId, delta) => {
    setSelectedItems((prev) => {
      const curQty = prev[friendId]?.quantity || 1;
      const newQty = Math.max(1, curQty + delta);
      return {
        ...prev,
        [friendId]: {
          ...prev[friendId],
          quantity: newQty,
        },
      };
    });
  };

  const selectedFriendIds = Object.keys(selectedItems).filter(
    (fId) => selectedItems[fId]?.selected,
  );
  const totalQuantity = selectedFriendIds.reduce(
    (acc, fId) => acc + selectedItems[fId].quantity,
    0,
  );
  const totalAmount = selectedFriendIds.reduce(
    (acc, fId) =>
      acc + selectedItems[fId].quantity * selectedItems[fId].unitPrice,
    0,
  );

  const validBulkEntries = parsedBulk.filter((p) => p.isValid);
  const invalidBulkEntries = parsedBulk.filter((p) => !p.isValid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "SIMPLE") {
      if (selectedFriendIds.length === 0) {
        setError("Please select at least one friend for this meal");
        return;
      }

      setSubmitting(true);

      try {
        const payload = {
          entryDate,
          mealType,
          defaultPrice,
          notes,
          items: selectedFriendIds.map((fId) => ({
            friendId: fId,
            quantity: selectedItems[fId].quantity,
            unitPrice: selectedItems[fId].unitPrice,
          })),
        };

        if (entryId) {
          await apiFetch(
            `/workspaces/${activeWorkspaceId}/entries/${entryId}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            },
          );
        } else {
          await apiFetch(`/workspaces/${activeWorkspaceId}/entries`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        navigate("/entries");
      } catch (err) {
        setError(err.message || "Failed to save meal entry");
      } finally {
        setSubmitting(false);
      }
    } else {
      // FAST ENTRY MODE
      if (validBulkEntries.length === 0) {
        setError(
          "No valid meal entries found to import. Please check invalid lines below.",
        );
        return;
      }

      setSubmitting(true);

      try {
        const payload = validBulkEntries.map((b) => ({
          entryDate: b.entryDate,
          mealType: b.mealType,
          defaultPrice: b.defaultPrice,
          rawNote: b.rawLine,
          items: b.items.map((i) => ({
            friendId: i.friendId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }));

        await apiFetch(`/workspaces/${activeWorkspaceId}/entries/bulk`, {
          method: "POST",
          body: JSON.stringify({ entries: payload }),
        });

        navigate("/entries");
      } catch (err) {
        setError(err.message || "Failed to import meal entries");
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading meal entry form..." />;

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/entries")}
            style={{ marginBottom: "0.75rem" }}
          >
            <ArrowLeft size={14} /> Back to Entries
          </Button>
          <h1>{entryId ? "Edit Meal Entry" : "Add Meal Entry"}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {mode === "FAST"
              ? "Fast Entry mode — type quick lines like '01 Aug m K S SB'"
              : "Simple Entry mode — pick date and select friend checkboxes"}
          </p>
        </div>

        {!entryId && (
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--surface-muted)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.2rem",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("FAST")}
              style={{
                padding: "0.45rem 0.85rem",
                border: "none",
                borderRadius: "var(--radius-sm)",
                backgroundColor:
                  mode === "FAST" ? "var(--surface)" : "transparent",
                fontWeight: mode === "FAST" ? "600" : "400",
                color: mode === "FAST" ? "var(--accent-brown)" : "inherit",
                cursor: "pointer",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Zap size={14} /> Fast Entry
            </button>
            <button
              type="button"
              onClick={() => setMode("SIMPLE")}
              style={{
                padding: "0.45rem 0.85rem",
                border: "none",
                borderRadius: "var(--radius-sm)",
                backgroundColor:
                  mode === "SIMPLE" ? "var(--surface)" : "transparent",
                fontWeight: mode === "SIMPLE" ? "600" : "400",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Simple Entry
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {mode === "FAST" ? (
        <form onSubmit={handleSubmit}>
          <Card
            title="Fast Entry (Quick Text Import)"
            subtitle="Type or paste multiple lines of meals for fast entry"
          >
            <div
              style={{
                backgroundColor: "var(--surface-muted)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "0.82rem",
                marginBottom: "1rem",
              }}
            >
              <strong>Fast Entry Format Example:</strong>
              <pre
                className="font-mono"
                style={{
                  margin: "0.35rem 0 0 0",
                  whiteSpace: "pre-wrap",
                  color: "var(--accent-brown)",
                }}
              >
                01 Aug m K S SB{"\n"}
                02 Aug m K 2KP P SB SH{"\n"}
                03 Aug n K S P
              </pre>
              <p style={{ marginTop: "0.4rem", color: "var(--text-muted)" }}>
                Prefix numbers e.g. <code>2KP</code> mean 2 tiffins for friend
                short code <code>KP</code>.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Default Target Year</label>
              <select
                className="select"
                value={defaultYear}
                onChange={(e) => setDefaultYear(parseInt(e.target.value, 10))}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fast Entry Text *</label>
              <textarea
                className="textarea font-mono"
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Type lines e.g. 01 Aug m K S SB"
              />
            </div>

            {/* Live Line-by-Line Validation & Parse Preview Box */}
            {parsedBulk.length > 0 && (
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "0.95rem" }}>
                    Live Parse & Validation Summary ({parsedBulk.length} lines)
                  </h4>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Badge
                      variant={
                        validBulkEntries.length > 0 ? "success" : "neutral"
                      }
                    >
                      {validBulkEntries.length} Valid Ready
                    </Badge>
                    {invalidBulkEntries.length > 0 && (
                      <Badge variant="danger">
                        {invalidBulkEntries.length} Errors Found
                      </Badge>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    maxHeight: "220px",
                    overflowY: "auto",
                    paddingRight: "0.2rem",
                  }}
                >
                  {parsedBulk.map((lineRes) => (
                    <div
                      key={lineRes.lineNum}
                      style={{
                        padding: "0.6rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${
                          lineRes.isValid ? "var(--border)" : "#E53935"
                        }`,
                        backgroundColor: lineRes.isValid
                          ? "var(--surface)"
                          : "#FFEBEE",
                        fontSize: "0.82rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          {lineRes.isValid ? (
                            <CheckCircle
                              size={15}
                              style={{ color: "var(--success-text)" }}
                            />
                          ) : (
                            <AlertCircle
                              size={15}
                              style={{ color: "#D32F2F" }}
                            />
                          )}
                          <span
                            className="font-mono"
                            style={{ fontWeight: "600", color: "#333" }}
                          >
                            Line {lineRes.lineNum}: "{lineRes.rawLine}"
                          </span>
                        </div>
                        <Badge variant={lineRes.isValid ? "success" : "danger"}>
                          {lineRes.isValid ? "VALID" : "INVALID"}
                        </Badge>
                      </div>

                      {lineRes.isValid ? (
                        <div
                          style={{
                            marginTop: "0.3rem",
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            gap: "0.75rem",
                          }}
                        >
                          <span>
                            Date: <strong>{lineRes.entryDate}</strong>
                          </span>
                          <span>
                            Meal: <strong>{lineRes.mealType}</strong>
                          </span>
                          <span>
                            Friends:{" "}
                            <strong>
                              {lineRes.items
                                .map(
                                  (i) =>
                                    `${i.quantity > 1 ? i.quantity : ""}${i.shortCode}`,
                                )
                                .join(", ")}
                            </strong>
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: "0.35rem",
                            fontSize: "0.8rem",
                            color: "#D32F2F",
                            fontWeight: "500",
                          }}
                        >
                          ❌ {lineRes.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => navigate("/entries")}
              style={{ flex: "1 1 100px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || validBulkEntries.length === 0}
              size="lg"
              style={{ flex: "2 1 200px" }}
            >
              <Zap size={18} />
              <span>
                {submitting
                  ? "Importing..."
                  : `Save ${validBulkEntries.length} Meals (Fast Entry)`}
              </span>
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card
            title="Simple Entry Form"
            subtitle="Pick meal date and tick roommate checkboxes"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meal Type *</label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleMealTypeChange("MORNING")}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      minHeight: "44px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      backgroundColor:
                        mealType === "MORNING"
                          ? "var(--accent-cream)"
                          : "var(--surface)",
                      color: "#292929",
                      fontWeight: mealType === "MORNING" ? "600" : "400",
                      cursor: "pointer",
                    }}
                  >
                    Morning
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMealTypeChange("NIGHT")}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      minHeight: "44px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      backgroundColor:
                        mealType === "NIGHT"
                          ? "var(--accent-blue)"
                          : "var(--surface)",
                      color: "#292929",
                      fontWeight: mealType === "NIGHT" ? "600" : "400",
                      cursor: "pointer",
                    }}
                  >
                    Night
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Price per Tiffin (₹)</label>
              <input
                type="number"
                className="input font-mono"
                value={defaultPrice}
                onChange={(e) =>
                  setDefaultPrice(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </Card>

          <Card
            title="Friends & Quantities"
            subtitle="Tick friends who received tiffin for this meal"
          >
            {friends.length === 0 ? (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  padding: "1rem 0",
                }}
              >
                No active friends found in workspace. Add friends first!
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {friends.map((f) => {
                  const isSelected = Boolean(selectedItems[f.id]?.selected);
                  const quantity = selectedItems[f.id]?.quantity || 1;

                  return (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        backgroundColor: isSelected
                          ? "var(--surface-muted)"
                          : "var(--surface)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          cursor: "pointer",
                          flex: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFriend(f.id)}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                          }}
                        />
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: "600",
                            padding: "0.2rem 0.5rem",
                            backgroundColor: "var(--surface)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {f.shortCode}
                        </span>
                        <span style={{ fontWeight: "500" }}>{f.fullName}</span>
                      </label>

                      {isSelected && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Qty:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--surface)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => updateQuantity(f.id, -1)}
                              style={{
                                padding: "0.3rem 0.5rem",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <span
                              className="font-mono"
                              style={{ padding: "0 0.5rem", fontWeight: "600" }}
                            >
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(f.id, 1)}
                              style={{
                                padding: "0.3rem 0.5rem",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  Total People Selected:{" "}
                </span>
                <strong style={{ fontSize: "1rem" }}>
                  {selectedFriendIds.length}
                </strong>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    marginLeft: "1rem",
                  }}
                >
                  Total Meals:{" "}
                </span>
                <strong style={{ fontSize: "1rem" }}>{totalQuantity}</strong>
              </div>
              <div>
                <span
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  Total Amount:{" "}
                </span>
                <strong
                  className="font-mono"
                  style={{ fontSize: "1.25rem", color: "var(--accent-brown)" }}
                >
                  ₹{totalAmount.toLocaleString()}
                </strong>
              </div>
            </div>
          </Card>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => navigate("/entries")}
              style={{ flex: "1 1 100px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              style={{ flex: "2 1 200px" }}
            >
              <Save size={18} />
              <span>{submitting ? "Saving..." : "Save Meal Entry"}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
