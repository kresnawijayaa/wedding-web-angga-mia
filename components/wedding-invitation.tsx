"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, CalendarDays, Check, ChevronDown, Copy, ExternalLink, MapPin, VolumeX } from "lucide-react";
import { PhotoReveal, Reveal } from "./reveal";
import { saveRsvp, sendWish, type FormState } from "@/app/actions";

const eventDate = new Date("2026-12-27T10:00:00+07:00").getTime();
const venueUrl = "https://maps.app.goo.gl/c7Yy2pBnrKLvVtpM8?g_st=com.google.maps.preview.copy";
const faq = [
  ["What time should I arrive?", "Guests may enter the church area from 09.30 WIB, after the Sunday morning Mass. We recommend arriving before 09.45 WIB. The holy matrimony begins at 10.00 WIB."],
  ["Is the reception at a different location?", "The reception will be held within the same general area, around St. Antonius Padua Church grounds. The reception begins at 13.30 WIB."],
  ["Is the reception indoor or outdoor?", "The reception is planned to take place in an outdoor area."],
  ["Can I bring a plus one?", "Please refer to the number of guests stated on your personal invitation."],
  ["Is parking available?", "Parking information and directions will be available at the venue."],
];

const galleryFilm = [
  { src: "/images/photo-1.webp", alt: "Airlangga and Agata sharing a playful kitchen moment" },
  { src: "/images/photo-3.webp", alt: "Agata embracing Airlangga while cooking" },
  { src: "/images/photo-4.webp", alt: "A candid moment at the kitchen counter" },
  { src: "/images/photo-5.webp", alt: "Airlangga and Agata cooking side by side" },
  { src: "/images/photo-7.webp", alt: "The couple preparing their meal together" },
  { src: "/images/photo-8.webp", alt: "A warm conversation in the kitchen" },
  { src: "/images/photo-10.webp", alt: "A quiet moment preparing ingredients" },
  { src: "/images/photo-11.webp", alt: "The couple holding ingredients playfully" },
  { src: "/images/photo-13.webp", alt: "Airlangga and Agata laughing together" },
  { src: "/images/photo-15.webp", alt: "Hands mixing and preparing food" },
  { src: "/images/photo-19.webp", alt: "The couple presenting a meal they made together" },
];

function Countdown() {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const distance = Math.max(0, eventDate - Date.now());
      setLeft({ days: Math.floor(distance / 86400000), hours: Math.floor(distance / 3600000) % 24, minutes: Math.floor(distance / 60000) % 60, seconds: Math.floor(distance / 1000) % 60 });
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, []);
  return <div className="countdown">{Object.entries(left).map(([label, value]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}</div>;
}

type InvitationProps = {
  guest: { name: string; maxGuests: number };
  initialRsvp: { attendance: "attending" | "not_attending"; guestCount: number; message: string } | null;
  wishes: Array<{ id: string; name: string; message: string }>;
};

const initialFormState: FormState = { status: "idle", message: "" };

export function WeddingInvitation({ guest, initialRsvp, wishes: approvedWishes }: InvitationProps) {
  const [experience, setExperience] = useState<"cover" | "opening" | "transition" | "hero">("cover");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUnavailable, setMusicUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const openingStartedRef = useRef(0);
  const openingResolvedRef = useRef(false);
  const openingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attendance, setAttendance] = useState(initialRsvp?.attendance === "not_attending" ? "no" : "yes");
  const [copied, setCopied] = useState<string | null>(null);
  const [rsvpState, rsvpAction, rsvpPending] = useActionState(saveRsvp, initialFormState);
  const [wishState, wishAction, wishPending] = useActionState(sendWish, initialFormState);
  const reduce = useReducedMotion();

  useEffect(() => () => {
    if (openingTimerRef.current) clearTimeout(openingTimerRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  function revealHeroWhenReady() {
    if (openingResolvedRef.current) return;
    openingResolvedRef.current = true;
    if (openingTimerRef.current) clearTimeout(openingTimerRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    const elapsed = performance.now() - openingStartedRef.current;
    const remaining = Math.max(0, 4800 - elapsed);
    openingTimerRef.current = setTimeout(() => {
      setExperience("transition");
      openingTimerRef.current = setTimeout(() => setExperience("hero"), reduce ? 80 : 850);
    }, remaining);
  }

  function openInvitation() {
    if (experience !== "cover") return;
    openingStartedRef.current = performance.now();
    openingResolvedRef.current = false;
    setExperience("opening");
    const audio = new Audio("/audio/the-way-you-look-at-me.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = "auto";
    const handlePlaying = () => {
      setMusicPlaying(true);
      revealHeroWhenReady();
    };
    const handleFailure = () => {
      setMusicPlaying(false);
      setMusicUnavailable(true);
      revealHeroWhenReady();
    };
    audio.addEventListener("playing", handlePlaying, { once: true });
    audio.addEventListener("error", handleFailure, { once: true });
    audioRef.current = audio;
    fallbackTimerRef.current = setTimeout(revealHeroWhenReady, 9000);
    void audio.play().then(() => {
      if (!audio.paused && audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) handlePlaying();
    }).catch(handleFailure);
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || musicUnavailable) return;
    if (audio.paused) {
      try {
        await audio.play();
        setMusicPlaying(true);
      } catch {
        setMusicPlaying(false);
      }
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }

  if (experience !== "hero") return (
    <AnimatePresence mode="sync">
    {experience === "cover" ? <motion.main className="cover" key="cover" exit={reduce ? undefined : { opacity: 0, scale: 1.018, filter: "blur(3px)" }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div className="cover-photo" initial={reduce ? false : { scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}>
        <Image src="/images/photo-12.webp" alt="Airlangga and Agata cooking together" fill preload quality={90} sizes="100vw" />
      </motion.div>
      <div className="cover-shade" />
      <motion.div className="cover-top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3, duration: 1 }}><span>A</span><i /> <span>M</span></motion.div>
      <motion.div className="cover-copy" initial={reduce ? false : "hidden"} animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .16, delayChildren: .45 } } }}>
        {[
          <p className="eyebrow" key="a">We’re getting married</p>,
          <h1 key="b">Airlangga <em>&</em> Mia</h1>,
          <p className="cover-date" key="c">27 December 2026 <span>Muntilan, Magelang</span></p>,
          <div className="guest" key="d"><small>Specially invited</small><strong>{guest.name}</strong></div>,
          <button className="primary light" onClick={openInvitation} key="e">Open invitation <ArrowDownRight aria-hidden="true"/></button>
        ].map((child, i) => <motion.div key={i} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: .85, ease: [0.16, 1, 0.3, 1] } } }}>{child}</motion.div>)}
      </motion.div>
      <p className="cover-note">A life made together</p>
    </motion.main> : <motion.main className={`invitation-opening${experience === "transition" ? " is-leaving" : ""}`} key="opening" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : .8 }}>
      <div className="opening-film-photo"><Image src="/images/photo-18.webp" alt="" fill priority quality={90} sizes="100vw"/></div>
      <div className="opening-film-shade"/>
      <div className="opening-film-grain"/>
      <div className="opening-mark" aria-label="Airlangga and Mia">
        <span>A</span><i/><em>&</em><i/><span>M</span>
        <small>27 · 12 · 2026</small>
      </div>
      <div className="opening-wipe" aria-hidden="true"/>
    </motion.main>}
    </AnimatePresence>
  );

  return (
    <main className="site">
      <motion.button className={`music${musicPlaying ? " is-playing" : ""}`} type="button" onClick={toggleMusic} disabled={musicUnavailable} aria-pressed={musicPlaying} aria-label={musicUnavailable ? "Background music unavailable" : musicPlaying ? "Pause background music" : "Play background music"} initial={reduce ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : 3.25, duration: reduce ? 0 : .55, ease: [0.22, 1, 0.36, 1] }}>
        {musicPlaying ? <span className="music-equalizer" aria-hidden="true"><i/><i/><i/></span> : <VolumeX aria-hidden="true" />}
        <span>{musicUnavailable ? "Unavailable" : musicPlaying ? "Music on" : "Music off"}</span>
      </motion.button>
      <section className="intro intro-cinematic full">
        <motion.div className="intro-photo intro-photo-cinematic" initial={reduce ? false : { opacity: 0, scale: 1.055, filter: "blur(7px) brightness(.68)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }} transition={{ duration: reduce ? 0 : 1.25, ease: [0.22, 1, 0.36, 1] }}>
          <div className="intro-photo-drift"><Image src="/images/photo-18.webp" alt="Airlangga and Agata smiling in the kitchen" fill preload quality={90} sizes="100vw" /></div>
        </motion.div>
        <div className="intro-tint" />
        <div className="intro-copy intro-copy-cinematic">
          <div className="intro-title-group">
            <motion.p className="eyebrow" initial={reduce ? false : { opacity: 0, letterSpacing: ".3em", filter: "blur(5px)" }} animate={{ opacity: 1, letterSpacing: ".19em", filter: "blur(0px)" }} transition={{ delay: reduce ? 0 : .7, duration: reduce ? 0 : .8, ease: [0.22, 1, 0.36, 1] }}>Save the date</motion.p>
            <h1>
              <motion.span className="intro-name-primary" initial={reduce ? false : { opacity: 0, y: 42, filter: "blur(9px)", clipPath: "inset(100% 0 0 0)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", clipPath: "inset(0% 0 0 0)" }} transition={{ delay: reduce ? 0 : 1.05, duration: reduce ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}>Airlangga</motion.span>
              <motion.span className="intro-name-secondary" initial={reduce ? false : { opacity: 0, y: 38, filter: "blur(9px)", clipPath: "inset(100% 0 0 0)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", clipPath: "inset(0% 0 0 0)" }} transition={{ delay: reduce ? 0 : 1.3, duration: reduce ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}><em>&</em> Mia</motion.span>
            </h1>
            <motion.p className="intro-formal-names" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 2.1, duration: reduce ? 0 : .75, ease: [0.22, 1, 0.36, 1] }}><span>Airlangga Wijaya</span><i>&</i><span>Agata Mia Wira Omega</span></motion.p>
          </div>
          <div className="intro-detail-group">
            <motion.div className="intro-meta" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 2.5, duration: reduce ? 0 : .75, ease: [0.22, 1, 0.36, 1] }}><span>27 December 2026</span><span>Muntilan, Magelang</span></motion.div>
            <motion.p className="intro-note" initial={reduce ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 2.8, duration: reduce ? 0 : .75, ease: [0.22, 1, 0.36, 1] }}>We would love to celebrate this special day with you.</motion.p>
          </div>
        </div>
        <motion.a className="scroll-cue intro-scroll-cue" href="#story" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 3.65, duration: reduce ? 0 : .7 }}><ChevronDown aria-hidden="true"/><span>Begin the story</span></motion.a>
      </section>

      <section className="opening paper" id="story">
        <Reveal className="opening-index">01 <span>Our story</span></Reveal>
        <Reveal className="opening-quote" delay={.1}><p>“A little story<br/>about us.”</p></Reveal>
        <div className="opening-layout">
          <PhotoReveal className="photo portrait"><Image src="/images/photo-20.webp" alt="A playful moment while cooking" fill quality={90} sizes="(max-width: 700px) 80vw, 42vw" /></PhotoReveal>
          <Reveal className="opening-text" direction="right">
            <p className="eyebrow dark">Our story</p><h2>A little story<br/><i>about us.</i></h2>
            <p>What started as a simple hello slowly became countless conversations, shared moments, and a life we wanted to build together.</p>
            <p>And now, surrounded by the people we love, we are ready for our next chapter.</p>
            <strong className="story-signature">Airlangga & Mia</strong>
          </Reveal>
        </div>
      </section>

      <section className="couple clay">
        <Reveal className="section-heading"><p className="eyebrow">The bride & groom</p><h2>Two stories,<br/>one home.</h2></Reveal>
        <div className="couple-grid">
          <Reveal className="person" direction="left"><span>01</span><h3>Airlangga<br/>Wijaya, S.P.</h3><p>Son of<br/><strong>Mr. Oey Pan Kip (Dedy S)</strong><br/>& Mrs. Shinta Br. Siahaan</p></Reveal>
          <PhotoReveal className="photo couple-photo"><Image src="/images/photo-6.webp" alt="Airlangga and Agata together" fill quality={90} sizes="(max-width: 700px) 90vw, 38vw" /></PhotoReveal>
          <Reveal className="person right" direction="right"><span>02</span><h3>Agata Mia Wira<br/>Omega, S.Pd., M.M.</h3><p>Daughter of<br/><strong>† Mr. A. Y. Dwi Anggora</strong><br/>& † Mrs. Maria Fransisca K.</p></Reveal>
        </div>
      </section>

      <section className="events ink">
        <Reveal className="events-lead"><p className="eyebrow">Our wedding</p><h2>One day.<br/><i>Held close.</i></h2><p>With joy, together with our families, we invite you to celebrate our wedding.</p></Reveal>
        <div className="event-list">
          <Reveal className="event" delay={.1}><span className="event-no">01</span><div><p className="eyebrow">Holy matrimony</p><h3>10.00—12.00</h3><p><strong>Gereja Katolik St. Antonius Padua, Muntilan</strong><br/>Muntilan, Magelang · Central Java</p><p className="event-note">Sunday, 27 December 2026.</p><a href={venueUrl} target="_blank" rel="noreferrer">View location <MapPin /></a></div></Reveal>
          <Reveal className="event" delay={.2}><span className="event-no">02</span><div><p className="eyebrow">Wedding reception</p><h3>13.30—15.30</h3><p><strong>St. Antonius Padua Catholic Church Courtyard</strong><br/>Muntilan, Magelang</p><p className="event-note">The reception will be held after the holy matrimony, in the church courtyard.</p><a href={venueUrl} target="_blank" rel="noreferrer">View location <MapPin /></a></div></Reveal>
        </div>
        <Reveal className="calendar-link"><CalendarDays/><span>Sunday<br/><strong>27 December 2026</strong></span><a href="/calendar">Add to calendar <ExternalLink aria-hidden="true"/></a></Reveal>
      </section>

      <section className="date-spread paper">
        <PhotoReveal className="date-photo"><Image src="/images/photo-16.webp" alt="The couple preparing a meal" fill quality={90} sizes="(max-width: 700px) 100vw, 50vw" /></PhotoReveal>
        <Reveal className="date-content" direction="right"><p className="eyebrow dark">Counting down</p><h2>Until we say<br/><i>“I do.”</i></h2><Countdown/><p className="small-date">27 December 2026 · 10.00 WIB</p></Reveal>
      </section>

      <section className="gallery paper">
        <Reveal className="gallery-title"><p className="eyebrow dark">Gallery</p><h2>A few chapters<br/><i>before “I do”</i></h2><p>A collection of moments, places, and memories from our journey together.</p></Reveal>
        <div className="gallery-composition">
          <div className="g1 gallery-photo"><Image src="/images/photo-9.webp" alt="Hands preparing fruit" fill quality={90} sizes="(max-width: 760px) 59vw, 42vw" /></div>
          <div className="g2 gallery-photo"><Image src="/images/photo-14.webp" alt="Cooking together" fill quality={90} sizes="(max-width: 760px) 64vw, 49vw" /></div>
          <div className="g3 gallery-photo"><Image src="/images/photo-17.webp" alt="A quiet moment together" fill quality={90} sizes="(max-width: 760px) 48vw, 35vw" /></div>
          <Reveal className="gallery-caption"><span>Not just the big moments.</span><strong>The little ones, too.</strong></Reveal>
        </div>
        <div className="gallery-film" aria-label="More moments from Airlangga and Agata">
          {galleryFilm.map((photo, index) => (
            <Reveal className={`film-frame film-frame-${(index % 4) + 1}`} delay={(index % 3) * 0.06} key={photo.src}>
              <div className="film-image">
                <Image src={photo.src} alt={photo.alt} fill quality={90} sizes="(max-width: 760px) 88vw, 38vw" />
              </div>
              <span>{String(index + 4).padStart(2, "0")} / 14</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="dress sage">
        <Reveal className="dress-title"><span>03</span><p className="eyebrow dark">Dress code</p><h2>Come as<br/><i>your best self.</i></h2></Reveal>
        <Reveal className="dress-copy"><h3>Formal / Semi-Formal</h3><p>The holy matrimony will be held inside the church, followed by an afternoon reception in an outdoor area. We recommend comfortable formal attire.</p><p className="eyebrow dark palette-label">Suggested colors</p><div className="swatches"><i className="beige"/><i className="olive"/><i className="champagne"/><i className="navy"/><i className="clay-dot"/></div><small>Earth tone · Beige · Sage · Champagne · Navy</small><p className="palette-note">The color palette is only a suggestion, not a requirement.</p></Reveal>
      </section>

      <section className="rsvp paper">
        <Reveal className="rsvp-intro"><p className="eyebrow dark">RSVP · Before 10 December 2026</p><h2>Will you be<br/><i>joining us?</i></h2><p>We would be very happy to celebrate with you.</p><div className="rsvp-name"><span>Name</span><strong>{guest.name}</strong></div></Reveal>
        <Reveal className="rsvp-form" delay={.15}>
          {rsvpState.status === "success" ? <div className="success"><Check/><h3>Thank you.</h3><p>{rsvpState.message}</p></div> : <form action={rsvpAction}>
            <fieldset><legend>Will you attend?</legend><label><input type="radio" name="attendance" value="yes" checked={attendance === "yes"} onChange={() => setAttendance("yes")} required/><span>Yes, happily</span></label><label><input type="radio" name="attendance" value="no" checked={attendance === "no"} onChange={() => setAttendance("no")} required/><span>Sorry, I can’t make it</span></label></fieldset>
            {attendance === "yes" && <fieldset><legend>Number of guests</legend><div className="guest-count">{Array.from({ length: guest.maxGuests }, (_, index) => index + 1).map(count => <label key={count}><input type="radio" name="count" value={count} defaultChecked={count === (initialRsvp?.guestCount || 1)}/><span><b>{count}</b><small>Guest{count > 1 ? "s" : ""}</small></span></label>)}</div></fieldset>}
            <label className="textarea">Message for the couple <textarea name="message" maxLength={800} defaultValue={initialRsvp?.message} placeholder="Optional" rows={4}/></label>
            {rsvpState.status === "error" && <p className="form-message error" role="alert">{rsvpState.message}</p>}
            <button className="primary" type="submit" disabled={rsvpPending}>{rsvpPending ? "Saving…" : initialRsvp ? "Update attendance" : "Confirm attendance"} <ArrowDownRight aria-hidden="true"/></button>
          </form>}
        </Reveal>
      </section>

      <section className="faq paper">
        <Reveal className="faq-title"><p className="eyebrow dark">Good to know</p><h2>A few<br/><i>details.</i></h2></Reveal>
        <Reveal className="faq-list">{faq.map(([q,a], i) => <details key={q} open={i===0}><summary><span>0{i+1}</span>{q}<i>+</i></summary><p>{a}</p></details>)}</Reveal>
      </section>

      <section className="gift warm">
        <Reveal><p className="eyebrow dark">Wedding gift</p><h2>Your presence is<br/><i>more than enough.</i></h2><p>Celebrating this day with you is already the greatest gift we could ask for.</p><p>For family and friends who would like to send a gift, you may do so through the details below.</p><address><span>Address</span>Puri Harapan C 12, 45, Setia Asih,<br/>Tarumajaya, Bekasi (17215)</address></Reveal>
        <Reveal className="bank-list" delay={.15}>
          <div className="bank"><small>Bank BCA</small><h3>Agata Mia Wira Omega</h3><p>456 · 139 · 8695</p><button onClick={() => {navigator.clipboard?.writeText("4561398695"); setCopied("agata"); setTimeout(() => setCopied(null), 1800);}}>{copied === "agata" ? <Check/> : <Copy/>}{copied === "agata" ? "Copied" : "Copy account number"}</button></div>
        </Reveal>
      </section>

      <section className="wishes-section ink">
        <Reveal className="wishes-intro"><p className="eyebrow">Wishes</p><h2>Leave us<br/><i>a note.</i></h2><p>A few words from you would mean a lot to us.</p><div className="wish-name"><span>Your name</span><strong>{guest.name}</strong></div></Reveal>
        <Reveal className="wish-form" delay={.1}><form action={wishAction}><label className="textarea">Your message<textarea name="wish" required minLength={3} maxLength={600} placeholder="Write something for Airlangga & Agata…" rows={5}/></label>{wishState.message && <p className={`form-message ${wishState.status}`} aria-live="polite">{wishState.message}</p>}<button className="primary light" disabled={wishPending}>{wishPending ? "Sending…" : "Send wishes"}<ArrowDownRight aria-hidden="true"/></button></form></Reveal>
        <div className="wish-list">{approvedWishes.length ? approvedWishes.map((wish, index) => <Reveal className="wish-item" delay={(index % 3) * .06} key={wish.id}><p>“{wish.message}”</p><span>— {wish.name}</span></Reveal>) : <Reveal className="wish-empty"><p>Your words will become part of this story.</p><span>Be the first to leave a note.</span></Reveal>}</div>
      </section>

      <section className="closing full">
        <Image src="/images/photo-21.webp" alt="Airlangga and Agata smiling together" fill quality={90} sizes="100vw" />
        <div className="closing-shade" />
        <Reveal className="closing-copy"><p className="eyebrow">With gratitude</p><h2>For being part<br/><i>of our journey.</i></h2><p className="closing-gratitude">To our family, friends, and everyone who has shared this story with us—thank you. We cannot wait to celebrate with you.</p><strong>Airlangga <i>&</i> Agata</strong><span>27 December 2026 · Muntilan, Magelang</span><small>See you there. ♡</small></Reveal>
      </section>
    </main>
  );
}
