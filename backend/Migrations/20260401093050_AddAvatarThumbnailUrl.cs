using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StopSmoke.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarThumbnailUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarThumbnailUrl",
                table: "AspNetUsers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarThumbnailUrl",
                table: "AspNetUsers");
        }
    }
}
