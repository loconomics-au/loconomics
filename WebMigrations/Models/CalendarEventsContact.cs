namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class CalendarEventsContact
    {
        public int Id { get; set; }

        public int IdEvent { get; set; }

        [StringLength(500)]
        public string Contact { get; set; }

        public virtual CalendarEvent CalendarEvent { get; set; }
    }
}
