"use client";

import { useState, useEffect } from "react";
import AuthLayout from "@/components/layout/AuthLayout";

const sections = [
  { id: "introduzione", label: "Come funziona" },
  { id: "dashboard", label: "La Dashboard" },
  { id: "progetto-manuale", label: "Creare un progetto" },
  { id: "nota-vocale", label: "Nota vocale" },
  { id: "gestire-task", label: "Gestire le task" },
  { id: "chat-ai", label: "Chat AI" },
  { id: "gestione-team", label: "Gestione Team" },
  { id: "glossario", label: "Glossario" },
];

function ScreenshotPlaceholder({ caption }: { caption: string }) {
  return (
    <div className="bg-card-hover border border-border rounded-lg p-8 my-4 text-center">
      <div className="text-text-muted text-sm mb-2">[ Screenshot ]</div>
      <p className="text-text-secondary text-sm italic">{caption}</p>
    </div>
  );
}

export default function GuidaPage() {
  const [activeSection, setActiveSection] = useState("introduzione");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setActiveSection(hash);
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-semibold text-text-primary mb-8">
        Guida al Gestionale
      </h1>

      <div className="flex gap-8">
        {/* Desktop Table of Contents */}
        <nav className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
          <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Indice
          </p>
          <ul className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollToSection(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? "bg-gold/10 text-gold font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-card-hover"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Accordion Index */}
        <div className="lg:hidden w-full mb-6">
          <details className="bg-card border border-border rounded-lg">
            <summary className="px-4 py-3 text-base font-semibold text-text-primary cursor-pointer">
              Indice della Guida
            </summary>
            <ul className="px-4 pb-3 space-y-1">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollToSection(s.id)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-gold"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl space-y-12">
          {/* Introduzione */}
          <section id="introduzione" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Come funziona il gestionale
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Questo è il gestionale interno di Monichs. Serve a tenere traccia
              di tutti i progetti e le attività del team. L&apos;intelligenza
              artificiale ti aiuta a organizzare il lavoro, stimare i tempi e
              prevedere eventuali ritardi.
            </p>
            <p className="text-base text-text-secondary leading-relaxed">
              Qui sotto trovi le istruzioni per ogni funzionalità. Tutto è
              scritto in modo semplice — se qualcosa non è chiaro, scrivici
              nella Chat AI e ti aiuterà!
            </p>
            <ScreenshotPlaceholder caption="Panoramica dell'interfaccia principale del gestionale" />
          </section>

          {/* Dashboard */}
          <section id="dashboard" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              La Dashboard — La tua pagina principale
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Quando entri nel gestionale, la prima cosa che vedi è la
              Dashboard. È un riepilogo di tutto quello che sta succedendo: i
              progetti attivi, le task urgenti e gli avvisi dell&apos;AI.
            </p>

            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                Cosa significano gli indicatori
              </h3>
              <ul className="space-y-3 text-base text-text-secondary">
                <li className="flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <span>
                    <strong className="text-green-500">In Regola</strong> — Il
                    progetto procede secondo i piani. Nessun problema.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">🟡</span>
                  <span>
                    <strong className="text-yellow-500">A Rischio</strong> —
                    Alcune task potrebbero essere in ritardo. Dai un&apos;occhiata.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">🔴</span>
                  <span>
                    <strong className="text-red-500">In Ritardo</strong> — Il
                    progetto è in ritardo. Serve intervenire.
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-base text-text-secondary">
              Per vedere i dettagli di un progetto, <strong>clicca sul nome del
              progetto</strong> o sulla card corrispondente. Per vedere una task
              specifica, cliccaci sopra.
            </p>
            <ScreenshotPlaceholder caption="Dashboard con i progetti attivi e gli indicatori di stato" />
          </section>

          {/* Creare progetto manualmente */}
          <section id="progetto-manuale" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Come creare un progetto manualmente
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Puoi creare un progetto inserendo i dettagli a mano. È il metodo
              più semplice se hai già le idee chiare su cosa fare.
            </p>

            <ol className="space-y-4 text-base text-text-secondary">
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">1.</span>
                <span>
                  Clicca <strong>&quot;Progetti&quot;</strong> nella barra a sinistra
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">2.</span>
                <span>
                  Clicca il bottone <strong>&quot;+ Nuovo Progetto&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">3.</span>
                <span>
                  Scegli <strong>&quot;Crea manualmente&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">4.</span>
                <span>
                  Compila il nome, la descrizione e la data di scadenza
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">5.</span>
                <span>
                  Clicca <strong>&quot;Crea Progetto&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">6.</span>
                <span>
                  Ora puoi aggiungere le task una alla volta cliccando{" "}
                  <strong>&quot;+ Aggiungi Task&quot;</strong>
                </span>
              </li>
            </ol>
            <ScreenshotPlaceholder caption="Form di creazione progetto manuale" />
          </section>

          {/* Nota vocale */}
          <section id="nota-vocale" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Come creare un progetto con la nota vocale
            </h2>
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-4">
              <p className="text-gold font-semibold">
                Questa è la funzione più potente del gestionale!
              </p>
            </div>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Puoi registrare un messaggio vocale dove spieghi cosa vuoi fare, e
              l&apos;intelligenza artificiale creerà automaticamente il progetto
              con tutte le task, assegnandole alle persone giuste del team.
            </p>

            <ol className="space-y-4 text-base text-text-secondary">
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">1.</span>
                <span>
                  Clicca <strong>&quot;Progetti&quot;</strong> → <strong>&quot;+ Nuovo
                  Progetto&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">2.</span>
                <span>
                  Scegli <strong>&quot;🎤 Crea da nota vocale&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">3.</span>
                <span>
                  Imposta la durata prevista del progetto (es. &quot;2
                  settimane&quot;, &quot;1 mese&quot;)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">4.</span>
                <span>
                  Clicca il <strong>bottone rosso 🔴</strong> per registrare,
                  oppure trascina un file audio nell&apos;area indicata
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">5.</span>
                <span>
                  <strong>Parla liberamente:</strong> spiega il progetto, cosa
                  bisogna fare, chi dovrebbe occuparsi di cosa
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">6.</span>
                <span>
                  Quando hai finito, clicca <strong>&quot;Stop&quot;</strong> e poi{" "}
                  <strong>&quot;Invia&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">7.</span>
                <span>
                  Aspetta qualche secondo — l&apos;AI sta analizzando il tuo
                  messaggio
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">8.</span>
                <span>
                  Vedrai una schermata di <strong>ANTEPRIMA</strong> con il
                  progetto generato: nome, task, assegnazioni, priorità
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">9.</span>
                <span>
                  <strong>CONTROLLA TUTTO:</strong> puoi modificare qualsiasi
                  cosa prima di confermare
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold shrink-0">10.</span>
                <span>
                  Quando sei soddisfatto, clicca{" "}
                  <strong>&quot;Conferma e Crea Progetto&quot;</strong>
                </span>
              </li>
            </ol>
            <ScreenshotPlaceholder caption="Interfaccia di registrazione nota vocale e anteprima progetto" />
          </section>

          {/* Gestire le task */}
          <section id="gestire-task" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Come gestire le task
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Le task sono le singole attività da completare all&apos;interno di
              un progetto. Puoi gestirle dalla vista Kanban (le colonne) o dalla
              lista su mobile.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">
              Cambiare lo stato di una task
            </h3>
            <ul className="space-y-2 text-base text-text-secondary mb-4">
              <li>
                <strong>Su desktop:</strong> trascina la card da una colonna
                all&apos;altra
              </li>
              <li>
                <strong>Su mobile o nel dettaglio:</strong> clicca sulla task e
                usa il menu a tendina per cambiare lo stato
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">
              Aggiungere un commento
            </h3>
            <p className="text-base text-text-secondary mb-4">
              Clicca su una task per aprirne i dettagli. In basso trovi il campo
              per scrivere un commento. Scrivi il tuo messaggio e premi
              &quot;Invia&quot; (o il tasto Invio).
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">
              Segnalare un blocco
            </h3>
            <p className="text-base text-text-secondary mb-4">
              Se una task è bloccata (non puoi procedere), cambia il suo stato a
              &quot;Bloccata&quot;. La task apparirà nella sezione &quot;Attenzione
              Richiesta&quot; della Dashboard.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">
              Cosa significano le priorità
            </h3>
            <div className="space-y-2 text-base text-text-secondary">
              <p>
                <span className="inline-block px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-sm font-semibold mr-2">
                  Critica
                </span>
                Da fare immediatamente, blocca tutto il resto
              </p>
              <p>
                <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold mr-2">
                  Alta
                </span>
                Importante, da fare presto
              </p>
              <p>
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold mr-2">
                  Media
                </span>
                Da fare nei tempi previsti
              </p>
              <p>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold mr-2">
                  Bassa
                </span>
                Può aspettare, da fare quando c&apos;è tempo
              </p>
            </div>
            <ScreenshotPlaceholder caption="Vista Kanban con le colonne Da Fare, In Corso, In Revisione, Completata, Bloccata" />
          </section>

          {/* Chat AI */}
          <section id="chat-ai" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              La Chat AI — Il tuo consulente personale
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Puoi parlare con l&apos;AI come se fosse un consulente. Chiedile
              qualsiasi cosa sui tuoi progetti: suggerimenti, analisi dei
              ritardi, consigli su come organizzare il lavoro.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Come aprire la chat
            </h3>
            <p className="text-base text-text-secondary mb-4">
              Clicca <strong>&quot;Chat AI&quot;</strong> nella barra a sinistra. Puoi
              scegliere se parlare in modo generale (tutti i progetti) o
              selezionare un progetto specifico dal menu in alto.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Esempi di domande utili
            </h3>
            <ul className="space-y-2 text-base text-gold mb-4">
              <li>&quot;Quali task sono in ritardo?&quot;</li>
              <li>&quot;Come posso velocizzare il progetto X?&quot;</li>
              <li>&quot;A chi dovrei assegnare questa nuova attività?&quot;</li>
              <li>&quot;Qual è lo stato generale dei progetti?&quot;</li>
              <li>&quot;Suggeriscimi una strategia per il lancio Kickstarter&quot;</li>
            </ul>
            <ScreenshotPlaceholder caption="Interfaccia della Chat AI in stile messaggeria" />
          </section>

          {/* Gestione Team */}
          <section id="gestione-team" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Per gli Admin — Gestione del Team
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Solo gli amministratori possono accedere a questa sezione. Qui
              puoi gestire i membri del team, i loro ruoli e le competenze.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Come aggiungere un nuovo membro
            </h3>
            <ol className="space-y-2 text-base text-text-secondary mb-4">
              <li className="flex gap-3">
                <span className="text-gold font-semibold">1.</span>
                <span>Vai su &quot;Team&quot; nella barra a sinistra</span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold">2.</span>
                <span>Clicca &quot;+ Aggiungi Membro&quot;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold">3.</span>
                <span>
                  Compila: nome, email, password iniziale, ruolo aziendale e
                  competenze
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-semibold">4.</span>
                <span>Clicca &quot;Aggiungi Membro&quot;</span>
              </li>
            </ol>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Come riassegnare task
            </h3>
            <p className="text-base text-text-secondary mb-4">
              Apri la task cliccandoci sopra, poi dal dettaglio puoi cambiare
              l&apos;assegnazione usando il menu a tendina. Se sei admin, puoi
              riassegnare qualsiasi task a qualsiasi membro.
            </p>
            <ScreenshotPlaceholder caption="Pagina di gestione del team con lista membri e form di aggiunta" />
          </section>

          {/* Glossario */}
          <section id="glossario" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Glossario — Parole che potresti non conoscere
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Ecco una lista semplice dei termini usati nel gestionale:
            </p>

            <div className="space-y-4">
              {[
                {
                  term: "Task",
                  def: "Un'attività singola da completare. Es. \"Creare il logo\" o \"Inviare le email\".",
                },
                {
                  term: "Dashboard",
                  def: "La schermata principale con il riepilogo di tutti i progetti e le task.",
                },
                {
                  term: "Kanban",
                  def: "La vista con le colonne (Da Fare, In Corso, ecc.). Puoi trascinare le task da una colonna all'altra.",
                },
                {
                  term: "Deadline",
                  def: "La data entro cui una task deve essere completata.",
                },
                {
                  term: "Dipendenza",
                  def: "Quando una task non può iniziare finché un'altra non è finita. Es. non puoi stampare prima di avere il design approvato.",
                },
                {
                  term: "Buffer",
                  def: "Giorni extra aggiunti come margine di sicurezza. Serve per gestire imprevisti senza andare in ritardo.",
                },
                {
                  term: "Sprint",
                  def: "Un periodo di lavoro concentrato, di solito 1-2 settimane, dove il team si focalizza su un set specifico di task.",
                },
                {
                  term: "AI / Intelligenza Artificiale",
                  def: "Il sistema che analizza i progetti e suggerisce miglioramenti. Lo trovi nella Chat AI e nelle analisi automatiche.",
                },
              ].map((item) => (
                <div
                  key={item.term}
                  className="border-b border-border pb-3"
                >
                  <dt className="text-base font-semibold text-gold">
                    {item.term}
                  </dt>
                  <dd className="text-base text-text-secondary mt-1">
                    {item.def}
                  </dd>
                </div>
              ))}
            </div>
          </section>

          {/* Footer space */}
          <div className="h-16" />
        </div>
      </div>
    </AuthLayout>
  );
}
