# Come mettere online il Gestionale Monichs

Questa guida ti spiega passo-passo come installare il gestionale su un server così che tutto il team possa accedervi da qualsiasi dispositivo.

## Cosa ti serve prima di iniziare

1. **Un server VPS** — Ti consiglio Hetzner (€4.5/mese) o DigitalOcean ($6/mese).
   Scegli un piano con almeno 2GB di RAM e Ubuntu 22.04 o 24.04.
2. **Un dominio** (opzionale ma consigliato) — Es. gestionale.monichs.com
   Puoi comprarlo su Namecheap, GoDaddy, o qualsiasi registrar.
3. **Le API key** — Serve una chiave API di Anthropic (per l'AI) e una di OpenAI (per la trascrizione vocale).
   - Anthropic: vai su console.anthropic.com, crea un account, vai in API Keys
   - OpenAI: vai su platform.openai.com, crea un account, vai in API Keys

## Passo 1 — Collegati al server

Apri il terminale del tuo computer (su Mac: cerca "Terminale", su Windows: usa PowerShell) e scrivi:

```
ssh root@INDIRIZZO_IP_DEL_TUO_SERVER
```

(L'indirizzo IP lo trovi nel pannello di controllo di Hetzner/DigitalOcean)

Ti chiederà la password — scrivila (non vedrai i caratteri, è normale) e premi Invio.

## Passo 2 — Installa Docker

Copia e incolla questi comandi uno alla volta, premendo Invio dopo ognuno:

```
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin
```

Per verificare che funzioni:

```
docker --version
```

Se vedi un numero di versione, sei a posto.

## Passo 3 — Scarica il gestionale

```
git clone https://github.com/TUOREPOSITORY/monichs-gestionale.git
cd monichs-gestionale
```

(Sostituisci l'URL con quello del tuo repository)

## Passo 4 — Configura le password e le chiavi

```
cp .env.production.example .env.production
nano .env.production
```

Si aprirà un editor di testo. Modifica queste righe:

- **DB_PASSWORD**: inventa una password lunga e sicura (es. "Mn7$kP2xWq9!")
- **NEXTAUTH_SECRET**: vai su generate-secret.vercel.app e copia la stringa generata
- **NEXTAUTH_URL**: metti `https://tuodominio.com` (oppure `http://INDIRIZZO_IP:3000` se non hai un dominio)
- **ANTHROPIC_API_KEY**: incolla la tua chiave Anthropic
- **OPENAI_API_KEY**: incolla la tua chiave OpenAI

Per salvare: premi `Ctrl+X`, poi `Y`, poi `Invio`.

## Passo 5 — Avvia tutto

### Senza dominio (accesso tramite IP):

```
docker compose up -d
```

### Con dominio e HTTPS:

```
docker compose -f docker-compose.prod.yml up -d
```

Aspetta circa 2 minuti che tutto si avvii, poi apri il browser e vai su:
- Senza dominio: `http://INDIRIZZO_IP:3000`
- Con dominio: `https://tuodominio.com`

## Passo 6 — Primo accesso

Credenziali admin di default:
- **Email**: gio@monichs.com
- **Password**: admin123

⚠️ **CAMBIA SUBITO LA PASSWORD** dal Profilo dopo il primo accesso!

## Comandi utili

- **Vedere i log**: `docker compose logs -f`
- **Riavviare**: `docker compose restart`
- **Fermare tutto**: `docker compose down`
- **Aggiornare**: `git pull && docker compose up -d --build`

## Qualcosa non funziona?

1. Controlla i log: `docker compose logs -f app`
2. Verifica che le API key siano corrette nel file `.env.production`
3. Assicurati che le porte 80 e 443 (o 3000) non siano bloccate dal firewall:
   ```
   ufw allow 80 && ufw allow 443 && ufw allow 3000
   ```

## Backup del database

Crea un backup:

```
docker compose exec db pg_dump -U monichs monichs_pm > backup_$(date +%Y%m%d).sql
```

Ripristina un backup:

```
cat backup_XXXXXXXX.sql | docker compose exec -T db psql -U monichs monichs_pm
```

Ti consiglio di fare un backup almeno una volta a settimana.
