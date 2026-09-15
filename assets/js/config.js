/* =============================================================
   SITE CONFIGURATION
   -------------------------------------------------------------
   Modifica questo file per cambiare a chi vengono recapitate le
   richieste di preventivo. La modalità raccomandata è "formspree"
   perché non apre il client di posta dell'utente: il sito invia
   l'email da solo, in modo sicuro, attraverso Formspree.

   👉 Vedi README.txt per la guida passo-passo all'attivazione.
   ============================================================= */

window.SITE_CONFIG = {

  /* ---------- Informazioni business mostrate nel sito ---------- */
  business: {
    name: "Italian Roots with Rita",
    tagline: "Italian Ancestry & Heritage Journeys",
    /* Payoff mostrato accanto al nome quando il sito e' in italiano. */
    taglineIt: "Ricerca genealogica e viaggi nelle radici",
    baseLocation: "Emilia-Romagna, Italy",
    baseLocationIt: "Emilia-Romagna, Italia",
    serviceArea: "All of Italy",
    /* Rita ha chiesto di NON pubblicare il telefono: lasciare vuoti.
       Se restano vuoti, main.js non popola nessun elemento data-biz="phone". */
    phone: "",
    whatsapp: "",
    publicEmail: "rita.mail@esempio.com",   // mostrata nella pagina contatti
    /* Profilo Instagram. Appena la pagina e' online incolla qui l'indirizzo
       completo (es. "https://www.instagram.com/nomeprofilo/"): il link nel
       footer di tutte le pagine si aggiorna da solo. Finche' resta vuoto,
       l'icona rimanda alla home di Instagram. */
    instagramUrl: "",
    instagram: "",
    facebook: "Rita Roncassaglia"
  },

  /* ---------- Dove vengono recapitate le richieste di preventivo ---------- */
  delivery: {
    /*
       method:
         "formspree" — il sito invia la richiesta in autonomia tramite
                       formspree.io. L'utente NON deve aprire il client
                       email. Più sicuro, più professionale.
                       Setup: vedi README.txt (2 minuti).
         "mailto"    — apre il client email dell'utente con il testo
                       pre-compilato. Fallback se Formspree non è
                       configurato.
         "emailjs"   — alternativa client-side via emailjs.com.
    */
    method: "formspree",

    /* Email che riceve le richieste (usata da "mailto" e nei link nel sito) */
    recipientEmail: "riccardo.riccimingani@gmail.com",
    ccEmails: "",

    /* --- Formspree --- (configura l'endpoint qui dopo aver creato il form) */
    formspree: {
      /* Incolla qui l'endpoint Formspree (es. "https://formspree.io/f/xyzabc12").
         Finché contiene "YOUR_FORM_ID", il sito ricade automaticamente
         sulla modalità mailto. */
      endpoint: "https://formspree.io/f/mdavrnql"
    },

    /* --- EmailJS (opzionale) --- */
    emailjs: {
      publicKey: "YOUR_PUBLIC_KEY",
      serviceId: "YOUR_SERVICE_ID",
      templateId: "YOUR_TEMPLATE_ID"
    }
  },

  /* ---------- Sicurezza del modulo preventivo ---------- */
  security: {
    /* Anti-bot: minimo numero di secondi tra apertura form e invio.
       Se l'utente invia in meno di X secondi, blocchiamo (è quasi
       certamente un bot). */
    minFillSeconds: 3,

    /* Rate-limit: secondi minimi tra due invii dallo stesso browser. */
    minSecondsBetweenSubmits: 60
  },

  /* ---------- Prenotazione call conoscitiva gratuita ----------
     Incolla qui il link al tuo calendario (Calendly, Cal.com, Google
     Appointment Schedule, ecc.). Esempio: "https://calendly.com/rita/15min".

     • url vuoto  → i pulsanti "Prenota una call" rimandano alla pagina
                    Contatti, così il sito funziona comunque.
     • embed:true → sulla pagina Contatti la pagina di prenotazione viene
                    mostrata incorporata (iframe). Richiede un url valido.
  */
  booking: {
    /* Decisione di Rita (PIANO 5.1): niente calendario, solo email.
       Se un giorno si vuole un calendario tipo Cal.com: enabled: true + url. */
    enabled: false,
    url: "",
    embed: true
  },

  /* ---------- Flag comportamentali ---------- */
  flags: {
    enableAnimations: true,
    enableParallax: true
  }
};
