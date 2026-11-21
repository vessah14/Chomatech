# --- Compilation du front (Vite) ---
FROM node:22-alpine AS build
WORKDIR /app

# npm ci : installe exactement les versions de package-lock.json (build reproductible).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vide par défaut : le front appelle alors l'API sur sa propre origine (/api, relayé par nginx).
ARG VITE_API_URL=
ARG VITE_SITE_URL=
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_FACEBOOK_APP_ID=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID
RUN npm run build

# --- Service des fichiers statiques + relais vers l'API ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
