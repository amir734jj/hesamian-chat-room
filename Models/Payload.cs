using System;

namespace Models
{
    public class Payload
    {
        public DateTimeOffset Time { get; set; }
        
        public string Name { get; set; }
        
        public string Text { get; set; }
        
        public byte[] Voice { get; set; }
    }
}