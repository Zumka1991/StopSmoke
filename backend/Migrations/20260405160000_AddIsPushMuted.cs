using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StopSmoke.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPushMuted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPushMuted",
                table: "PushSubscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPushMuted",
                table: "PushSubscriptions");
        }
    }
}
