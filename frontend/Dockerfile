# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Instalar servidor estático
RUN npm install -g serve

# Copiar arquivos buildados do estágio anterior
COPY --from=build /app/dist ./dist

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["serve", "-s", "dist", "-l", "3000"]
