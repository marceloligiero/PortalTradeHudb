#!/usr/bin/env bash
set -euo pipefail

# Setup script to run SQL Server in Docker, create DB and start backend.
# Usage: sudo ./scripts/setup_sql_and_backend.sh  (sudo required for package installs)
# The script will prompt for the SA password if not provided in env var SA_PASSWORD.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SA_PASSWORD="${SA_PASSWORD:-}"
if [ -z "$SA_PASSWORD" ]; then
  echo -n "Enter SA password to use for SQL Server (will be hidden): "
  read -s SA_PASSWORD
  echo
fi

echo "Using SA_PASSWORD set (hidden)."

DOCKER_INSTALLED=0
if command -v docker >/dev/null 2>&1; then
  DOCKER_INSTALLED=1
fi

if [ $DOCKER_INSTALLED -eq 0 ]; then
  echo "Docker not found. Installing Docker Engine (requires sudo)."
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io
  echo "Added $USER to docker group (you may need to logout/login)."
  sudo usermod -aG docker "$USER" || true
else
  echo "Docker already installed."
fi

echo "Pulling SQL Server image and starting container..."
docker pull mcr.microsoft.com/mssql/server:2022-latest

CONTAINER_NAME=sqlserver
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Container ${CONTAINER_NAME} already exists. Stopping and removing..."
  docker rm -f ${CONTAINER_NAME} || true
fi

docker run -e 'ACCEPT_EULA=Y' -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" \
  -p 1433:1433 --name ${CONTAINER_NAME} -d mcr.microsoft.com/mssql/server:2022-latest

echo "Waiting for SQL Server to be ready (this can take 20-40s)..."
set +e
for i in {1..60}; do
  # try a simple query using sqlcmd inside the container
  docker exec ${CONTAINER_NAME} /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" -Q "SELECT 1" >/dev/null 2>&1
  #!/usr/bin/env bash
  set -euo pipefail

  # Setup script to run SQL Server in Docker, create DB and start backend.
  # Usage: sudo ./scripts/setup_sql_and_backend.sh  (sudo required for package installs)
  # The script will prompt for the SA password if not provided in env var SA_PASSWORD.

  REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

  SA_PASSWORD="${SA_PASSWORD:-}"
  if [ -z "$SA_PASSWORD" ]; then
    echo -n "Enter SA password to use for SQL Server (will be hidden): "
    read -s SA_PASSWORD
    echo
  fi

  echo "Using SA_PASSWORD set (hidden)."

  DOCKER_INSTALLED=0
  if command -v docker >/dev/null 2>&1; then
    DOCKER_INSTALLED=1
  fi

  if [ $DOCKER_INSTALLED -eq 0 ]; then
    echo "Docker not found. Installing Docker Engine (requires sudo)."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    echo "Added $USER to docker group (you may need to logout/login)."
    sudo usermod -aG docker "$USER" || true
  else
    echo "Docker already installed."
  fi

  echo "Pulling SQL Server image and starting container..."
  docker pull mcr.microsoft.com/mssql/server:2022-latest

  CONTAINER_NAME=sqlserver
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container ${CONTAINER_NAME} already exists. Stopping and removing..."
    docker rm -f ${CONTAINER_NAME} || true
  fi

  docker run -e 'ACCEPT_EULA=Y' -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" \
    -p 1433:1433 --name ${CONTAINER_NAME} -d mcr.microsoft.com/mssql/server:2022-latest

  echo "Waiting for SQL Server to be ready (this can take 20-40s)..."
  set +e
  for i in {1..60}; do
    # try a simple query using sqlcmd inside the container
    docker exec ${CONTAINER_NAME} /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" -Q "SELECT 1" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "SQL Server is ready."
      break
    fi
    sleep 2
  done
  set -e

  echo "Creating database 'TradeHub' (if not exists)..."
  docker exec -i ${CONTAINER_NAME} /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" -Q "IF DB_ID('TradeHub') IS NULL CREATE DATABASE TradeHub;"

  if [ -f "$REPO_ROOT/backend/create_db_user.sql" ]; then
    echo "Found create_db_user.sql — executing inside container..."
    docker cp "$REPO_ROOT/backend/create_db_user.sql" ${CONTAINER_NAME}:/tmp/create_db_user.sql
    docker exec -i ${CONTAINER_NAME} /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" -i /tmp/create_db_user.sql
  fi

  echo "Do you want to install ODBC driver (msodbcsql18) and build deps for pyodbc on the host? [y/N]"
  read -r INSTALL_ODBC
  if [ "${INSTALL_ODBC,,}" = "y" ]; then
    echo "Installing unixodbc-dev and msodbcsql18 (requires sudo)..."
    sudo apt-get update
    sudo apt-get install -y build-essential unixodbc-dev curl
    curl -sSL https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
    sudo apt-get update
    sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
    echo "ODBC driver installed."
  else
    echo "Skipping ODBC driver installation. If you run the backend on the host and need pyodbc, install unixodbc-dev and msodbcsql18 later."
  fi

  echo "Configuring backend .env..."
  if [ -f "$REPO_ROOT/backend/.env.example" ]; then
    cp -n "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env" || true
    # Replace DATABASE_URL line
    DRIVER_NAME='ODBC Driver 18 for SQL Server'
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=mssql+pyodbc://sa:${SA_PASSWORD}@localhost/TradeHub?driver=$(echo ${DRIVER_NAME} | sed 's/ /+/g')|" "$REPO_ROOT/backend/.env" || true
    echo "Wrote backend/.env with DATABASE_URL (driver: ${DRIVER_NAME}). Edit if necessary."
  else
    echo "backend/.env.example not found — please create backend/.env manually with DATABASE_URL." 
  fi

  echo "Setting up Python virtualenv and installing requirements for backend..."
  pushd "$REPO_ROOT/backend" >/dev/null
  if [ ! -d ".venv" ]; then
    python3 -m venv .venv
  fi
  source .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  deactivate
  popd >/dev/null

  echo "Starting backend (uvicorn) in background and logging to backend/uvicorn.log..."
  pushd "$REPO_ROOT/backend" >/dev/null
  source .venv/bin/activate
  nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 > uvicorn.log 2>&1 &
  sleep 1
  deactivate
  popd >/dev/null

  echo
  echo "Done. Useful checks:
    docker ps --filter name=${CONTAINER_NAME}
    docker logs ${CONTAINER_NAME} --tail 80
    docker exec -i ${CONTAINER_NAME} /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P '${SA_PASSWORD}' -Q "SELECT name FROM sys.databases;"
    tail -n 40 backend/uvicorn.log
  "

  echo "If you added your user to the docker group you may need to logout/login to run docker without sudo."
