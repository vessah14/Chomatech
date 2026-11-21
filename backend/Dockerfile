# --- Compilation ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend.csproj ./
RUN dotnet restore backend.csproj

COPY . .
RUN dotnet publish backend.csproj -c Release -o /app/publish /p:UseAppHost=false

# --- Exécution ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .

# Dossier des images téléversées, appartenant à l'utilisateur non-root "app" de l'image .NET :
# le volume Docker monté ici hérite de ces droits à sa création.
RUN mkdir -p /app/wwwroot/uploads && chown -R app:app /app/wwwroot
USER app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
