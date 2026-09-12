"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CONTACT,
  CONSENT_VERSION,
  locales,
  type PilotLeadInput,
} from "@/src/domain/pilot";

type Credentials = { token: string; draft_id: string };
type Picture = { id: string; url: string; file?: File; saved: boolean };
type Attribution = PilotLeadInput["attribution"];
const SESSION = "middle-property-mock-session-v1";
const TOUCH = "middle-property-mock-touch-v1";
function credentials(): Credentials {
  return {
    draft_id: crypto.randomUUID(),
    token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
async function api(
  path: string,
  session: Credentials | null,
  options: RequestInit = {},
) {
  const response = await fetch(`/api/pilot/${path}`, {
    ...options,
    headers: {
      ...(session ? { "x-pilot-token": session.token } : {}),
      ...(options.body && typeof options.body === "string"
        ? { "content-type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const body = (await response.json()) as {
    error?: { message?: string };
    data: {
      images: { id: string }[];
      lead: (PilotLeadInput & { id: string; status: string }) | null;
      leads: InboxLead[];
      lead_id: string;
      status: string;
    };
  };
  if (!response.ok)
    throw new Error(body.error?.message ?? "Request failed. Please retry.");
  return body.data;
}
function getTouch() {
  const params = new URLSearchParams(location.search);
  const safe = (name: string, fallback: string) => {
    const value = params.get(name) ?? fallback;
    return /^[\p{L}\p{N}_. -]{0,100}$/u.test(value) ? value : "redacted";
  };
  return {
    source: safe("utm_source", "direct"),
    medium: safe("utm_medium", "none"),
    campaign: safe("utm_campaign", "none"),
    at: new Date().toISOString(),
  };
}
export function PilotJourney() {
  const [language, setLanguage] = useState<PilotLeadInput["language"]>("th");
  const [session, setSession] = useState<Credentials | null>(null);
  const sessionRef = useRef<Credentials | null>(null);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const restoringRef = useRef(true);
  const [restoring, setRestoring] = useState(true);
  const imageProcessingRef = useRef(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [pictures, setPictures] = useState<Picture[]>([]);
  const picturesRef = useRef<Picture[]>([]);
  const [active, setActive] = useState(0);
  const [lead, setLead] = useState<{ id: string; status: string } | null>(null);
  const [step, setStep] = useState<"details" | "consent">("details");
  const attribution = useRef<Attribution | null>(null);
  const events = useRef<{ id: string; name: string; occurred_at: string }[]>(
    [],
  );
  const started = useRef(false);
  const flushing = useRef<Promise<void> | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const th = language === "th";
  function track(name: string) {
    const event = {
      id: crypto.randomUUID(),
      name,
      occurred_at: new Date().toISOString(),
    };
    events.current.push(event);
    setDebug((old) => [...old, name]);
  }
  function flush(current: Credentials): Promise<void> {
    if (flushing.current) return flushing.current;
    const run = async () => {
      if (!attribution.current) return;
      while (events.current.length) {
        const event = events.current[0];
        await api("events", current, {
          method: "POST",
          body: JSON.stringify({ ...event, attribution: attribution.current }),
        });
        events.current = events.current.filter((item) => item.id !== event.id);
      }
    };
    flushing.current = run().finally(() => {
      flushing.current = null;
    });
    return flushing.current;
  }
  function showPictures(next: Picture[]) {
    picturesRef.current = next;
    setPictures(next);
  }
  async function reopen(current: Credentials) {
    restoringRef.current = true;
    setRestoring(true);
    const next: Picture[] = [];
    try {
      const saved = await api("draft", current);
      for (const photo of saved.images) {
        const response = await fetch(`/api/pilot/images/${photo.id}`, {
          headers: { "x-pilot-token": current.token },
        });
        if (!response.ok)
          throw new Error("An image could not be reopened. Retry reopening.");
        next.push({
          id: photo.id,
          url: URL.createObjectURL(await response.blob()),
          saved: true,
        });
      }
      picturesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      showPictures(next);
      setConsent(true);
      setStep("consent");
      if (saved.lead) {
        setLead({ id: saved.lead.id, status: saved.lead.status });
        setLanguage(saved.lead.language);
        Object.entries(saved.lead).forEach(([key, value]) => {
          const control = form.current?.elements.namedItem(key);
          if (
            control instanceof HTMLInputElement ||
            control instanceof HTMLSelectElement ||
            control instanceof HTMLTextAreaElement
          )
            control.value = String(value ?? "");
        });
      }
    } catch (error) {
      next.forEach((p) => URL.revokeObjectURL(p.url));
      throw error;
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(location.search);
      const locale = params.get("lang");
      if (locales.includes(locale as (typeof locales)[number]))
        setLanguage(locale as (typeof locales)[number]);
      const touch = getTouch();
      let previous: Attribution | null = null;
      try {
        previous = JSON.parse(sessionStorage.getItem(TOUCH) ?? "null");
      } catch {
        /* Start fresh. */
      }
      attribution.current = {
        landing_locale: (locale &&
        locales.includes(locale as (typeof locales)[number])
          ? locale
          : "th") as (typeof locales)[number],
        first_touch: previous?.first_touch ?? touch,
        last_touch: touch,
      };
      track("page_view");
      if (params.get("channel") === "line") track("line_click");
      if (params.get("channel") === "call") track("call_click");
      let current: Credentials | null = null;
      try {
        current = JSON.parse(sessionStorage.getItem(SESSION) ?? "null");
      } catch {
        /* No stored session. */
      }
      if (current) {
        sessionRef.current = current;
        setSession(current);
        reopen(current)
          .then(() => flush(current!))
          .catch((error) => setNotice(error.message));
      } else {
        restoringRef.current = false;
        setRestoring(false);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      picturesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // Initial restoration runs once; user changes use explicit handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function addPictures(files: FileList | null) {
    if (
      !files ||
      imageProcessingRef.current ||
      busyRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    const selectedFiles = Array.from(files);
    imageProcessingRef.current = true;
    setImageProcessing(true);
    try {
      if (picturesRef.current.length + selectedFiles.length > 4) {
        setNotice("Choose at most 4 images.");
        return;
      }
      if (
        selectedFiles.some(
          (f) => !["image/png"].includes(f.type) || f.size > 131072,
        )
      ) {
        setNotice(
          "Use non-interlaced 8-bit PNG test images up to 128 KB each.",
        );
        return;
      }
      for (const file of selectedFiles) {
        const bitmap = await createImageBitmap(file);
        const tooLarge = bitmap.width > 4096 || bitmap.height > 4096;
        bitmap.close();
        if (tooLarge) throw new Error();
      }
      showPictures([
        ...picturesRef.current,
        ...selectedFiles.map((file) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          file,
          saved: false,
        })),
      ]);
      setNotice("");
    } catch {
      setNotice(
        "This image cannot be decoded. Choose a valid test image no larger than 4096 pixels per side.",
      );
    } finally {
      imageProcessingRef.current = false;
      setImageProcessing(false);
    }
  }
  async function rearrange(index: number, remove: boolean) {
    if (
      busyRef.current ||
      imageProcessingRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    imageProcessingRef.current = true;
    setImageProcessing(true);
    const next = [...picturesRef.current];
    const discarded = remove ? next.splice(index, 1)[0] : null;
    if (!remove && index > 0)
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    try {
      if (session)
        await api("draft", session, {
          method: "PATCH",
          body: JSON.stringify({
            image_ids: next.filter((p) => p.saved).map((p) => p.id),
          }),
        });
      if (discarded) URL.revokeObjectURL(discarded.url);
      showPictures(next);
      setActive(0);
      setNotice("");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      imageProcessingRef.current = false;
      setImageProcessing(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      busyRef.current ||
      imageProcessingRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    if (!form.current?.reportValidity()) return;
    if (step === "details") {
      setStep("consent");
      setNotice("");
      document
        .getElementById("consent-heading")
        ?.scrollIntoView({ block: "center" });
      return;
    }
    if (!consent) {
      setNotice(
        th
          ? "กรุณายินยอมก่อนบันทึก หรือเลือกไม่ยินยอม"
          : "Accept consent to save, or choose Decline.",
      );
      return;
    }
    const values = new FormData(form.current!);
    busyRef.current = true;
    setBusy(true);
    setNotice("");
    try {
      const current = sessionRef.current ?? credentials();
      sessionRef.current = current;
      setSession(current);
      // Retain only the random capability for safe retry/reload, not form data.
      sessionStorage.setItem(SESSION, JSON.stringify(current));
      await api("session", current, {
        method: "POST",
        body: JSON.stringify({
          draft_id: current.draft_id,
          mock_data: true,
          consent: { accepted: true, version: CONSENT_VERSION },
        }),
      });
      sessionStorage.setItem(TOUCH, JSON.stringify(attribution.current));
      const previous = await api("draft", current);
      if (previous.lead) {
        await reopen(current);
        setNotice(
          "Recovered the saved Lead ID after retry. No duplicate was created.",
        );
        return;
      }
      await flush(current);
      const uploaded = [...picturesRef.current];
      for (const picture of uploaded) {
        if (!picture.saved && picture.file) {
          await api(`images/${picture.id}`, current, {
            method: "PUT",
            headers: { "content-type": picture.file.type },
            body: picture.file,
          });
          picture.saved = true;
          showPictures([...uploaded]);
        }
      }
      await api("draft", current, {
        method: "PATCH",
        body: JSON.stringify({ image_ids: uploaded.map((p) => p.id) }),
      });
      const data = {
        mock_data: true,
        name: values.get("name"),
        contact: values.get("contact"),
        category: values.get("category"),
        budget: Number(values.get("budget")),
        area: values.get("area"),
        requirements: values.get("requirements"),
        language,
        attribution: attribution.current,
      };
      const result = await api("leads", current, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setLead({ id: result.lead_id, status: result.status });
      setDebug((old) => [...old, "form_submit"]);
      setNotice(
        th
          ? "บันทึกแล้ว รอทีมตรวจสอบ — การแจ้งเตือนเป็นแบบจำลอง ยังไม่ได้ส่งจริง"
          : "Saved for review. Notification generated in the mock inbox; no message was sent.",
      );
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function contact(
    event: React.MouseEvent<HTMLAnchorElement>,
    kind: "line_click" | "call_click",
  ) {
    event.preventDefault();
    track(kind);
    if (sessionRef.current)
      try {
        await flush(sessionRef.current);
      } catch {
        setNotice("Event retained for retry.");
      }
    setNotice(
      th
        ? "บันทึกการกดแบบทดสอบแล้ว ไม่มีการโทรหรือส่งข้อความจริง"
        : "Test click recorded. No call or external message was made.",
    );
  }
  function testDetails() {
    if (!form.current) return;
    const data = {
      name: "TEST Pilot Renter",
      contact: "pilot@example.test",
      budget: "50000",
      area: "TEST Bangkok",
      requirements: "TEST quiet synthetic request",
    };
    Object.entries(data).forEach(([key, value]) => {
      const field = form.current!.elements.namedItem(key);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      )
        field.value = value;
    });
    if (!started.current) {
      started.current = true;
      track("form_start");
    }
  }
  function decline() {
    if (
      busyRef.current ||
      imageProcessingRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    if (session) {
      setNotice(
        "This session already recorded consent. Start a new test to decline without saving.",
      );
      return;
    }
    setConsent(false);
    setStep("details");
    pictures.forEach((p) => URL.revokeObjectURL(p.url));
    showPictures([]);
    form.current?.reset();
    events.current = [];
    started.current = false;
    setDebug([]);
    track("page_view");
    setNotice(
      th
        ? "ไม่ยินยอม — ไม่บันทึกข้อมูลและไม่ส่งต่อ"
        : "Declined. No details or images were saved or handed off.",
    );
  }
  return (
    <main className="pilot-shell">
      <header className="pilot-nav">
        <Link href="/">{CONTACT.brand}</Link>
        <nav aria-label="Contact">
          <a
            href={CONTACT.lineUrl}
            onClick={(e) => void contact(e, "line_click")}
          >
            LINE {CONTACT.line}
          </a>
          <a
            href={CONTACT.phoneUrl}
            onClick={(e) => void contact(e, "call_click")}
          >
            {CONTACT.phone}
          </a>
        </nav>
      </header>
      <p className="pilot-banner">
        MOCK PREVIEW · NO-GO FOR REAL LEADS · ใช้ข้อมูลจำลองเท่านั้น · Contact
        actions are simulated
      </p>
      <h1>
        {th ? "บอกเราว่าคุณกำลังมองหาอะไร" : "Tell us what you are looking for"}
      </h1>
      <p>
        {th
          ? "ส่งความต้องการให้ทีม Middle Property ตรวจสอบ ก่อนนัดชมทรัพย์"
          : "Share your requirements for the Middle Property team to review before arranging a viewing."}
      </p>
      <div className="pilot-contact">
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          Test LINE
        </a>
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          Test call
        </a>
      </div>
      <form
        ref={form}
        onSubmit={(e) => void submit(e)}
        onChange={() => {
          if (!started.current) {
            started.current = true;
            track("form_start");
          }
        }}
      >
        <fieldset
          disabled={busy || imageProcessing || restoring || Boolean(lead)}
        >
          <legend>1. Language / ภาษาและความต้องการ</legend>
          <label>
            Preferred reply language
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
            >
              {locales.map((code) => (
                <option key={code} value={code}>
                  {
                    {
                      th: "ไทย",
                      en: "English",
                      zh: "中文",
                      ru: "Русский",
                      ja: "日本語",
                      ko: "한국어",
                      vi: "Tiếng Việt",
                    }[code]
                  }
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary" onClick={testDetails}>
            Fill synthetic test details
          </button>
          <div className="pilot-grid">
            <label>
              Category / ประเภท
              <select name="category">
                <option value="rent">Rent / เช่า</option>
                <option value="buy">Buy / ซื้อ</option>
                <option value="list">List / ฝากทรัพย์</option>
              </select>
            </label>
            <label>
              Budget (THB) / งบประมาณ
              <input
                name="budget"
                type="number"
                min="1"
                max="500000000"
                required
              />
            </label>
            <label>
              Test name / ชื่อจำลอง
              <input
                name="name"
                placeholder="TEST Pilot Renter"
                pattern="TEST .+"
                maxLength={100}
                required
              />
            </label>
            <label>
              Test email / อีเมลจำลอง
              <input
                name="contact"
                type="email"
                placeholder="pilot@example.test"
                pattern=".+@example\.test"
                maxLength={150}
                required
              />
            </label>
            <label>
              Area / ทำเล
              <input name="area" minLength={2} maxLength={150} required />
            </label>
            <label>
              Requirements / ความต้องการ
              <textarea name="requirements" maxLength={1000} />
            </label>
          </div>
          <label>
            Test images (optional, maximum 4) / รูปจำลอง
            <input
              aria-label="Test images"
              type="file"
              accept="image/png"
              multiple
              onChange={(e) => {
                void addPictures(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <p>
            Non-interlaced 8-bit PNG, up to 128 KB each. Images stay in this
            browser until consent.
          </p>
        </fieldset>
        {pictures.length > 0 && (
          <section className="pilot-gallery" aria-label="Image previews">
            <p>{pictures.length} / 4 images</p>
            <div
              className="pilot-slides"
              onTouchStart={(e) => {
                e.currentTarget.dataset.touchX = String(e.touches[0].clientX);
              }}
              onTouchEnd={(e) => {
                const delta =
                  e.changedTouches[0].clientX -
                  Number(e.currentTarget.dataset.touchX);
                if (Math.abs(delta) > 35)
                  setActive((i) =>
                    Math.min(
                      pictures.length - 1,
                      Math.max(0, i + (delta < 0 ? 1 : -1)),
                    ),
                  );
              }}
            >
              {/* Blob URLs are authorized local previews; never public storage URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pictures[active]?.url ?? pictures[0].url}
                alt={`Synthetic upload ${active + 1}`}
              />
            </div>
            <div className="pilot-actions">
              <button
                type="button"
                disabled={active === 0}
                onClick={() => setActive((i) => i - 1)}
              >
                Previous image
              </button>
              <span aria-live="polite">
                {active + 1} / {pictures.length}
              </span>
              <button
                type="button"
                disabled={active >= pictures.length - 1}
                onClick={() => setActive((i) => i + 1)}
              >
                Next image
              </button>
            </div>
            {
              <ol>
                {pictures.map((p, i) => (
                  <li key={p.id}>
                    Image {i + 1} · {p.saved ? "Uploaded" : "Preview only"}{" "}
                    <button
                      type="button"
                      disabled={
                        busy || imageProcessing || restoring || Boolean(lead)
                      }
                      onClick={() => void rearrange(i, true)}
                    >
                      Remove image {i + 1}
                    </button>{" "}
                    <button
                      type="button"
                      disabled={
                        i === 0 ||
                        busy ||
                        imageProcessing ||
                        restoring ||
                        Boolean(lead)
                      }
                      onClick={() => void rearrange(i, false)}
                    >
                      Move image {i + 1} left
                    </button>
                  </li>
                ))}
              </ol>
            }
          </section>
        )}
        {step === "consent" && (
          <section className="pilot-consent" aria-labelledby="consent-heading">
            <h2 id="consent-heading">
              2. Notice and consent / ข้อตกลงและความยินยอม
            </h2>
            {/* Scrollable policy region must be reachable by keyboard. */}
            <div
              className="pilot-consent-copy"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              role="region"
              aria-label="Consent details"
            >
              <p>
                การรับคำขอไม่รับประกันทรัพย์ว่าง ราคา การจอง ผลลัพธ์
                หรือเวลาตอบกลับ ทีมต้องตรวจสอบก่อนนัดชม
              </p>
              <p>
                Submitting a request does not guarantee availability, price, a
                reservation, results or response time. The team must review it
                first.
              </p>
              <p>
                Middle Property จะเก็บชื่อ ช่องทางติดต่อ ความต้องการ รูปที่แนบ
                และแหล่งที่มาของคำขอ เพื่อให้ทีม Operations
                ตรวจสอบและติดต่อกลับตามความยินยอม
              </p>
              <p>
                Middle Property will store your name, contact, requirements,
                selected images and campaign attribution for authorized
                Operations staff to review and follow up. This preview accepts
                synthetic test information only. Notifications stay in the mock
                inbox.
              </p>
              <p>
                ก่อนยินยอม ข้อมูลและรูปที่เลือกจะอยู่ในหน้านี้เท่านั้น
                คุณสามารถไม่ยินยอมและออกจากขั้นตอนได้ ไม่มีการบันทึก Lead
              </p>
              <p>
                Before acceptance, details and images remain in this page only.
                Decline clears the unsaved draft. Test sessions expire after 24
                hours; the isolated test database is removed when the test
                server stops. No external contact is made.
              </p>
            </div>
            <label className="pilot-check">
              <input
                type="checkbox"
                checked={consent}
                disabled={
                  busy || restoring || Boolean(lead) || Boolean(session)
                }
                onChange={(e) => setConsent(e.target.checked)}
              />
              I accept / ฉันยินยอมให้บันทึกข้อมูลตามรายละเอียดข้างต้น
            </label>
            {
              <button
                type="button"
                className="secondary"
                disabled={
                  busy ||
                  imageProcessing ||
                  restoring ||
                  Boolean(session) ||
                  Boolean(lead)
                }
                onClick={decline}
              >
                Decline / ไม่ยินยอม
              </button>
            }
          </section>
        )}
        {
          <button
            className="pilot-submit"
            type="submit"
            disabled={busy || imageProcessing || restoring || Boolean(lead)}
          >
            {lead
              ? "Saved / บันทึกแล้ว"
              : busy
                ? "Saving… / กำลังบันทึก"
                : step === "details"
                  ? "Review consent / อ่านข้อตกลง"
                  : "Save test request / บันทึกคำขอจำลอง"}
          </button>
        }
      </form>
      <p className="pilot-status" role="status" aria-live="polite">
        {restoring
          ? "Restoring saved request and images… / กำลังเปิดข้อมูลและรูปที่บันทึก"
          : notice}
      </p>
      {lead && (
        <section className="pilot-result">
          <h2>Request saved / บันทึกคำขอแล้ว</h2>
          <p>
            Lead ID: <strong data-testid="lead-id">{lead.id}</strong>
          </p>
          <p>Status: {lead.status}</p>
          <p>Notification: generated_mock · sent: false</p>
        </section>
      )}
      {session && (
        <button
          className="secondary"
          disabled={busy || imageProcessing || restoring}
          onClick={() => {
            if (
              busyRef.current ||
              imageProcessingRef.current ||
              restoringRef.current
            )
              return;
            void reopen(session).catch((error) => setNotice(error.message));
          }}
        >
          Reopen saved request
        </button>
      )}
      <button
        className="secondary"
        disabled={busy || imageProcessing || restoring}
        onClick={() => {
          if (
            busyRef.current ||
            imageProcessingRef.current ||
            restoringRef.current
          )
            return;
          sessionStorage.removeItem(SESSION);
          location.reload();
        }}
      >
        Start a new mock request
      </button>
      <details>
        <summary>Test event log (no personal data)</summary>
        <output>{debug.join(" → ")}</output>
        <p>Build SHA: {__READINESS_BUILD_SHA__}</p>
      </details>
      <section id="contact">
        <h2>Contact / ติดต่อ</h2>
        <p>{CONTACT.brand}</p>
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          {CONTACT.line}
        </a>{" "}
        ·{" "}
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          {CONTACT.phone}
        </a>
      </section>
      <footer>
        {CONTACT.brand} ·{" "}
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          LINE {CONTACT.line}
        </a>{" "}
        ·{" "}
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          {CONTACT.phone}
        </a>{" "}
        · <a href="/pilot/inbox">Operations Inbox</a>
      </footer>
      <nav className="pilot-sticky" aria-label="Mobile contact">
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          Test LINE
        </a>
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          Test call
        </a>
      </nav>
    </main>
  );
}

type InboxLead = {
  id: string;
  status: string;
  consent_at: string;
  consent_version: string;
  notification_id: string;
  destination: string;
  notification_status: string;
  payload: PilotLeadInput;
  images: { id: string }[];
};
export function PilotInbox() {
  const [leads, setLeads] = useState<InboxLead[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [window, setWindow] = useState("");
  async function refresh() {
    try {
      const result = await api("inbox", null);
      setLeads(result.leads);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    api("inbox", null)
      .then((result) => setLeads(result.leads))
      .catch((error) => setError(error.message));
  }, []);
  async function update(
    lead: InboxLead,
    status: "qualified" | "viewing_ready",
  ) {
    try {
      await api("inbox", null, {
        method: "PATCH",
        body: JSON.stringify({
          lead_id: lead.id,
          status,
          ...(status === "viewing_ready" ? { viewing_window: window } : {}),
        }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="pilot-shell">
      <header className="pilot-nav">
        <a href="/pilot">Middle Property</a>
      </header>
      <p className="pilot-banner">
        MOCK OPERATIONS · Real destination authorization pending
      </p>
      <h1>Operations Inbox</h1>
      <button onClick={() => void refresh()}>Refresh inbox</button>
      <p role="alert">{error}</p>
      {leads.map((lead) => (
        <article className="pilot-result" key={lead.id}>
          <button onClick={() => setSelected(lead.id)}>{lead.id}</button>
          <p>{lead.status}</p>
          {selected === lead.id && (
            <>
              <h2>{lead.payload.name}</h2>
              <p>
                {lead.payload.contact} · {lead.payload.area} · THB{" "}
                {lead.payload.budget}
              </p>
              <p>
                Consent: {lead.consent_version} / {lead.consent_at}
              </p>
              <p>
                Notification: {lead.notification_id} → {lead.destination} (
                {lead.notification_status})
              </p>
              <p>Images: {lead.images.length}</p>
              <div className="pilot-inbox-images">
                {lead.images.map((p, i) => (
                  // Private authenticated images must bypass public image optimization.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={`/api/pilot/images/${p.id}`}
                    alt={`Request attachment ${i + 1}`}
                  />
                ))}
              </div>
              <p>
                Attribution: {lead.payload.attribution.first_touch.source} /{" "}
                {lead.payload.attribution.last_touch.campaign}
              </p>
              {lead.status === "pending_review" && (
                <button onClick={() => void update(lead, "qualified")}>
                  Qualify test lead
                </button>
              )}
              {lead.status === "qualified" && (
                <>
                  <label>
                    Viewing window
                    <input
                      value={window}
                      onChange={(e) => setWindow(e.target.value)}
                      placeholder="TEST 2026-10-01 14:00"
                    />
                  </label>
                  <button onClick={() => void update(lead, "viewing_ready")}>
                    Mark viewing-ready
                  </button>
                </>
              )}
            </>
          )}
        </article>
      ))}
    </main>
  );
}
