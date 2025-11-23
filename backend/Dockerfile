# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
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

# Install EF Core tools for migrations
RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"

EXPOSE 5216
ENTRYPOINT ["dotnet", "StopSmoke.Backend.dll"]

