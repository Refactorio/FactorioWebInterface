﻿using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public class FactorioBanManager
    {
        private readonly DbContextFactory _dbContextFactory;
        private readonly ILogger<FactorioBanManager> _logger;
        private readonly IHubContext<FactorioBanHub, IFactorioBanClientMethods> _banHub;

        public event EventHandler<FactorioBanManager, FactorioBanEventArgs> BanChanged;

        public FactorioBanManager(DbContextFactory dbContextFactory,
            ILogger<FactorioBanManager> logger,
            IHubContext<FactorioBanHub, IFactorioBanClientMethods> banHub)
        {
            _dbContextFactory = dbContextFactory;
            _logger = logger;
            _banHub = banHub;

            BanChanged += FactorioBanManager_BanChanged; ;
        }

        private void FactorioBanManager_BanChanged(FactorioBanManager sender, FactorioBanEventArgs eventArgs)
        {
            _ = _banHub.Clients.All.SendBans(eventArgs.ChangeData);
        }

        public async Task<Ban[]> GetBansAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Bans.AsNoTracking().ToArrayAsync();
        }

        public async Task<string[]> GetBanUserNamesAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Bans
                .AsNoTracking()
                .Select(x => x.Username)
                .OrderBy(x => x.ToLowerInvariant())
                .ToArrayAsync();
        }

        public async Task<Result> AddBanFromWeb(Ban ban, bool synchronizeWithServers, string actor)
        {
            List<Error> errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(ban.Username))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Username)));
            }
            if (string.IsNullOrWhiteSpace(ban.Reason))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Reason)));
            }
            if (string.IsNullOrWhiteSpace(ban.Admin))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Admin)));
            }
            if (ban.DateTime == default)
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.DateTime)));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            bool added = await AddBanToDatabase(ban, actor);
            if (added)
            {
                var changedData = CollectionChangedData.Add(new[] { ban });
                var ev = new FactorioBanEventArgs(synchronizeWithServers, "", changedData);

                _ = Task.Run(() => BanChanged?.Invoke(this, ev));

                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToAddBanToDatabaseErrorKey);
            }
        }

        public async Task AddBanFromGame(Ban ban, string serverId)
        {
            bool added = await AddBanToDatabase(ban, ban.Admin);
            if (added)
            {
                var changedData = CollectionChangedData.Add(new[] { ban });
                var ev = new FactorioBanEventArgs(true, serverId, changedData);

                _ = Task.Run(() => BanChanged?.Invoke(this, ev));
            }
        }

        private async Task<bool> AddBanToDatabase(Ban ban, string actor)
        {
            ban.Username = ban.Username.ToLowerInvariant();

            var db = _dbContextFactory.Create<ApplicationDbContext>();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var old = await db.Bans.FirstOrDefaultAsync(b => b.Username == ban.Username);

                try
                {
                    if (old == null)
                    {
                        db.Add(ban);
                    }
                    else
                    {
                        old.Admin = ban.Admin;
                        old.DateTime = ban.DateTime;
                        old.Reason = ban.Reason;
                        db.Update(old);
                    }

                    await db.SaveChangesAsync();

                    _logger.LogInformation("[BAN] {username} was banned by {admin}. Reason: {reason} Actor: {actor}", ban.Username, ban.Admin, ban.Reason, actor);

                    return true;
                }
                catch (DbUpdateConcurrencyException)
                {
                    // This exception is thrown if the old entry no longer exists in the database 
                    // when trying to update it. The solution is to remove the old cached entry
                    // and try again.
                    if (old != null)
                    {
                        db.Entry(old).State = EntityState.Detached;
                    }
                    retryCount--;
                }
                catch (DbUpdateException)
                {
                    // This exception is thrown if the UNQIUE constraint fails, meaning the DataSet
                    // Key pair already exists, when adding a new entry. The solution is to remove
                    // the cached new entry so that the old entry is fetched from the database not
                    // from the cache. Then the new entry can be properly compared and updated.
                    db.Entry(ban).State = EntityState.Detached;
                    retryCount--;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(AddBanToDatabase));
                    return false;
                }
            }

            _logger.LogWarning("AddBanToDatabase failed to add ban: {@Ban}", ban);
            return false;
        }

        public async Task<Result> RemoveBanFromWeb(string username, bool synchronizeWithServers, string actor)
        {
            List<Error> errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(username))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(username)));
            }
            if (string.IsNullOrWhiteSpace(actor))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(actor)));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            bool removed = await RemoveBanFromDatabase(username, actor);
            if (removed)
            {
                var changedData = CollectionChangedData.Remove(new[] { new Ban { Username = username } });
                var ev = new FactorioBanEventArgs(synchronizeWithServers, "", changedData);

                _ = Task.Run(() => BanChanged?.Invoke(this, ev));

                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToRemoveBanFromDatabaseErrorKey);
            }
        }

        public async Task RemoveBanFromGame(string username, string serverId, string actor)
        {
            bool removed = await RemoveBanFromDatabase(username, actor);
            if (removed)
            {
                var changedData = CollectionChangedData.Remove(new[] { new Ban { Username = username } });
                var ev = new FactorioBanEventArgs(true, serverId, changedData);

                _ = Task.Run(() => BanChanged?.Invoke(this, ev));
            }
        }

        private async Task<bool> RemoveBanFromDatabase(string username, string actor)
        {
            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();

                var old = await db.Bans.SingleOrDefaultAsync(b => b.Username == username);
                if (old == null)
                {
                    return true;
                }

                db.Bans.Remove(old);
                await db.SaveChangesAsync();

                _logger.LogInformation("[UNBAN] {username} was unbanned by: {actor}", username, actor);

                return true;
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RemoveBanFromDatabase));
                return false;
            }
        }
    }
}
