using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StopSmoke.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddShowInLeaderboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowInLeaderboard",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowInLeaderboard",
                table: "AspNetUsers");
        }
    }
}
