---
name: cloudflare-management
description: Procedures for managing Cloudflare Tunnels (Zero Trust) and DNS routing for LukeAPP.
---

# ☁️ Cloudflare Tunnel Management

This skill documents the management of the Cloudflare Tunnel (`cloudflared`) used to expose internal services of `lukeserver` to the internet securely.

## 🛠️ Infrastructure Overview
- **Active Tunnel**: `luke-home`
- **Tunnel ID**: `010c6e17-af4b-4ce6-bc6e-9fd6ad8beef3`
- **Config Location**: `/etc/cloudflared/config.yml`
- **Credentials**: `/home/cristian/.cloudflared/010c6e17-af4b-4ce6-bc6e-9fd6ad8beef3.json`

## 📋 Common Ingress Rules
To add a new service, edit `/etc/cloudflared/config.yml` and add to the `ingress` section:

```yaml
ingress:
  - hostname: lukeapp.me
    service: http://localhost:3000
  - hostname: api.lukeapp.me
    service: http://localhost:8000
  - hostname: studio.lukeapp.me
    service: http://localhost:54323
  - hostname: n8n.lukeapp.me
    service: http://localhost:5678
  - hostname: ssh.lukeapp.me
    service: ssh://localhost:22
  - service: http_status:404
```

## 🔗 DNS Routing (Crucial Step)
Even if configured in `config.yml`, a subdominio will return `NXDOMAIN` if not routed. Run this command to create the CNAME record automatically:

```bash
cloudflared tunnel route dns luke-home <SUBDOMAIN>.lukeapp.me
```

## 🔄 Lifecycle Commands
- **Restart Service**: `echo 0174 | sudo -S systemctl restart cloudflared`
- **Check Status**: `cloudflared tunnel info luke-home`
- **Check DNS Routes**: `cloudflared tunnel route dns list`
- **View Logs**: `sudo journalctl -u cloudflared -f`

## ⚠️ Troubleshooting
- **NXDOMAIN**: Registration is missing. Use the `route dns` command.
- **Connection Refused**: The local service (e.g., n8n, Next.js) is not running on the expected port.
- **Bad Gateway (502)**: Cloudflared is up, but cannot reach the local port. Check the service status (`pm2 list` or `docker ps`).
