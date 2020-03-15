using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Models;

namespace Logic
{
    public class ChatHub : Hub
    {
        // connected IDs
        private static readonly HashSet<string> ConnectedIds = new HashSet<string>();

        public override async Task OnConnectedAsync()
        {
            ConnectedIds.Add(Context.ConnectionId);

            await Clients.All.SendAsync("Log", "joined", ConnectedIds.Count);
        }

        public override async Task OnDisconnectedAsync(Exception ex)
        {
            ConnectedIds.Remove(Context.ConnectionId);
            
            await Clients.All.SendAsync("Log", "left", ConnectedIds.Count);
        }

        public async Task Echo(Payload message)
        {
            await Clients.All.SendAsync("Inbox", message);
        }
    }
}