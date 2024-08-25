﻿using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace FactorioWebInterface.Pages.Admin
{
    public class ServersModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;
        private readonly IFactorioFileManager _factorioFileManager;
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<ServersModel> _logger;

        public int ServerCount => _factorioServerDataService.ServerCount;
        public int DefaultServer => _factorioServerDataService.DefaultServer;

        public ServersModel(UserManager<ApplicationUser> userManger,
            IFactorioFileManager factorioFileManager,
            IFactorioServerDataService factorioServerDataService,
            ILogger<ServersModel> logger)
        {
            _userManger = userManger;
            _factorioFileManager = factorioFileManager;
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;
        }

        public int Id { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            Id = id ?? DefaultServer;

            var user = await _userManger.GetUserAsync(User);

            if (Id < 1 || Id > _factorioServerDataService.ServerCount)
            {
                return RedirectToPage("Servers", DefaultServer);
            }

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            return Page();
        }

        public async Task<IActionResult> OnGetFile(string serverId, string directory, string name)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            var file = _factorioFileManager.GetSaveFile(serverId, directory, name);
            if (file == null)
            {
                return BadRequest();
            }

            return File(file.OpenRead(), "application/zip", file.Name);
        }

        public async Task<IActionResult> OnGetLogFile(string directory, string name)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            var file = _factorioFileManager.GetLogFile(directory, name);
            if (file == null)
            {
                return BadRequest();
            }

            try
            {
                return File(file.OpenRead(), "application/text", file.Name);
            }
            catch
            {
                return BadRequest();
            }
        }

        public async Task<IActionResult> OnGetChatLogFile(string directory, string name)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            var file = _factorioFileManager.GetChatLogFile(directory, name);
            if (file == null)
            {
                return BadRequest();
            }

            try
            {
                return File(file.OpenRead(), "application/text", file.Name);
            }
            catch
            {
                return BadRequest();
            }
        }

        public async Task<IActionResult> OnPostFileUploadAsync(string serverId, List<IFormFile> files)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            if (string.IsNullOrWhiteSpace(serverId))
            {
                return BadRequest();
            }
            if (files == null || files.Count == 0)
            {
                return BadRequest();
            }

            var result = await _factorioFileManager.UploadFiles(serverId, files);

            return new JsonResult(result);
        }
    }
}