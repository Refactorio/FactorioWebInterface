using Discord;
using Discord.Net;
using FactorioWebInterface.Utils;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IChannelUpdater : IDisposable
    {
        void ScheduleUpdate();
    }

    public sealed class ChannelUpdater : IChannelUpdater
    {
        private static TimeSpan requestTimeout = TimeSpan.FromSeconds(30);
        // Discord rate limits channel updates to 2 per 10 minutes. Waiting 6 minutes keeps us at
        // 2 per window with enough margin for clock skew and the request itself taking time.
        private static TimeSpan throttleTimeout = TimeSpan.FromMinutes(6);

        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<ChannelUpdater> _logger;
        private readonly ITimeSystem _timeSystem;

        private readonly ITextChannel channel;
        private readonly string serverId;

        private readonly ChannelWriter<Unit> queueWriter;

        public ChannelUpdater(
            IFactorioServerDataService factorioServerDataService,
            ILogger<ChannelUpdater> logger,
            ITimeSystem timeSystem,
            ITextChannel channel,
            string serverId)
        {
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;
            _timeSystem = timeSystem;

            this.channel = channel;
            this.serverId = serverId;

            var options = new BoundedChannelOptions(capacity: 1)
            {
                AllowSynchronousContinuations = false,
                SingleReader = true,
                SingleWriter = false,
                FullMode = BoundedChannelFullMode.DropWrite
            };

            var queue = Channel.CreateBounded<Unit>(options);
            queueWriter = queue.Writer;

            QueueConsumer(queue.Reader);
        }

        public void ScheduleUpdate()
        {
            queueWriter.TryWrite(default);
        }

        public void Dispose()
        {
            queueWriter.TryComplete();
        }

        private async void QueueConsumer(ChannelReader<Unit> reader)
        {
            while (await reader.WaitToReadAsync())
            {
                while (reader.TryRead(out _)) { }

                try
                {
                    await DoUpdate();
                }
                catch (OperationCanceledException)
                {
                    ScheduleUpdate();
                }
                catch (RateLimitedException ex)
                {
                    // Expected when we are near the channel update rate limit rather than a
                    // fault, so log it as a warning.
                    _logger.LogWarning(ex, nameof(QueueConsumer));
                    ScheduleUpdate();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(QueueConsumer));
                    ScheduleUpdate();
                }

                // Always throttle, on success and failure alike. Updates are only ever
                // scheduled by server events, so a failure that did not reschedule above
                // would leave the channel stale until the next one, and throttling here
                // bounds those retries to one attempt per throttleTimeout.
                await _timeSystem.Delay(throttleTimeout);
            }
        }

        private async Task DoUpdate()
        {
            var status = await GetChannelStatus();
            string? name = status.Name;
            string? topic = status.Topic;

            if (name == null && topic == null)
            {
                return;
            }

            void Modify(TextChannelProperties props)
            {
                if (name != null)
                {
                    props.Name = name;
                }

                if (topic != null)
                {
                    props.Topic = topic;
                }
            }

            using var tokenSource = new CancellationTokenSource(requestTimeout);

            var requestOptions = new RequestOptions()
            {
                // Do our own rate limiting via throttleTimeout, the library waiting out and
                // retrying rate limits itself just gets cancelled by requestTimeout.
                RetryMode = RetryMode.AlwaysFail,
                CancelToken = tokenSource.Token
            };

            await channel.ModifyAsync(Modify, requestOptions);
        }

        private Task<ChannelStatus> GetChannelStatus()
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out Models.FactorioServerData? serverData))
            {
                return Task.FromResult(new ChannelStatus());
            }

            return serverData.LockAsync(ChannelStatusProvider.GetStatus);
        }
    }
}
