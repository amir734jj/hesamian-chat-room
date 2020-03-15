using System;
using System.IO;

namespace Models
{
    public class Payload
    {
        public DateTimeOffset Time { get; set; }
        
        public string Name { get; set; }
        
        public string Text { get; set; }
        
        public string Voice { get; set; }
    }
}