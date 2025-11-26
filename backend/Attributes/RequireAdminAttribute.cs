using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Identity;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Attributes;

public class RequireAdminAttribute : TypeFilterAttribute
{
    public RequireAdminAttribute() : base(typeof(RequireAdminFilter))
    {
    }
}

public class RequireAdminFilter : IAsyncActionFilter
{
    private readonly UserManager<User> _userManager;

    public RequireAdminFilter(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userId = context.HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var user = await _userManager.FindByIdAsync(userId);

        if (user == null || !user.IsAdmin)
        {
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }
}
