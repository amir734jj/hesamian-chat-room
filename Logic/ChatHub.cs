using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Models;
using static Models.Constants.Actions;

namespace Logic
{
    public class ChatHub : Hub
    {
        // connected IDs
        private static readonly HashSet<string> ConnectedIds = new HashSet<string>();

        public override async Task OnConnectedAsync()
        {
            ConnectedIds.Add(Context.ConnectionId);

            await Clients.All.SendAsync(LogAction, "joined", ConnectedIds.Count);
        }

        public override async Task OnDisconnectedAsync(Exception ex)
        {
            ConnectedIds.Remove(Context.ConnectionId);
            
            await Clients.All.SendAsync(LogAction, "left", ConnectedIds.Count);
        }

        public async Task Echo(Payload message)
        {
            await Clients.All.SendAsync("Inbox", message);
        }
        
        public async Task Announce(Profile profile)
        {
            await Clients.All.SendAsync(AnnounceAction, "Profile", profile.Name);
        }
    }
}