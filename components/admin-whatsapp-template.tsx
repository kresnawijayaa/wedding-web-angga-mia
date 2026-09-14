"use client";

import { useActionState, useRef, useState } from "react";
import { X } from "lucide-react";
import { updateWhatsappTemplate, type AdminFormState } from "@/app/admin/actions";
import { DEFAULT_WHATSAPP_TEMPLATE, renderWhatsappTemplate } from "@/lib/whatsapp-template";

const initialState: AdminFormState = { status: "idle", message: "" };
const sampleLink = "https://togetherforever.id/abcdef";

export function AdminWhatsappTemplate({ initialTemplate }: { initialTemplate: string }) {
  const [state, action, pending] = useActionState(updateWhatsappTemplate, initialState);
  const [template, setTemplate] = useState(initialTemplate);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasRequiredPlaceholders = template.includes("{name}") && template.includes("{link}");

  function insertPlaceholder(value: "{name}" | "{link}") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setTemplate(`${template.slice(0, start)}${value}${template.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + value.length, start + value.length);
    });
  }

  return (
    <section className="admin-message-launcher" aria-labelledby="whatsapp-template-title">
      <div>
        <p className="admin-kicker">Message settings</p>
        <h2 id="whatsapp-template-title">WhatsApp invitation</h2>
        <p>Customize the message and check its preview.</p>
      </div>
      <button className="admin-button secondary" type="button" onClick={() => dialogRef.current?.showModal()}>Edit message</button>

      <dialog ref={dialogRef} className="admin-message-dialog" aria-labelledby="whatsapp-dialog-title" onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}>
        <div className="admin-dialog-shell">
          <div className="admin-dialog-header">
            <div><p className="admin-kicker">Message settings</p><h2 id="whatsapp-dialog-title">WhatsApp invitation</h2></div>
            <button className="admin-dialog-close" type="button" aria-label="Close message settings" onClick={() => dialogRef.current?.close()}><X aria-hidden="true"/></button>
          </div>
          <p className="admin-dialog-note">Every guest’s WhatsApp button will use this template. Changes are shared across devices.</p>
          <div className="admin-message-grid">
            <form action={action} className="admin-message-form">
              <div className="admin-field-heading"><label htmlFor="whatsapp-template">Message template</label><span>{template.length}/2000</span></div>
              <textarea id="whatsapp-template" ref={textareaRef} name="template" value={template} onChange={(event) => setTemplate(event.target.value)} minLength={20} maxLength={2000} rows={11} required/>
              <div className="admin-placeholder-row">
                <span>Insert:</span>
                <button type="button" onClick={() => insertPlaceholder("{name}")}>{"{name}"}</button>
                <button type="button" onClick={() => insertPlaceholder("{link}")}>{"{link}"}</button>
              </div>
              {!hasRequiredPlaceholders && <p className="admin-inline-warning">Keep both <code>{"{name}"}</code> and <code>{"{link}"}</code> in the message.</p>}
              <div className="admin-message-actions">
                <button className="admin-button" disabled={pending || !hasRequiredPlaceholders}>{pending ? "Saving…" : "Save template"}</button>
                <button className="admin-button secondary" type="button" onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}>Restore default</button>
              </div>
              {state.message && <p className={`form-message ${state.status}`} aria-live="polite">{state.message}</p>}
            </form>
            <div className="admin-message-preview">
              <span>Preview</span>
              <div><small>Airlangga & Mia</small><p>{renderWhatsappTemplate(template, "Kresna Wijaya & Partner", sampleLink)}</p></div>
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}
