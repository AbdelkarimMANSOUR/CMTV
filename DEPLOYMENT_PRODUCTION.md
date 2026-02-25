# Deploiement Production (VPS + Nginx + Docker)

Guide simple pour mettre Cabinet Smart en production pour votre cabinet.

## 1) Prerequis VPS

- Ubuntu 22.04+ recommande
- 2 vCPU, 4 Go RAM minimum
- Un domaine (ex: `cabinet.example.com`)
- Ports ouverts: `22`, `80`, `443`

## 2) Installer Docker et Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Reconnectez-vous SSH après `usermod`.

## 3) Recuperer le projet

```bash
git clone https://github.com/AbdelkarimMANSOUR/CMTV.git
cd CMTV
```

## 4) Configurer les variables de production

1. Creer le fichier backend production:

```bash
cp backend/.env.production.example backend/.env.production
```

2. Editer `backend/.env.production`:

- `DATABASE_URL=postgresql://cabinet:<mot_de_passe_fort>@postgres:5432/cabinet`
- `FRONTEND_ORIGIN=https://cabinet.example.com`

3. Creer un fichier `.env` a la racine (utilise par `docker-compose.prod.yml`):

```bash
cat > .env <<'EOF'
POSTGRES_PASSWORD=mot_de_passe_fort
EOF
```

## 5) Lancer en production (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verifier:

```bash
docker compose -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:8080
curl http://127.0.0.1:8080/api/health
```

## 6) Nginx sur le VPS (HTTPS propre)

Cette etape place Nginx devant Docker (recommande pour SSL).

### Installer Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Config Nginx site

```bash
sudo tee /etc/nginx/sites-available/cabinet-smart >/dev/null <<'EOF'
server {
  listen 80;
  server_name cabinet.example.com;

  client_max_body_size 1024M;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

sudo ln -sf /etc/nginx/sites-available/cabinet-smart /etc/nginx/sites-enabled/cabinet-smart
sudo nginx -t
sudo systemctl reload nginx
```

### Activer SSL Let's Encrypt

```bash
sudo certbot --nginx -d cabinet.example.com
```

## 7) Mise a jour applicative

```bash
cd CMTV
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## 8) Sauvegarde base de donnees (important cabinet medical)

```bash
mkdir -p backups
docker exec cabinet-postgres pg_dump -U cabinet cabinet > backups/cabinet-$(date +%F).sql
```

Restauration:

```bash
cat backups/cabinet-YYYY-MM-DD.sql | docker exec -i cabinet-postgres psql -U cabinet -d cabinet
```

## 9) Monitoring rapide

Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Etat:

```bash
docker compose -f docker-compose.prod.yml ps
```

## 10) Notes importantes

- Les medias `localmedia://` sont stockes dans le navigateur local, pas dans le serveur.
- Pour diffusion multi-machines, utilisez des URLs HTTP(S) ou un stockage centralise (S3/MinIO/NAS).
- Mettez en place une sauvegarde automatique quotidienne de PostgreSQL.
- Utilisez des mots de passe forts et limitez l'acces SSH.
