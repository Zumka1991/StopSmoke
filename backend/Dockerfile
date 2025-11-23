# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["StopSmoke.Backend.csproj", "./"]
RUN dotnet restore "StopSmoke.Backend.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "StopSmoke.Backend.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "StopSmoke.Backend.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 5216
ENTRYPOINT ["dotnet", "StopSmoke.Backend.dll"]



