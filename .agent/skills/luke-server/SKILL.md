---
name: luke-server
description: Knowledge and procedures for managing the Ubuntu server (lukeserver) and LukeAPP deployment.
---

# 🖥️ Luke Server Management

This skill contains the comprehensive knowledge base for the Ubuntu server (`lukeserver`), its architecture, deployment pipelines, and future scaling roadmap.

## 🔑 Dashboard & Hardware
- **Host**: `lukeserver` (Asus E402SA Laptop 💻)
- **OS**: Ubuntu 24.04.3 LTS (Kernel 6.14)
- **CPU**: Intel Pentium N3700 (4 cores @ 1.60GHz)
- **Memory**: 4GB RAM (Stable ~800MB used)
- **Storage**: 104GB SSD (21% usage)
- **SSH Alias**: `ssh luke-ssh` (Cloudflare Tunnel: `ssh.lukeapp.me`)
- **Sudo Pass**: `0174` (Stored locally, IGNORED by Git)

## 📁 System Architecture
Current directory structure:
- `~/LukeAPPv3/`: Next.js Production (Branch: `main`) [Port 3000]
- `~/supabase-home/`: Staging Supabase CLI environment.
- `~/deploy/`: Automation (`deploy.sh`, `webhook.js`) [Port 9000]
- `~/n8n/`: Docker Compose deployment for automation [Port 5678]

## 🔄 Deployment Pipeline
The server implements a fully automated "Push-to-Deploy" flow:
1. **Trigger**: Push to GitHub `main` branch.
2. **Endpoint**: `https://deploy.lukeapp.me/webhook` (Cloudflared -> localhost:9000).
3. **Verification**: `webhook.js` validates GitHub HMAC signatures using a secure secret.
4. **Execution**: `deploy.sh` pulls code, installs dependencies if `package.json` changed, runs `npm run build`, and restarts PM2.

### Active Services
| ID/Type | Name | Role | URL |
|---|---|---|---|
| PM2: 0 | `lukeapp-prod` | Production Next.js | `https://lukeapp.me` |
| PM2: 1 | `deploy-webhook` | GitHub Webhook | `https://deploy.lukeapp.me` |
| Docker | `n8n` | Workflow Automation | `https://n8n.lukeapp.me` |

## 🛡️ Security Baseline
- **Access Control**: SSH access is protected by Cloudflare Zero Trust (tunnels).
- **Webhook Security**: Payload verification prevents unauthorized deployment triggers.
- **Environment**: Secrets are managed via `.env` files (ignored by Git).

## 📅 Roadmap (Next Tasks)
- [x] **Self-hosted Supabase**: Install the full Supabase stack (not just CLI) via Docker for data residency and control.
- [x] **n8n Installation**: Deploy n8n for workflow automation and synchronization.
- [ ] **Server Hardening**: Regular `apt upgrade` schedule and system maintenance.
- [ ] **Monitoring**: Implement enhanced logging for the deployment pipeline.

## 🗄️ Supabase Self-Hosted (Docker)
- **Directory**: `~/supabase-docker/docker/`
- **Compose file (local copy)**: `D:\Github\LUKEAPP\supabase-docker-compose.yml`
- **Active Stack**: `db`, `kong`, `auth`, `rest`, `meta`, `studio`, `storage`, `realtime`, `pooler (supavisor)`, `imgproxy`
- *(Services disabled to save RAM: `analytics/logflare`, `vector`, `functions/edge-runtime`, `inbucket`.)*
- **API Gateway (Kong)**: Port `8000` → `api.lukeapp.me`
- **Studio**: Port `54323` → `studio.lukeapp.me` ✅ **Confirmed working**
- **Supavisor (Pooler)**: Port `6543`

### 📋 Startup / Restart Commands
```bash
# Start the stack (from server)
cd ~/supabase-docker/docker && docker compose up -d

# Stop the stack
cd ~/supabase-docker/docker && docker compose down

# Upload a new docker-compose from local machine:
scp ./supabase-docker-compose.yml luke-ssh:~/supabase-docker/docker/docker-compose.yml
```

### ⚠️ Supabase Troubleshooting & CORS
- **Kong CORS Issue**: By default, Kong can reject cross-origin preflight requests (OPTIONS). To fix this, edit the `kong.yml` file (`~/supabase-docker/docker/volumes/api/kong.yml`) and explicitly allow our origins in the `cors` configurations:
  ```yaml
        config:
          origins:
            - "http://localhost:3000"
            - "https://lukeapp.me"
  ```
  Then explicitly restart the gateway: `docker restart supabase-kong supabase-rest`.
- **Systemd Conflict**: There was an old CLI-based systemd service that caused container duplication loops. Make sure `supabase-home.service` remains permanently **disabled** and **stopped**:
  `sudo systemctl stop supabase-home.service`
  `sudo systemctl disable supabase-home.service`
- **Port Conflicts**: Never use `docker start` if there are random container naming collisions. Always cleanly wipe conflicting ghosts with `docker rm -f $(docker ps -aq --filter name=supabase)` before `docker compose up -d [essential_services]`.

## 🛠️ Maintenance Commands
- **Check Deploy Logs**: `tail -n 50 ~/deploy/deploy.log`
- **Check App Status**: `pm2 list`
- **Check Webhook Health**: `curl http://localhost:9000/health`
