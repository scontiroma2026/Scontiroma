---
name: lavoro-con-sub-agenti
description: Come Claude lavora con i sub-agenti per Sconti Roma: delega, isolamento, e regola dell'interruzione quando un sub-agente ha finito (decisione del titolare, 13/10). Usala ogni volta che deleghi un lavoro o ricevi la consegna di un sub-agente.
---
# Lavoro con i sub-agenti

## Quando delegare
- Il titolare chiede di delegare, oppure il lavoro è lungo (video, documenti lunghi, riprese, test su molti casi): **non intasare la chat principale**.
- Un sub-agente per argomento. Ogni sub-agente riceve un prompt completo e autonomo (regole di progetto, cosa leggere, cosa consegnare).

## Come si lancia (obbligatorio)
- Sempre con **lo stesso modello** della sessione principale, in **background** e con `isolation: "worktree"` (non pestare la working tree condivisa).
- Nel prompt: regole di `CLAUDE.md` (italiano, niente segreti né dati di persone reali, mai il DB di produzione, branch + PR con le 4 sezioni, `docs/STATO.md`, nessuna unione di testi legali), il divieto di spendere crediti o usare servizi a pagamento senza permesso (ElevenLabs incluso) e di pubblicare qualcosa.
- Un sub-agente non unisce, non cancella branch, non pubblica.

## Regola dell'interruzione (vale sempre)
Quando un sub-agente ha finito **mentre stiamo facendo un altro lavoro**:
1. **Dillo subito al titolare**, in poche righe, senza aspettare la fine del lavoro in corso.
2. **Interrompi** il lavoro corrente (ricorda in una riga a che punto era).
3. **Mostra il lavoro svolto:** cosa ha fatto, dove sono i file o la PR (con il link), cosa non torna, cosa deve decidere il titolare. Se ci sono video o immagini, mandali con il caricamento dei file.
4. **Decidiamo insieme.** Se serve, si modifica (rimandando il lavoro al sub-agente con SendMessage o correggendo direttamente).
5. **Poi riprendi il lavoro interrotto** da dove era rimasto, dicendolo in una riga.

## Dopo la consegna
- Controlla il lavoro prima di riferirlo come fatto: guarda i file, i fotogrammi o i test; non dare per scontato quello che dice il rapporto.
- Segnala se il sub-agente ha toccato testi legali (vanno solo in PR, con l'OK del titolare e del consulente) o ha lasciato file che non devono stare nel repository (video, audio, build).
- Se la consegna è duplicata o tardiva, non rifare il lavoro: rispondi in una riga.
