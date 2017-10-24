namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class CalendarEventsAttendee
    {
        public int Id { get; set; }

        public int IdEvent { get; set; }

        public string Attendee { get; set; }

        [StringLength(50)]
        public string Role { get; set; }

        [StringLength(200)]
        public string Uri { get; set; }

        public virtual CalendarEvent CalendarEvent { get; set; }
    }
}
