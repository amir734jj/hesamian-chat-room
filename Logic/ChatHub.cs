using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cyotek.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Models;
using static Models.Constants.Actions;

namespace Logic
{
    public class ChatHub : Hub
    {
        // Connected IDs
        private static readonly HashSet<string> ConnectionIds = new HashSet<string>();
        
        private static readonly CircularBuffer<(string, object, object)> Buffer = new CircularBuffer<(string, object, object)>(10);

        public override async Task OnConnectedAsync()
        {
            ConnectionIds.Add(Context.ConnectionId);

            var tasks = Buffer.Select(async message =>
            {
                var (method, arg1, arg2) = message;

                // Send to one client
                await Clients.Client(Context.ConnectionId).SendAsync(method, arg1, arg2);
            });
            
            await Task.WhenAll(tasks);
            
            await SendAll(LogAction, "joined", ConnectionIds.Count);
        }

        public override async Task OnDisconnectedAsync(Exception ex)
        {
            ConnectionIds.Remove(Context.ConnectionId);
            
            await SendAll(LogAction, "left", ConnectionIds.Count);
        }

        public async Task Echo(Payload message)
        {
            await SendAll("Inbox", message);
        }
        
        public async Task Announce(Profile profile)
        {
            await SendAll(AnnounceAction, "Profile", profile.Name);
        }

        private async Task SendAll(string method, object arg1, object arg2 = null)
        {
            Buffer.Put((method, arg1, arg2));
            
            await Clients.All.SendAsync(method, arg1, arg2);
        }
    }
}