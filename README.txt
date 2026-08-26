================================================================================
                    SITO RITA RONCASSAGLIA — GUIDA UTENTE
                Italian Genealogy & Heritage Journeys (sito statico)
================================================================================

INDICE
------
  1.  Cos'è questo progetto
  2.  Come aprire il sito in locale
  3.  Modificare informazioni di contatto / business
  4.  ATTIVARE L'INVIO EMAIL AUTOMATICO (Formspree)        ← IMPORTANTE
  5.  Dark mode e responsive
  6.  Modificare i testi delle pagine
  7.  Pubblicare il sito online
  8.  Sicurezza — cosa è stato implementato
  9.  Struttura dei file
  10. FAQ / Troubleshooting


================================================================================
1.  COS'È QUESTO PROGETTO
================================================================================

Sito vetrina statico per Rita Roncassaglia, che offre ricerche genealogiche e
"heritage journeys" a clienti italo-americani. Nessun framework, nessun build
step: HTML + CSS + JavaScript vanilla. Funziona aprendo direttamente i file
.html in un browser, oppure pubblicato su un qualsiasi servizio di hosting
statico (Netlify, GitHub Pages, Vercel, Cloudflare Pages, hosting tradizionale).

NOVITÀ rispetto alla versione iniziale:
  • Dark mode con toggle sole/luna nella barra di navigazione, che rispetta
    la preferenza del sistema operativo e ricorda la scelta dell'utente.
  • Sito completamente responsive (smartphone, tablet, desktop, anche in
    orientamento landscape e su schermi 4K).
  • Sistema di invio preventivi che NON apre più il client di posta
    dell'utente: il sito invia l'email da solo, in modo sicuro, tramite
    Formspree. Include honeypot anti-bot, rate-limiting, validazione email.


================================================================================
2.  COME APRIRE IL SITO IN LOCALE
================================================================================

Opzione A — Più semplice:
  Doppio-click su "index.html". Si apre nel browser.

Opzione B — Server locale (raccomandato, alcune funzioni richiedono HTTP):
  Apri un terminale nella cartella del sito ed esegui UNO di questi comandi:

      python3 -m http.server 5500
      # oppure
      npx serve .

  Poi vai a:    http://localhost:5500


================================================================================
3.  MODIFICARE INFORMAZIONI DI CONTATTO / BUSINESS
================================================================================

Tutti i dati pubblici (nome, telefono, email mostrata sulla pagina contatti,
indirizzo, social) vivono in UN solo file:

    assets/js/config.js

Apri il file, modifica i campi nella sezione "business: { ... }" e salva.
I valori si propagano automaticamente in tutte le pagine grazie agli
attributi data-biz="...".


================================================================================
4.  ATTIVARE L'INVIO EMAIL AUTOMATICO (FORMSPREE)        ← IMPORTANTE
================================================================================

Per impostazione predefinita il sito è configurato per usare FORMSPREE
(www.formspree.io) come servizio di invio email. Questo è il modo più sicuro
e professionale per un sito statico, perché:

  ✔  L'utente NON deve aprire il proprio client email.
  ✔  Non esponiamo nessuna API key nel codice (l'endpoint Formspree è
     pubblico ma protetto contro abuse da Formspree stesso).
  ✔  Formspree ha protezioni anti-spam integrate (Akismet, reCAPTCHA
     opzionale, validazione email, throttling).
  ✔  Conformità GDPR (server in EU su richiesta).
  ✔  Tier gratuito: 50 invii al mese — più che sufficiente.

Per attivarlo servono 2 minuti. Segui questi passi:

--------------------------------------------------------------------------------
PASSO 1 — Crea un account gratuito su Formspree
--------------------------------------------------------------------------------

  1. Apri il browser e vai a:    https://formspree.io
  2. Clicca su "Get Started" oppure "Sign Up" in alto a destra.
  3. Registrati con la TUA email — quella su cui vuoi RICEVERE le richieste
     di preventivo. Se vuoi che le richieste arrivino a:
        riccardo.riccimingani@gmail.com
     registrati con quella stessa email.
  4. Conferma la registrazione cliccando il link che ricevi via email.
  5. Effettua il login.

--------------------------------------------------------------------------------
PASSO 2 — Crea un nuovo "form"
--------------------------------------------------------------------------------

  1. Una volta dentro la dashboard, clicca "+ New Form".
  2. Dai un nome al form, ad esempio:   "Richieste preventivo sito Rita"
  3. Nel campo "Send Submissions To" inserisci l'indirizzo email a cui
     vuoi che arrivino le richieste (es. riccardo.riccimingani@gmail.com).
  4. Clicca "Create Form".

--------------------------------------------------------------------------------
PASSO 3 — Copia l'endpoint
--------------------------------------------------------------------------------

  1. Formspree ti mostra una pagina con un blocco di codice del tipo:

        <form action="https://formspree.io/f/xyzabc12" method="POST">

  2. Copia SOLO l'URL:

        https://formspree.io/f/xyzabc12

     (le ultime 8 lettere/numeri saranno diverse per il tuo form)

--------------------------------------------------------------------------------
PASSO 4 — Incolla l'endpoint nel sito
--------------------------------------------------------------------------------

  1. Apri il file:    assets/js/config.js
  2. Trova il blocco:

        formspree: {
          endpoint: "https://formspree.io/f/YOUR_FORM_ID"
        },

  3. Sostituisci la stringa "https://formspree.io/f/YOUR_FORM_ID" con
     l'endpoint reale che hai copiato dal passo precedente.
     Il risultato sarà tipo:

        formspree: {
          endpoint: "https://formspree.io/f/xyzabc12"
        },

  4. Salva il file.

--------------------------------------------------------------------------------
PASSO 5 — (Sicurezza extra) Restringi il form al solo dominio del sito
--------------------------------------------------------------------------------

Questo passo è opzionale ma fortemente consigliato per evitare che qualcuno
ti spammi inviando richieste fasulle dall'esterno. Funziona solo dopo che hai
pubblicato il sito online.

  1. Dentro Formspree, apri il form che hai appena creato.
  2. Vai nel tab "Settings" → "Form Settings".
  3. Trova l'opzione "Domain Restrictions" (o "Allowed Domains").
  4. Aggiungi il dominio dove pubblicherai il sito, esempio:

        ritaroncassaglia.com

  5. Salva.

Da questo momento, Formspree accetterà invii SOLO se la richiesta arriva da
quel dominio. Tutte le richieste fasulle vengono rifiutate automaticamente.

--------------------------------------------------------------------------------
PASSO 6 — Testa l'invio
--------------------------------------------------------------------------------

  1. Apri il sito (in locale o online).
  2. Vai alla pagina "Request a quote".
  3. Compila il form con dati di test e clicca "Send my request".
  4. Dopo qualche secondo dovrebbe apparire il messaggio verde:
       "Grazie! La tua richiesta è stata inviata."
  5. Controlla la tua casella email (anche cartella spam la prima volta):
     dovresti ricevere una mail con oggetto:
       "Quote request — [pacchetto] — [Nome utente]"

  ⚠  IMPORTANTE: la primissima richiesta che arriva, Formspree ti chiede di
     confermare la tua email cliccando un link. Solo dopo aver confermato,
     le richieste successive arriveranno in automatico.


================================================================================
5.  DARK MODE E RESPONSIVE
================================================================================

DARK MODE
  • Toggle sole/luna nella navbar (in alto a destra, accanto al pulsante CTA).
  • Al primo accesso il sito usa la preferenza del sistema operativo
    dell'utente (chiaro/scuro).
  • Quando l'utente clicca il toggle, la scelta viene ricordata in
    localStorage (sopravvive ai refresh, alle pagine, ai riavvii del browser).
  • Lo stile dark è coerente con la palette toscana: terracotta più chiaro,
    crema scuro per i fondi, oro tenue per gli accenti.

RESPONSIVE
  Il sito è ottimizzato per:
    • smartphone piccoli (≤ 380px)
    • smartphone standard (381–640px)
    • tablet in verticale (641–900px)
    • tablet in orizzontale / laptop piccoli (901–1100px)
    • desktop (1101px+)
    • monitor grandi (1400px+)
  Più trattamento speciale per:
    • smartphone in landscape (height ≤ 560px)
    • dispositivi touch (input più grandi per evitare zoom su iOS)
    • stampa (rimuove navbar/footer)


================================================================================
6.  MODIFICARE I TESTI DELLE PAGINE
================================================================================

Ogni pagina è un file HTML autonomo. Per cambiare il testo, apri il file e
modifica direttamente il contenuto tra i tag.

  index.html         — Home (hero, intro, pacchetti, testimonianze)
  about.html         — Profilo di Rita
  services.html      — Descrizione dei due pacchetti + add-on
  experience.html    — Procedura passo-passo + FAQ
  testimonials.html  — Storie estese delle famiglie
  quote.html         — Configuratore preventivo multi-step
  contact.html       — Contatti + percorso "Start my tree"
  privacy.html       — Informativa privacy
  cookies.html       — Cookie (il sito non ne usa)


================================================================================
7.  PUBBLICARE IL SITO ONLINE
================================================================================

Opzione A — NETLIFY (il più semplice, gratis):
  1. Vai su https://www.netlify.com e registrati.
  2. Clicca "Add new site" → "Deploy manually".
  3. Trascina la cartella SITO_RITA dentro la finestra di Netlify.
  4. In pochi secondi ricevi un URL pubblico tipo
     https://random-name-123.netlify.app
  5. Da lì puoi collegare un dominio personalizzato (es. ritaroncassaglia.com).

Opzione B — VERCEL:
  Stesso processo, su https://vercel.com

Opzione C — GITHUB PAGES:
  Carica i file in un repository GitHub, attiva Pages dalle impostazioni.

Opzione D — HOSTING TRADIZIONALE (Aruba, OVH, SiteGround, ecc.):
  Caricare i file via FTP nella cartella public_html / www / htdocs.

Dopo la pubblicazione, RICORDA il PASSO 5 della sezione 4 — restringi
Formspree al tuo dominio.


================================================================================
8.  SICUREZZA — COSA È STATO IMPLEMENTATO
================================================================================

Il sito è statico, quindi non c'è un backend nostro da proteggere. Tuttavia
abbiamo aggiunto difese a strati sul form di preventivo:

  1. HONEYPOT FIELD
     Un campo nascosto chiamato "_website" è invisibile agli utenti umani.
     I bot lo compilano automaticamente — se è pieno, l'invio viene
     silenziosamente scartato.

  2. TIME-BASED BOT DETECTION
     Se il form viene inviato in meno di 3 secondi dal caricamento della
     pagina, è quasi sicuramente un bot. Blocchiamo l'invio.

  3. RATE-LIMITING CLIENT-SIDE
     Lo stesso browser non può inviare più di una richiesta ogni 60 secondi
     (timestamp salvato in localStorage). Evita lo spam ripetuto.

  4. VALIDAZIONE EMAIL ROBUSTA
     Pattern RFC-conforme, lunghezza min/max, niente caratteri di controllo.

  5. SANITIZZAZIONE OUTPUT
     Tutti i valori vengono ripuliti dai caratteri di controllo prima di
     entrare nel corpo dell'email — niente injection nel testo.

  6. NESSUNA API KEY ESPOSTA
     L'endpoint Formspree è pubblico ma di per sé non concede privilegi.
     Nessuna credenziale di terze parti (SMTP, SMS, ecc.) nel codice.

  7. CONTENT SECURITY (lato browser)
     Niente eval, niente innerHTML su input utente non scappato
     (uso escapeHtml in tutti i punti dove inietto testo). Niente librerie
     esterne caricate dinamicamente.

  8. DOMAIN RESTRICTION SU FORMSPREE
     Una volta pubblicato il sito, attivare la restrizione di dominio nelle
     impostazioni del form (vedi PASSO 5). Solo richieste dal dominio
     autorizzato vengono accettate dal server Formspree.

Cosa NON facciamo (consapevolmente):
  • Non raccogliamo cookie di tracking.
  • Non usiamo Google Analytics o pixel di terze parti.
  • Non salviamo dati utente sul client (eccetto: preferenza tema e
    timestamp dell'ultimo invio — entrambi in localStorage, nessun dato
    lascia il browser).


================================================================================
9.  STRUTTURA DEI FILE
================================================================================

  SITO_RITA/
  ├── index.html              Home
  ├── about.html              Profilo Rita
  ├── services.html           Pacchetti + add-on
  ├── experience.html         Procedura + FAQ
  ├── testimonials.html       Storie delle famiglie
  ├── quote.html              Configuratore preventivo
  ├── contact.html            Contatti
  ├── privacy.html            Informativa privacy
  ├── cookies.html            Cookie (nessuno)
  ├── robots.txt / sitemap.xml
  ├── README.txt              ← Questo file
  └── assets/
      ├── css/
      │   ├── fonts.css           Font serviti dal sito (non da Google)
      │   ├── main.css            Tema chiaro + scuro + componenti
      │   └── responsive.css      Breakpoint multi-device
      ├── js/
      │   ├── config.js           ★ Configurazione (email, Formspree, business)
      │   ├── main.js             Navigazione, dark-mode toggle, animazioni
      │   ├── configurator.js     Multi-step form, validazione, riepilogo live
      │   └── quote-send.js       Invio sicuro tramite Formspree + anti-bot
      └── img/
          ├── hero-pattern.svg
          ├── italy-map.svg
          ├── olive-branch.svg
          ├── ornament-corner.svg
          └── divider-leaf.svg


================================================================================
10. FAQ / TROUBLESHOOTING
================================================================================

Q. Ho compilato il form ma non ricevo le email.
A. Controlla nell'ordine:
   1. Hai sostituito "YOUR_FORM_ID" con il tuo endpoint reale in config.js?
   2. Hai confermato la prima email da Formspree (link di verifica)?
   3. Controlla la cartella SPAM — la primissima volta può finire lì.
   4. Vai sulla dashboard Formspree → "Submissions": vedi la richiesta?
      Se sì → il sito funziona, è la tua casella che la filtra.
      Se no → l'endpoint è sbagliato, ricontrolla il PASSO 4.

Q. Il sito si apre in dark mode quando dovrebbe essere chiaro.
A. Il sito segue la preferenza del tuo sistema operativo al primo accesso.
   Clicca il toggle sole/luna in alto a destra per cambiare. La scelta
   verrà ricordata.

Q. Sul mio smartphone il menu non si apre.
A. Tocca l'icona hamburger (le tre righe orizzontali) in alto a destra.
   Se non funziona, prova a fare hard-refresh (svuota cache del browser).

Q. Come cambio i colori del sito?
A. Le variabili colore sono in assets/css/main.css, nel blocco ":root { ... }"
   (linee iniziali). Per la dark mode, modifica il blocco
   "[data-theme="dark"] { ... }" più sotto.

Q. Voglio aggiungere un'altra pagina.
A. Duplica index.html, rinomina (es. "blog.html"), modifica il contenuto.
   Per farla apparire nella navbar, aggiungi una voce <li> dentro
   <ul class="nav__links"> in TUTTE le pagine (purtroppo è duplicato
   perché siamo senza framework — ma è solo una riga).

Q. Voglio cambiare il tempo minimo di compilazione (anti-bot).
A. In config.js, sezione "security":
       minFillSeconds: 3        ← in secondi
       minSecondsBetweenSubmits: 60

Q. Formspree mi dice "form is paused" o "limit reached".
A. Hai superato i 50 invii/mese del piano gratuito. Soluzioni:
   1. Aspetta il primo del mese (il contatore si resetta).
   2. Passa al piano "Basic" di Formspree (~$10/mese, 1000 invii).
   3. Cambia servizio: imposta "method: emailjs" in config.js e configura
      EmailJS che ha 200 invii/mese gratis.


================================================================================
                          FINE — Buon lavoro!
                Per problemi tecnici contatta lo sviluppatore.
================================================================================
