using Discord;
using Discord.Commands;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using static FactorioWebInterface.Services.Discord.DiscordBotCommands;

namespace FactorioWebInterface.Services.Discord
{
    public static class DiscordServiceCollectionExtensions
    {
        public static IServiceCollection AddDiscord(this IServiceCollection services)
        {
            return services
                .AddSingleton<DiscordSocketClient>(_ => new DiscordSocketClient(
                    new DiscordSocketConfig()
                    {
                        GatewayIntents =
                            GatewayIntents.AllUnprivileged |
                            GatewayIntents.MessageContent |
                            GatewayIntents.GuildMembers |
                            GatewayIntents.GuildPresences
                    }))
                .AddSingleton<IDiscordClientWrapper, PhysicalDiscordClientWrapper>()
                .AddSingleton<CommandService>()
                .AddSingleton<IDiscordMessageHandlingService, DiscordMessageHandlingService>()
                .AddSingleton<SetServerParameterSummary, SetServerParameterSummary>()
                .AddSingleton(typeof(IDiscordBotHelpService<>), typeof(DiscordBotHelpService<>))
                .AddSingleton<IMessageQueueFactory, MessageQueueFactory>()
                .AddSingleton<IChannelUpdaterFactory, ChannelUpdaterFactory>()
                .AddSingleton<IDiscordServiceConfiguration, DiscordServiceConfiguration>()
                .AddSingleton<IDiscordService, DiscordService>()
                .AddSingleton<DiscordBot>();
        }
    }
}
