using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StopSmoke.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddChatFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ClearedHistoryAt",
                table: "ConversationParticipants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBlocked",
                table: "ConversationParticipants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ConversationParticipants",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClearedHistoryAt",
                table: "ConversationParticipants");

            migrationBuilder.DropColumn(
                name: "IsBlocked",
                table: "ConversationParticipants");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ConversationParticipants");
        }
    }
}
