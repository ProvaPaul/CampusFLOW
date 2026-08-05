FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY CampusFlow.sln ./
COPY src/CampusFlow.Domain/CampusFlow.Domain.csproj src/CampusFlow.Domain/
COPY src/CampusFlow.Application/CampusFlow.Application.csproj src/CampusFlow.Application/
COPY src/CampusFlow.Infrastructure/CampusFlow.Infrastructure.csproj src/CampusFlow.Infrastructure/
COPY src/CampusFlow.Api/CampusFlow.Api.csproj src/CampusFlow.Api/
COPY tests/CampusFlow.Application.Tests/CampusFlow.Application.Tests.csproj tests/CampusFlow.Application.Tests/
RUN dotnet restore src/CampusFlow.Api/CampusFlow.Api.csproj

COPY . .
RUN dotnet publish src/CampusFlow.Api/CampusFlow.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Default port for local `docker compose up` (maps to host 5000, see docker-compose.yml).
# Hosts like Render inject their own PORT env var at runtime — the entrypoint below binds to
# that instead when present, without requiring any change to the local Docker workflow.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT} exec dotnet CampusFlow.Api.dll"]
